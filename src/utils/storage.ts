/**
 * ELECTRODIAG - Local Storage, History, and Export Utilities
 */

import { SavedCircuit, SimulationHistoryRecord, AppSettings, SimulationResult } from '../types/circuit';

const STORAGE_KEY_CIRCUITS = 'electrodiag_saved_circuits_v1';
const STORAGE_KEY_HISTORY = 'electrodiag_sim_history_v1';
const STORAGE_KEY_SETTINGS = 'electrodiag_app_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  voltageDropThresholdPercent: 3.0,
  overloadWarningPercent: 100.0,
  insulationResistanceLimit: 1000000, // 1 MΩ
  defaultACFrequency: 60,
  gridSnap: true,
  gridSize: 20,
  darkMode: true,
  showCurrentParticles: true,
  particleSpeedMultiplier: 1.0,
};

export class AppStorage {
  // --- Circuits ---
  public static getSavedCircuits(): SavedCircuit[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CIRCUITS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveCircuit(circuit: SavedCircuit): void {
    const list = this.getSavedCircuits();
    const idx = list.findIndex((c) => c.id === circuit.id);
    if (idx >= 0) {
      list[idx] = { ...circuit, updatedAt: Date.now() };
    } else {
      list.unshift(circuit);
    }
    localStorage.setItem(STORAGE_KEY_CIRCUITS, JSON.stringify(list));
  }

  public static deleteCircuit(id: string): void {
    const list = this.getSavedCircuits().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CIRCUITS, JSON.stringify(list));
  }

  // --- Simulation History ---
  public static getHistory(): SimulationHistoryRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static addHistoryRecord(record: SimulationHistoryRecord): void {
    const list = this.getHistory();
    list.unshift(record);
    // Keep max 50 recent records
    if (list.length > 50) list.pop();
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list));
  }

  public static clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  }

  public static deleteHistoryRecord(id: string): void {
    const list = this.getHistory().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list));
  }

  // --- Settings ---
  public static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }

  // --- CSV Export ---
  public static exportSimulationToCSV(
    result: SimulationResult,
    circuitName: string = 'Circuito_Electrodiag'
  ): void {
    const lines: string[] = [];

    // Header
    lines.push('ELECTRODIAG - REPORTE DE RESULTADOS DE SIMULACION ELECTRICA');
    lines.push(`Circuito:,"${circuitName}"`);
    lines.push(`Fecha:,"${new Date(result.timestamp).toLocaleString()}"`);
    lines.push(`Estado de Red:,"${result.circuitState}"`);
    lines.push(`Tensión Total (V):,${result.totalVoltage.toFixed(3)}`);
    lines.push(`Corriente Total (A):,${result.totalCurrent.toFixed(3)}`);
    lines.push(`Potencia Activa Total (W):,${result.totalPower.toFixed(3)}`);
    lines.push(`Potencia Reactiva (VAR):,${(result.totalReactivePower ?? 0).toFixed(3)}`);
    lines.push(`Potencia Aparente (VA):,${(result.totalApparentPower ?? 0).toFixed(3)}`);
    lines.push(`Factor de Potencia:,${(result.powerFactor ?? 1).toFixed(3)}`);
    lines.push(`Frecuencia:,${result.isAC ? `${result.frequency} Hz (AC)` : '0 Hz (DC)'}`);
    lines.push('');

    // Branch Results
    lines.push('--- RESULTADOS POR RAMA Y COMPONENTE ---');
    lines.push('ID Componente,Nombre,Tipo,Nodo Inicio,Nodo Fin,Tension (V),Corriente (A),Potencia (W),Impedancia (Ohm),Estado');
    for (const [id, b] of result.branchResults.entries()) {
      lines.push(
        `"${id}","${b.name}","${b.type}",${b.fromNode},${b.toNode},${b.voltageDrop.toFixed(3)},${b.current.toFixed(3)},${b.powerActive.toFixed(3)},${b.resistance.toFixed(4)},"${b.status}"`
      );
    }
    lines.push('');

    // Node Results
    lines.push('--- TENSIONES NODALES (REFERENCIA TIERRA = 0V) ---');
    lines.push('Nodo,Tension (V),Angulo Fase (grados)');
    for (const [nodeId, n] of result.nodeVoltages.entries()) {
      lines.push(`${nodeId},${n.voltage.toFixed(3)},${(n.phaseAngle ?? 0).toFixed(2)}`);
    }
    lines.push('');

    // Faults
    lines.push('--- DIAGNOSTICO DE ANOMALIAS Y FALLAS ---');
    lines.push('Gravedad,Tipo de Falla,Ubicacion,Valor Calculado,Valor Nominal,Diagnostico,Recomendacion');
    for (const f of result.faults) {
      lines.push(
        `"${f.severity}","${f.type}","${f.locationDescription}","${f.calculatedValue} ${f.calculatedUnit}","${f.nominalValue} ${f.nominalUnit}","${f.explanation.replace(/"/g, '""')}","${(f.recommendations[0] || '').replace(/"/g, '""')}"`
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ELECTRODIAG_${circuitName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
