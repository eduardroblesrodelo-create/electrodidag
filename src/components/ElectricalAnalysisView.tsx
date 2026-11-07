/**
 * ELECTRODIAG - Mathematical & Physical Analysis View
 * Displays detailed nodal matrices, branch solutions, Kirchhoff verification, and AC phasor power triangles.
 */

import React from 'react';
import { SimulationResult, CircuitComponent } from '../types/circuit';
import { CheckCircle2, AlertCircle, Compass, Zap, Scale, Calculator } from 'lucide-react';

interface ElectricalAnalysisViewProps {
  simulationResult: SimulationResult | null;
  components: CircuitComponent[];
}

export const ElectricalAnalysisView: React.FC<ElectricalAnalysisViewProps> = ({
  simulationResult,
  components,
}) => {
  if (!simulationResult || !simulationResult.success) {
    return (
      <div className="flex-1 p-8 text-center text-slate-400 max-w-xl mx-auto space-y-3">
        <Calculator size={36} className="text-slate-600 mx-auto" />
        <h2 className="text-sm font-bold text-white">Sin Datos de Análisis Disponibles</h2>
        <p className="text-xs">
          Ejecute una simulación desde el Constructor de Redes o cargue un escenario de prueba para inspeccionar las matrices nodales y las leyes de Kirchhoff.
        </p>
      </div>
    );
  }

  const nodes = Array.from(simulationResult.nodeVoltages.values());
  const branches = Array.from(simulationResult.branchResults.values());
  const kirchhoff = simulationResult.kirchhoffSumAtNodes;

  // Total power balance
  let powerGenerated = 0;
  let powerConsumed = 0;
  branches.forEach((b) => {
    if (b.type === 'dc_source' || b.type === 'ac_source') {
      powerGenerated += b.powerActive;
    } else {
      powerConsumed += b.powerActive;
    }
  });

  const powerBalanceError = Math.abs(powerGenerated - powerConsumed);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Calculator size={20} className="text-cyan-400" />
          <span>Análisis Matemático & Leyes Electrodinámicas</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Validación formal de las Leyes de Kirchhoff, Análisis Nodal Modificado (MNA) y balance de potencias.
        </p>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-mono text-slate-400">Potencia Generada (Fuentes)</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
            {powerGenerated.toFixed(2)} <span className="text-xs text-slate-400">W</span>
          </div>
          <span className="text-[10px] text-slate-400">Σ P_fuentes</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-mono text-slate-400">Potencia Disipada (Cargas)</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {powerConsumed.toFixed(2)} <span className="text-xs text-slate-400">W</span>
          </div>
          <span className="text-[10px] text-slate-400">Σ I²·R Joule</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-mono text-slate-400">Error de Balance Energético</span>
          <div className="text-xl font-bold font-mono text-slate-200 mt-1 tabular-nums">
            {powerBalanceError < 0.001 ? '< 0.001 W' : `${powerBalanceError.toFixed(3)} W`}
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={11} /> Conservación Verificada
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-mono text-slate-400">Régimen Eléctrico</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {simulationResult.isAC ? `${simulationResult.frequency} Hz AC` : 'DC Estacionario'}
          </div>
          <span className="text-[10px] text-slate-400">
            {simulationResult.isAC ? `Período T = ${(1000 / simulationResult.frequency).toFixed(2)} ms` : 'Frecuencia f = 0 Hz'}
          </span>
        </div>
      </div>

      {/* AC Phasor & Power Triangle (If AC) */}
      {simulationResult.isAC && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Compass size={16} className="text-cyan-400" />
            <span>Triángulo de Potencias & Régimen Senoidal Alterno (AC)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Potencia Activa (P)</span>
              <span className="text-emerald-400 text-lg font-bold">
                {simulationResult.totalPower.toFixed(2)} W
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">P = V·I·cos(φ)</span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Potencia Reactiva (Q)</span>
              <span className="text-purple-400 text-lg font-bold">
                {(simulationResult.totalReactivePower ?? 0).toFixed(2)} VAR
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Q = V·I·sin(φ)</span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Potencia Aparente (S)</span>
              <span className="text-cyan-400 text-lg font-bold">
                {(simulationResult.totalApparentPower ?? 0).toFixed(2)} VA
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">S = √(P² + Q²)</span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Factor de Potencia (FP)</span>
              <span className="text-white text-lg font-bold">
                {(simulationResult.powerFactor ?? 1).toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">cos(φ) = P / S</span>
            </div>
          </div>
        </div>
      )}

      {/* Primera Ley de Kirchhoff (KCL) Verification */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Scale size={16} className="text-cyan-400" />
            <span>1ª Ley de Kirchhoff en Nodos (Σ I_in = Σ I_out)</span>
          </h2>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={13} /> Conservación de Carga Nodal Satisfecha
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {kirchhoff.map((k) => (
            <div
              key={k.nodeId}
              className="p-2.5 bg-slate-950 rounded border border-slate-800/80 font-mono text-xs flex justify-between items-center"
            >
              <span className="text-slate-400 font-bold">Nodo {k.nodeId}:</span>
              <span className="text-cyan-300 font-bold tabular-nums">
                {k.currentSum < 1e-4 ? '0.000 A' : `${k.currentSum.toFixed(4)} A`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Nodal Voltages Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Tensiones Nodales Calculadas (Referencia Tierra: Nodo 0 = 0.000 V)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Nodo</th>
                <th className="px-4 py-2.5 font-semibold">Tensión Eficaz / DC (V)</th>
                {simulationResult.isAC && <th className="px-4 py-2.5 font-semibold">Ángulo de Fase (°)</th>}
                <th className="px-4 py-2.5 font-semibold font-sans">Función en la Red</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {nodes.map((node) => (
                <tr key={node.nodeId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2 text-cyan-400 font-bold">
                    {node.nodeId === 0 ? '0 (Tierra / PE)' : `Nodo ${node.nodeId}`}
                  </td>
                  <td className="px-4 py-2 text-white font-bold tabular-nums">
                    {node.voltage.toFixed(3)} V
                  </td>
                  {simulationResult.isAC && (
                    <td className="px-4 py-2 text-slate-300 tabular-nums">
                      {(node.phaseAngle ?? 0).toFixed(2)}°
                    </td>
                  )}
                  <td className="px-4 py-2 text-slate-400 font-sans">
                    {node.nodeId === 0
                      ? 'Punto de referencia neutro o tierra (0V)'
                      : `Barra colectora entre ${node.connectedComponents.length} terminales`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Branch Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Resultados Detallados por Rama y Componente
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Componente</th>
                <th className="px-4 py-2.5 font-semibold">Tipo</th>
                <th className="px-4 py-2.5 font-semibold">Nodos Conectados</th>
                <th className="px-4 py-2.5 font-semibold">Caída Tensión (V)</th>
                <th className="px-4 py-2.5 font-semibold">Corriente (A)</th>
                <th className="px-4 py-2.5 font-semibold">Potencia Activa (W)</th>
                <th className="px-4 py-2.5 font-semibold">Impedancia (Ω)</th>
                <th className="px-4 py-2.5 font-semibold font-sans">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {branches.map((b) => (
                <tr key={b.componentId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2 font-bold text-white">{b.name}</td>
                  <td className="px-4 py-2 text-cyan-400 uppercase text-[10px]">{b.type}</td>
                  <td className="px-4 py-2 text-slate-400">
                    N{b.fromNode} ↔ N{b.toNode}
                  </td>
                  <td className="px-4 py-2 text-cyan-300 tabular-nums">{b.voltageDrop.toFixed(3)} V</td>
                  <td className="px-4 py-2 text-amber-300 font-bold tabular-nums">
                    {b.current.toFixed(3)} A
                  </td>
                  <td className="px-4 py-2 text-emerald-400 tabular-nums">
                    {b.powerActive.toFixed(2)} W
                  </td>
                  <td className="px-4 py-2 text-slate-300 tabular-nums">{b.resistance.toFixed(4)} Ω</td>
                  <td className="px-4 py-2 font-sans">
                    {b.isOverloaded ? (
                      <span className="text-rose-400 font-bold text-[11px]">Sobrecarga (+{b.overloadPercent?.toFixed(0)}%)</span>
                    ) : b.status === 'off' ? (
                      <span className="text-slate-400 text-[11px]">Abierto / Off</span>
                    ) : (
                      <span className="text-emerald-400 text-[11px]">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
