/**
 * ELECTRODIAG - Dedicated Fault Diagnostic & Localization Panel
 * Provides technical failure sheets, root cause analysis, localization, and remedial actions.
 */

import React, { useState } from 'react';
import { SimulationResult, FaultDiagnostic, FaultType } from '../types/circuit';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  Wrench,
  Search,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface FaultDiagnosisViewProps {
  simulationResult: SimulationResult | null;
  onSelectComponentInEditor: (componentId: string) => void;
  onNavigateToEditor: () => void;
}

export const FaultDiagnosisView: React.FC<FaultDiagnosisViewProps> = ({
  simulationResult,
  onSelectComponentInEditor,
  onNavigateToEditor,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const faults = simulationResult?.faults || [];

  const filteredFaults = faults.filter((f) => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (filterSeverity !== 'all' && f.severity !== filterSeverity) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.locationDescription.toLowerCase().includes(q) ||
        f.explanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
            Falla Crítica
          </span>
        );
      case 'warning':
        return (
          <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
            Advertencia Técnica
          </span>
        );
      default:
        return (
          <span className="text-xs font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Informativo
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert size={20} className="text-cyan-400" />
            <span>Módulo de Detección, Localización y Diagnóstico de Fallas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Análisis exhaustivo de cortocircuitos, sobrecargas térmicas, caídas de tensión y fugas de aislamiento.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Total de Anomalías:</span>
          <span
            className={`font-bold px-2.5 py-1 rounded ${
              faults.length > 0 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}
          >
            {faults.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter size={13} /> Filtrar:
          </span>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todos los Tipos</option>
            <option value="short_circuit">Cortocircuitos</option>
            <option value="overload">Sobrecargas Térmicas</option>
            <option value="voltage_drop">Caídas de Tensión</option>
            <option value="open_circuit">Circuitos Abiertos</option>
            <option value="insulation_leakage">Fugas de Aislamiento</option>
          </select>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todas las Gravedades</option>
            <option value="critical">Críticas</option>
            <option value="warning">Advertencias</option>
            <option value="info">Informativas</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por tramo o causa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Diagnostics List */}
      {filteredFaults.length === 0 ? (
        <div className="p-12 bg-slate-900/40 border border-slate-800 rounded-xl text-center space-y-3">
          <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
          <div className="text-sm font-semibold text-white">
            {faults.length === 0
              ? 'No se detectaron fallas en la red eléctrica'
              : 'No hay fallas que coincidan con los filtros seleccionados'}
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Todos los componentes analizados operan dentro de los márgenes nominales de tensión, corriente y disipación de potencia.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFaults.map((fault) => (
            <div
              key={fault.id}
              className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                fault.severity === 'critical'
                  ? 'border-rose-900/80 shadow-sm shadow-rose-950/40'
                  : 'border-slate-800'
              }`}
            >
              {/* Header Strip */}
              <div
                className={`px-5 py-3 flex items-center justify-between border-b ${
                  fault.severity === 'critical'
                    ? 'bg-rose-950/40 border-rose-900/60'
                    : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getSeverityBadge(fault.severity)}
                  <h3 className="text-xs font-bold text-white tracking-wide font-mono">
                    {fault.title}
                  </h3>
                </div>

                {fault.componentId && (
                  <button
                    onClick={() => {
                      onSelectComponentInEditor(fault.componentId!);
                      onNavigateToEditor();
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Localizar en Diagrama</span>
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>

              {/* Technical 8-Point Diagnostic Card Content */}
              <div className="p-5 space-y-4 text-xs">
                {/* 1 & 2: Tramo y Valores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Localización Afectada</span>
                    <span className="text-white font-semibold text-xs mt-0.5 block truncate">
                      {fault.locationDescription}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Valor Medido / Calculado</span>
                    <span className="text-cyan-400 font-bold text-sm mt-0.5 block tabular-nums">
                      {fault.calculatedValue} {fault.calculatedUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Límite Nominal / Esperado</span>
                    <span className="text-slate-300 font-bold text-sm mt-0.5 block tabular-nums">
                      {fault.nominalValue} {fault.nominalUnit}
                      {fault.percentageDiff !== undefined && (
                        <span className="text-rose-400 text-xs ml-2">
                          ({fault.percentageDiff > 0 ? `+${fault.percentageDiff}` : fault.percentageDiff}%)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Explicación Técnica */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Zap size={13} className="text-cyan-400" />
                    <span>Diagnóstico Físico & Técnico</span>
                  </h4>
                  <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded border border-slate-800/60">
                    {fault.explanation}
                  </p>
                </div>

                {/* Posibles Causas & Recomendaciones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Posibles Causas */}
                  <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 space-y-1.5">
                    <h5 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle size={13} />
                      <span>Posibles Causas</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      {fault.probableCauses.map((cause, idx) => (
                        <li key={idx} className="leading-snug">{cause}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recomendaciones Técnicas */}
                  <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 space-y-1.5">
                    <h5 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                      <Wrench size={13} />
                      <span>Recomendaciones Correctivas</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      {fault.recommendations.map((rec, idx) => (
                        <li key={idx} className="leading-snug">{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
