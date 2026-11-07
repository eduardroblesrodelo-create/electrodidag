/**
 * ELECTRODIAG - Main Dashboard (Panel Principal)
 * Real-time operational KPIs, network status indicators, alert summaries, and quick scenario launcher.
 */

import React from 'react';
import { SimulationResult, CircuitComponent } from '../types/circuit';
import { TEST_SCENARIOS, TestScenario } from '../engine/scenarios';
import {
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Play,
  RotateCcw,
} from 'lucide-react';

interface DashboardViewProps {
  simulationResult: SimulationResult | null;
  components: CircuitComponent[];
  isSimulating: boolean;
  onNavigateToEditor: () => void;
  onNavigateToDiagnostics: () => void;
  onLoadScenario: (scenarioId: string) => void;
  onRunSimulation: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  simulationResult,
  components,
  isSimulating,
  onNavigateToEditor,
  onNavigateToDiagnostics,
  onLoadScenario,
  onRunSimulation,
}) => {
  const state = simulationResult?.circuitState || 'SIMULACION DETENIDA';
  const faults = simulationResult?.faults || [];
  const normalCount = simulationResult?.normalComponentsCount ?? components.length;
  const faultCount = simulationResult?.faultyComponentsCount ?? faults.length;

  // Status color styles
  const getStatusBadge = () => {
    switch (state) {
      case 'NORMAL':
        return (
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 size={18} />
            <span>RED EN ESTADO NORMAL</span>
          </div>
        );
      case 'ADVERTENCIA':
        return (
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle size={18} />
            <span>CONDICIÓN DE ADVERTENCIA</span>
          </div>
        );
      case 'FALLA DETECTADA':
        return (
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <ShieldAlert size={18} />
            <span>FALLA CRÍTICA DETECTADA</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm">
            <Activity size={18} />
            <span>SIMULACIÓN DETENIDA</span>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Banner: Status & Quick Execution */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">
            Estado Operacional de la Red Eléctrica
          </div>
          {getStatusBadge()}
          <p className="text-xs text-slate-400 mt-1">
            Último cálculo:{' '}
            <span className="font-mono text-slate-300">
              {simulationResult ? new Date(simulationResult.timestamp).toLocaleTimeString() : 'Sin ejecución'}
            </span>
            {' · '}
            Régimen:{' '}
            <span className="font-mono text-cyan-400">
              {simulationResult?.isAC ? `Alterna AC (${simulationResult.frequency} Hz)` : 'Continua DC'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunSimulation}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Play size={14} className="fill-current" />
            <span>{isSimulating ? 'Recalcular Red' : 'Iniciar Simulación'}</span>
          </button>
          <button
            onClick={onNavigateToEditor}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-2 transition-colors border border-slate-700"
          >
            <Layers size={14} />
            <span>Abrir Constructor</span>
          </button>
        </div>
      </div>

      {/* 8 Primary Electrical Metric Cards (Tabular Numerals) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tensión Total */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Tensión de Alimentación
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {(simulationResult?.totalVoltage ?? 0).toFixed(2)}
            <span className="text-xs text-slate-400 ml-1.5 font-sans font-normal">V</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {simulationResult?.isAC ? 'Valor Eficaz (RMS)' : 'Potencial DC'}
          </div>
        </div>

        {/* Corriente Total */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Corriente Total Red
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-400 mt-1">
            {(simulationResult?.totalCurrent ?? 0).toFixed(2)}
            <span className="text-xs text-slate-400 ml-1.5 font-sans font-normal">A</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Suma vectorial de ramas</div>
        </div>

        {/* Potencia Total */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Potencia Activa Consumida
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {(simulationResult?.totalPower ?? 0).toFixed(2)}
            <span className="text-xs text-slate-400 ml-1.5 font-sans font-normal">W</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            P = V · I · cos(φ) Joule total
          </div>
        </div>

        {/* Resistencia Equivalente */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            {simulationResult?.isAC ? 'Impedancia Total (Z)' : 'Resistencia Equivalente'}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
            {(simulationResult?.equivalentResistance ?? 0).toFixed(2)}
            <span className="text-xs text-slate-400 ml-1.5 font-sans font-normal">Ω</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Req vista por la fuente
          </div>
        </div>

        {/* Componentes Conectados */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Componentes en Red
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
            {components.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Elementos en el circuito</div>
        </div>

        {/* Componentes Normales */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Elementos Normales
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {normalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Bajo parámetros de diseño</div>
        </div>

        {/* Fallas Detectadas */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Fallas Detectadas
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              faultCount > 0 ? 'text-rose-400' : 'text-slate-400'
            }`}
          >
            {faultCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Anomalías y sobrecargas</div>
        </div>

        {/* Factor de Potencia */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Factor de Potencia (FP)
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-200 mt-1">
            {(simulationResult?.powerFactor ?? 1.0).toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {simulationResult?.isAC ? 'cos(θ) inductivo/capacitivo' : '1.000 (Régimen DC)'}
          </div>
        </div>
      </div>

      {/* Active Faults & Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <span>Diagnósticos y Alertas Activas ({faults.length})</span>
          </h2>
          {faults.length > 0 && (
            <button
              onClick={onNavigateToDiagnostics}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Ver análisis técnico completo</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {faults.length === 0 ? (
          <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center space-y-2">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-white">
              Todos los parámetros eléctricos están dentro de los límites admisibles
            </div>
            <div className="text-xs text-slate-400 max-w-lg mx-auto">
              No se han detectado cortocircuitos, sobrecargas en conductores ni caídas de tensión anormales en la red evaluada.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faults.slice(0, 4).map((f) => (
              <div
                key={f.id}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  f.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-900/60'
                    : 'bg-amber-950/20 border-amber-900/60'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span
                      className={`font-bold uppercase ${
                        f.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {f.title}
                    </span>
                    <span className="text-slate-400">{f.locationDescription}</span>
                  </div>
                  <p className="text-xs text-slate-300">{f.explanation}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>
                    Medido: <b className="text-white font-mono">{f.calculatedValue} {f.calculatedUnit}</b>
                  </span>
                  <span>
                    Límite: <b className="text-white font-mono">{f.nominalValue} {f.nominalUnit}</b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preloaded Test Scenarios Launcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu size={16} className="text-cyan-400" />
              <span>Escenarios de Prueba Verificados</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Circuitos con valores conocidos para contrastar el motor de cálculo y la detección de fallas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEST_SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                    {sc.badge}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {sc.name}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                  {sc.description}
                </p>
                <div className="text-[10px] font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800/80">
                  Esperado: {sc.expectedValues.totalCurrent} @ {sc.expectedValues.totalVoltage}
                </div>
              </div>

              <button
                onClick={() => {
                  onLoadScenario(sc.id);
                  onNavigateToEditor();
                }}
                className="mt-4 w-full py-1.5 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Cargar Escenario</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
