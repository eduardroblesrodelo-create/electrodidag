/**
 * ELECTRODIAG - Fault Detection & Technical Diagnostic Engine
 * Analyzes electrical results against physics criteria, standard codes (IEC/NEC), and component ratings.
 */

import { CircuitComponent, Wire, SimulationResult, FaultDiagnostic, AppSettings } from '../types/circuit';

export class FaultDetector {
  /**
   * Evaluates a simulation result, detects all abnormal electrical conditions,
   * localizes the affected segments/nodes, and generates technical diagnostics.
   */
  public static analyze(
    simulationResult: SimulationResult,
    components: CircuitComponent[],
    wires: Wire[],
    settings: AppSettings
  ): {
    faults: FaultDiagnostic[];
    circuitState: 'NORMAL' | 'ADVERTENCIA' | 'FALLA DETECTADA' | 'SIMULACION DETENIDA';
    normalComponentsCount: number;
    faultyComponentsCount: number;
  } {
    if (!simulationResult.success) {
      return {
        faults: [
          {
            id: `err-${Date.now()}`,
            type: 'singular_matrix',
            severity: 'critical',
            title: 'ANOMALÍA EN RED: CIRCUITO NO RESOLUBLE',
            locationDescription: 'Topología general de la red',
            calculatedValue: 0,
            calculatedUnit: 'V',
            nominalValue: 0,
            nominalUnit: 'V',
            explanation: simulationResult.error || 'La red eléctrica presenta una configuración matemáticamente indeterminada o físicamente inviable.',
            probableCauses: [
              'Nodos flotantes o componentes sin cerrar circuito',
              'Bucle de fuentes de voltaje en paralelo con voltajes discordantes',
              'Falta de conexión a tierra o referencia cero',
            ],
            recommendations: [
              'Verifique que todos los terminales estén conectados con conductores.',
              'Asegúrese de contar con al menos una fuente y un camino cerrado de retorno.',
              'Compruebe que no existan interruptores abiertos en ramas críticas.',
            ],
            timestamp: Date.now(),
          },
        ],
        circuitState: 'SIMULACION DETENIDA',
        normalComponentsCount: 0,
        faultyComponentsCount: components.length,
      };
    }

    const faults: FaultDiagnostic[] = [];
    const faultyComponentIds = new Set<string>();

    const supplyVoltage = simulationResult.totalVoltage;

    // --- A. CORTOCIRCUITOS (Short-Circuits) ---
    for (const [compId, branch] of simulationResult.branchResults.entries()) {
      const comp = components.find((c) => c.id === compId);
      if (!comp) continue;

      // Check for explicit short-circuit element or near-zero impedance branch with massive current
      const isShortElement = comp.type === 'fault_short' && comp.isFaultActive !== false;
      const isExtremeCurrent = branch.current > 40 && branch.resistance < 0.1 && comp.type !== 'ammeter';

      if (isShortElement || isExtremeCurrent) {
        faultyComponentIds.add(compId);
        faults.push({
          id: `fault-short-${compId}`,
          type: 'short_circuit',
          severity: 'critical',
          title: 'FALLA CRÍTICA: CORTOCIRCUITO DIRECTO',
          componentId: compId,
          nodeId: branch.fromNode,
          locationDescription: `Entre Nodo ${branch.fromNode} y Nodo ${branch.toNode} (${comp.name})`,
          calculatedValue: Number(branch.current.toFixed(2)),
          calculatedUnit: 'A',
          nominalValue: comp.ratedCurrent ?? 10,
          nominalUnit: 'A',
          percentageDiff: Number((((branch.current - (comp.ratedCurrent ?? 10)) / (comp.ratedCurrent ?? 10)) * 100).toFixed(1)),
          explanation: `Se detectó una trayectoria de impedancia casi nula (${branch.resistance.toFixed(4)} Ω) sometida a tensión, provocando una elevación brusca de la corriente de cortocircuito (Icc = ${branch.current.toFixed(2)} A).`,
          probableCauses: [
            'Falla franca de aislamiento entre fase/positivo y retorno/tierra.',
            'Conexión accidental o puente de baja impedancia entre nodos principales.',
            'Deterioro severo dieléctrico en bornes de conexión.',
          ],
          recommendations: [
            'Desenergizar inmediatamente la fuente de alimentación mediante el interruptor general.',
            'Inspeccionar físicamente el tramo entre los bornes indicados para remover el puente conductor.',
            'Revisar la coordinación y tiempo de disparo de las protecciones termomagnéticas y fusibles.',
          ],
          timestamp: Date.now(),
        });
      }
    }

    // --- B. SOBRECARGAS (Overloads) ---
    for (const [compId, branch] of simulationResult.branchResults.entries()) {
      const comp = components.find((c) => c.id === compId);
      if (!comp || comp.type === 'dc_source' || comp.type === 'ac_source' || comp.type === 'voltmeter') {
        continue;
      }

      const ratedCurrent = comp.ratedCurrent ?? (comp.type === 'conductor' ? 15 : comp.type === 'fuse' ? 10 : 20);
      const overloadThreshold = ratedCurrent * (settings.overloadWarningPercent / 100);

      // If current exceeds rated capacity, but is not an outright short-circuit (e.g. 100% to 500% rating)
      if (branch.current > overloadThreshold && branch.current <= 40) {
        faultyComponentIds.add(compId);
        const diffPercent = ((branch.current - ratedCurrent) / ratedCurrent) * 100;
        const isCritical = diffPercent > 50;

        faults.push({
          id: `fault-overload-${compId}`,
          type: 'overload',
          severity: isCritical ? 'critical' : 'warning',
          title: `SOBRECARGA ${isCritical ? 'SEVERA' : 'TÉRMICA'} DETECTADA`,
          componentId: compId,
          locationDescription: `Componente ${comp.name} (Tipo: ${comp.type})`,
          calculatedValue: Number(branch.current.toFixed(2)),
          calculatedUnit: 'A',
          nominalValue: ratedCurrent,
          nominalUnit: 'A',
          percentageDiff: Number(diffPercent.toFixed(1)),
          explanation: `La corriente en servicio (${branch.current.toFixed(2)} A) supera la capacidad nominal de conducción del elemento (${ratedCurrent} A) en un ${diffPercent.toFixed(1)}%. Esto genera sobrecalentamiento por efecto Joule (P = ${branch.powerActive.toFixed(2)} W).`,
          probableCauses: [
            'Conexión simultánea de cargas resistivas o inductivas superiores a la capacidad de diseño.',
            'Conductor subdimensionado (sección transversal insuficiente para la demanda).',
            'Fusible o disyuntor mal calibrado frente a la corriente de carga nominal.',
          ],
          recommendations: [
            'Redistribuir o desconectar cargas no críticas conectadas en esta rama.',
            comp.type === 'conductor'
              ? `Reemplazar conductor por calibre superior (actual: ${comp.crossSection ?? 2.5} mm², recomendado: ${((comp.crossSection ?? 2.5) * 1.5).toFixed(1)} mm² o mayor).`
              : 'Verificar la potencia de las cargas aguas abajo y redimensionar el equipo de protección.',
          ],
          timestamp: Date.now(),
        });
      }
    }

    // --- C. CAÍDAS DE TENSIÓN (Voltage Drops) ---
    for (const [compId, branch] of simulationResult.branchResults.entries()) {
      const comp = components.find((c) => c.id === compId);
      if (!comp || comp.type !== 'conductor') continue;

      if (supplyVoltage > 0) {
        const dropPercent = (branch.voltageDrop / supplyVoltage) * 100;
        if (dropPercent > settings.voltageDropThresholdPercent) {
          faultyComponentIds.add(compId);
          const isSevere = dropPercent > settings.voltageDropThresholdPercent * 2;

          faults.push({
            id: `fault-drop-${compId}`,
            type: 'voltage_drop',
            severity: isSevere ? 'critical' : 'warning',
            title: `CAÍDA DE TENSIÓN EXCESIVA EN CONDUCTOR`,
            componentId: compId,
            locationDescription: `Línea conductora ${comp.name} (${comp.length ?? 10} m, ${comp.crossSection ?? 2.5} mm²)`,
            calculatedValue: Number(branch.voltageDrop.toFixed(2)),
            calculatedUnit: 'V',
            nominalValue: Number(((supplyVoltage * settings.voltageDropThresholdPercent) / 100).toFixed(2)),
            nominalUnit: 'V (límite)',
            percentageDiff: Number(dropPercent.toFixed(2)),
            explanation: `La caída de potencial en este tramo conductor es de ${branch.voltageDrop.toFixed(2)} V (${dropPercent.toFixed(1)}% de la tensión de suministro), excediendo el límite normativo de ${settings.voltageDropThresholdPercent}%.`,
            probableCauses: [
              'Longitud excesiva del cableado sin compensación de calibre.',
              'Sección transversal de cobre insuficiente para la corriente transportada.',
              'Resistencia de contacto elevada o material de alta resistividad.',
            ],
            recommendations: [
              'Incrementar la sección transversal del conductor para disminuir la resistencia óhmica (R = ρ·L/S).',
              'Optimizar el trazado de la ruta eléctrica para reducir la distancia física entre la fuente y el receptor.',
              'Instalar compensación de tensión o derivación intermedia.',
            ],
            timestamp: Date.now(),
          });
        }
      }
    }

    // --- D. CIRCUITOS ABIERTOS (Open Circuits / Discontinuities) ---
    const openSwitches = components.filter((c) => c.type === 'switch' && c.isOpen);
    const blownFuses = components.filter((c) => c.type === 'fuse' && c.isBlown);

    for (const sw of openSwitches) {
      faults.push({
        id: `fault-open-${sw.id}`,
        type: 'open_circuit',
        severity: 'info',
        title: 'DISCONTINUIDAD: INTERRUPTOR EN POSICIÓN ABIERTA',
        componentId: sw.id,
        locationDescription: `Interruptor de control ${sw.name}`,
        calculatedValue: 0,
        calculatedUnit: 'A',
        nominalValue: sw.ratedCurrent ?? 10,
        nominalUnit: 'A',
        explanation: `El circuito se encuentra interrumpido mecánicamente en el componente ${sw.name}. La rama conectada aguas abajo no recibe alimentación.`,
        probableCauses: ['Maniobra manual de desconexión o paro de emergencia activo.'],
        recommendations: ['Cerrar el interruptor para restablecer el suministro si las condiciones de seguridad son óptimas.'],
        timestamp: Date.now(),
      });
    }

    for (const fuse of blownFuses) {
      faultyComponentIds.add(fuse.id);
      faults.push({
        id: `fault-blown-${fuse.id}`,
        type: 'open_circuit',
        severity: 'warning',
        title: 'FUSIBLE DISPARADO / ABIERTO',
        componentId: fuse.id,
        locationDescription: `Protección fusible ${fuse.name}`,
        calculatedValue: 0,
        calculatedUnit: 'A (abierto)',
        nominalValue: fuse.ratedCurrent ?? 10,
        nominalUnit: 'A (calibre)',
        explanation: `El elemento fusible operó y se encuentra fundido/abierto tras una sobrecorriente o cortocircuito previo, interrumpiendo la circulación de corriente.`,
        probableCauses: ['Disparo por sobrecorriente sostenida o cortocircuito transitorio.'],
        recommendations: [
          'Verificar la ausencia de cortocircuitos aguas abajo antes de reponer el elemento.',
          'Reemplazar el cartucho fusible por uno del mismo calibre y curva de operación rápida/retardada.',
        ],
        timestamp: Date.now(),
      });
    }

    // Identify loads receiving zero voltage/power when main source is energized
    if (supplyVoltage > 0) {
      for (const comp of components) {
        if (comp.type === 'lamp' || comp.type === 'motor' || comp.type === 'load') {
          const branch = simulationResult.branchResults.get(comp.id);
          if (branch && branch.voltageDrop < 0.5 && branch.current < 0.01) {
            faults.push({
              id: `fault-unpowered-${comp.id}`,
              type: 'open_circuit',
              severity: 'warning',
              title: `CARGA DESENERGIZADA (SIN SUMINISTRO)`,
              componentId: comp.id,
              locationDescription: `Receptor ${comp.name} (Tipo: ${comp.type})`,
              calculatedValue: Number(branch.voltageDrop.toFixed(2)),
              calculatedUnit: 'V',
              nominalValue: comp.ratedVoltage ?? 120,
              nominalUnit: 'V',
              explanation: `El receptor no recibe tensión operativa (0.0 V). Existe una discontinuidad en la línea de alimentación o el circuito de retorno está interrumpido.`,
              probableCauses: [
                'Interruptor o fusible abierto en la línea aguas arriba.',
                'Conductor desconectado o borne sin contacto físico.',
              ],
              recommendations: [
                'Revisar la continuidad del cableado desde la barra de distribución hasta el receptor.',
              ],
              timestamp: Date.now(),
            });
          }
        }
      }
    }

    // --- E. FALLAS DE AISLAMIENTO (Insulation Leakage) ---
    for (const comp of components) {
      if (comp.type === 'fault_leakage') {
        const rLeak = comp.insulationResistance ?? 500;
        const branch = simulationResult.branchResults.get(comp.id);
        const leakCurrent = branch ? branch.current : supplyVoltage / rLeak;
        const leakCurrentmA = leakCurrent * 1000;

        faultyComponentIds.add(comp.id);
        const isHazardous = leakCurrentmA > 30; // 30 mA IEC threshold for ventricular fibrillation

        faults.push({
          id: `fault-leak-${comp.id}`,
          type: 'insulation_leakage',
          severity: isHazardous ? 'critical' : 'warning',
          title: `FALLA DE AISLAMIENTO: FUGA A TIERRA`,
          componentId: comp.id,
          locationDescription: `Punto de aislamiento ${comp.name} hacia conductor de protección (PE)`,
          calculatedValue: Number(leakCurrentmA.toFixed(1)),
          calculatedUnit: 'mA',
          nominalValue: 0,
          nominalUnit: 'mA (ideal)',
          explanation: `Se detectó degradación del aislamiento galvánico (R_ais = ${rLeak.toLocaleString()} Ω), con corriente de fuga a tierra de ${leakCurrentmA.toFixed(1)} mA.${isHazardous ? ' ¡PELIGRO DE ELECTROCUCIÓN (supera el umbral de seguridad de 30 mA)!' : ''}`,
          probableCauses: [
            'Humedad, suciedad conductiva o contaminación en envolventes y bornes.',
            'Envejecimiento térmico o abrasión mecánica de la cubierta dieléctrica del cable.',
            'Avería en devanados del receptor en contacto con la carcasa metálica.',
          ],
          recommendations: [
            'Verificar la operación del interruptor diferencial (RCD/GFCI) de 30 mA.',
            'Ejecutar prueba de resistencia de aislamiento con megóhmetro (mínimo exigido: > 1 MΩ a 500V DC).',
            'Reemplazar el tramo conductor o reparar el aislamiento defectuoso.',
          ],
          timestamp: Date.now(),
        });
      }
    }

    // Determine overall circuit state
    let state: 'NORMAL' | 'ADVERTENCIA' | 'FALLA DETECTADA' | 'SIMULACION DETENIDA' = 'NORMAL';
    const hasCritical = faults.some((f) => f.severity === 'critical');
    const hasWarning = faults.some((f) => f.severity === 'warning');

    if (hasCritical) {
      state = 'FALLA DETECTADA';
    } else if (hasWarning) {
      state = 'ADVERTENCIA';
    } else {
      state = 'NORMAL';
    }

    const faultyCount = faultyComponentIds.size;
    const normalCount = Math.max(components.length - faultyCount, 0);

    return {
      faults,
      circuitState: state,
      normalComponentsCount: normalCount,
      faultyComponentsCount: faultyCount,
    };
  }
}
