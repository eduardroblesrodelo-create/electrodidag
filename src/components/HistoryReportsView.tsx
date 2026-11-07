/**
 * ELECTRODIAG - Simulation History & Printable Technical Reports
 * Local storage log viewer, CSV file exporter, and high-fidelity print report generator.
 */

import React, { useState, useEffect } from 'react';
import { SimulationResult, CircuitComponent, SimulationHistoryRecord } from '../types/circuit';
import { AppStorage } from '../utils/storage';
import {
  FileText,
  Download,
  Trash2,
  Printer,
  History,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface HistoryReportsViewProps {
  simulationResult: SimulationResult | null;
  components: CircuitComponent[];
  circuitName: string;
}

export const HistoryReportsView: React.FC<HistoryReportsViewProps> = ({
  simulationResult,
  components,
  circuitName,
}) => {
  const [historyList, setHistoryList] = useState<SimulationHistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'report' | 'history'>('report');

  useEffect(() => {
    setHistoryList(AppStorage.getHistory());
  }, []);

  const handleClearHistory = () => {
    if (confirm('¿Desea vaciar todo el historial de simulaciones guardado?')) {
      AppStorage.clearHistory();
      setHistoryList([]);
    }
  };

  const handleDeleteRecord = (id: string) => {
    AppStorage.deleteHistoryRecord(id);
    setHistoryList((prev) => prev.filter((r) => r.id !== id));
  };

  const handleExportCSV = () => {
    if (!simulationResult) return;
    AppStorage.exportSimulationToCSV(simulationResult, circuitName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header & Mode Switch */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 no-print">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-cyan-400" />
            <span>Reportes Técnicos & Historial de Simulaciones</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generación de dictámenes de ingeniería eléctrica, exportación de datos en formato CSV y registro cronológico.
          </p>
        </div>

        {/* Tab Toggle & Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === 'report' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Informe Técnico
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                activeTab === 'history' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registro Histórico ({historyList.length})
            </button>
          </div>

          {activeTab === 'report' && simulationResult && (
            <>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                title="Descargar datos tabulares en CSV"
              >
                <Download size={13} />
                <span>Exportar CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors shadow-sm"
                title="Imprimir o guardar en PDF"
              >
                <Printer size={13} />
                <span>Imprimir Dictamen</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW 1: PRINTABLE TECHNICAL REPORT */}
      {activeTab === 'report' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 text-slate-300 print-container">
          {/* Engineering Letterhead */}
          <div className="flex justify-between items-start border-b border-slate-700/80 pb-5">
            <div>
              <div className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-sm" />
                <span>ELECTRODIAG | LABORATORIO DE ELECTRODINÁMICA</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Dictamen Técnico de Simulación y Diagnóstico de Redes Eléctricas
              </div>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <div>Fecha: {new Date().toLocaleDateString()}</div>
              <div>Hora: {new Date().toLocaleTimeString()}</div>
              <div className="text-cyan-400 font-bold mt-1">Ref: ED-{Date.now().toString().slice(-6)}</div>
            </div>
          </div>

          {/* Circuit Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Nombre del Modelo</span>
              <span className="text-white font-bold">{circuitName || 'Circuito Electrodiag'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Estado Dictaminado</span>
              <span
                className={`font-bold ${
                  simulationResult?.circuitState === 'NORMAL'
                    ? 'text-emerald-400'
                    : simulationResult?.circuitState === 'ADVERTENCIA'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {simulationResult?.circuitState || 'NO DISPONIBLE'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Régimen Eléctrico</span>
              <span className="text-cyan-300">
                {simulationResult?.isAC ? `AC (${simulationResult.frequency} Hz)` : 'Continua DC'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Componentes Activos</span>
              <span className="text-white">{components.length} elementos</span>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          {simulationResult && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                1. Resumen Ejecutivo de Magnitudes Eléctricas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Tensión de Entrada:</span>
                  <span className="text-white font-bold text-sm">
                    {simulationResult.totalVoltage.toFixed(2)} V
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Corriente Total (I):</span>
                  <span className="text-cyan-400 font-bold text-sm">
                    {simulationResult.totalCurrent.toFixed(2)} A
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Potencia Activa Total (P):</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {simulationResult.totalPower.toFixed(2)} W
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Factor de Potencia (FP):</span>
                  <span className="text-slate-200 font-bold text-sm">
                    {(simulationResult.powerFactor ?? 1).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Diagnóstico de Fallas y Recomendaciones */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              2. Diagnóstico de Anomalías y Fallas Identificadas
            </h2>
            {simulationResult && simulationResult.faults.length > 0 ? (
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Gravedad</th>
                      <th className="p-2.5">Tipo de Falla</th>
                      <th className="p-2.5">Tramo / Componente</th>
                      <th className="p-2.5">Medido</th>
                      <th className="p-2.5">Límite</th>
                      <th className="p-2.5 font-sans">Acción Correctiva Recomendada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {simulationResult.faults.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold uppercase text-[10px]">
                          {f.severity === 'critical' ? (
                            <span className="text-rose-400">Crítica</span>
                          ) : (
                            <span className="text-amber-400">Advertencia</span>
                          )}
                        </td>
                        <td className="p-2.5 text-white font-bold">{f.title}</td>
                        <td className="p-2.5 text-slate-300">{f.locationDescription}</td>
                        <td className="p-2.5 text-cyan-300 tabular-nums">
                          {f.calculatedValue} {f.calculatedUnit}
                        </td>
                        <td className="p-2.5 text-slate-400 tabular-nums">
                          {f.nominalValue} {f.nominalUnit}
                        </td>
                        <td className="p-2.5 text-slate-200 font-sans text-[11px]">
                          {f.recommendations[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 rounded border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>La red opera conforme a especificaciones nominales sin fallas detectadas.</span>
              </div>
            )}
          </div>

          {/* Component Schedule */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              3. Inventario y Estado de Componentes de la Red
            </h2>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Componente</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Tensión Caída (V)</th>
                    <th className="p-2">Corriente (A)</th>
                    <th className="p-2">Potencia (W)</th>
                    <th className="p-2 font-sans">Evaluación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {components.map((c) => {
                    const b = simulationResult?.branchResults.get(c.id);
                    return (
                      <tr key={c.id}>
                        <td className="p-2 text-white font-bold">{c.name}</td>
                        <td className="p-2 text-cyan-400 uppercase text-[10px]">{c.type}</td>
                        <td className="p-2 text-slate-300 tabular-nums">
                          {b ? `${b.voltageDrop.toFixed(2)} V` : '-'}
                        </td>
                        <td className="p-2 text-amber-300 tabular-nums">
                          {b ? `${b.current.toFixed(2)} A` : '-'}
                        </td>
                        <td className="p-2 text-emerald-400 tabular-nums">
                          {b ? `${b.powerActive.toFixed(2)} W` : '-'}
                        </td>
                        <td className="p-2 font-sans text-[11px]">
                          {b?.isOverloaded ? (
                            <span className="text-rose-400 font-bold">Sobrecarga</span>
                          ) : b?.status === 'off' ? (
                            <span className="text-slate-400">Abierto / Inactivo</span>
                          ) : (
                            <span className="text-emerald-400">Conforme</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer & Footer */}
          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed">
            AVISO LEGAL: ELECTRODIAG es un entorno computacional de modelado electrodinámico con fines educativos y de diagnóstico asistido. Este reporte ha sido generado por algoritmos matemáticos deterministas basados en las leyes de Ohm y Kirchhoff. No sustituye la inspección in situ de un ingeniero electricista certificado ni exime del cumplimiento de normativas eléctricas vigentes (RETIE, NOM-001, NEC NFPA 70, IEC 60364).
          </div>
        </div>
      )}

      {/* VIEW 2: HISTORICAL LOG */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History size={16} className="text-cyan-400" />
              <span>Registro Cronológico de Simulaciones Ejecutadas</span>
            </h2>
            {historyList.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={13} />
                <span>Vaciar Historial</span>
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No hay registros de simulación almacenados en la memoria local del navegador.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Fecha y Hora</th>
                    <th className="p-2.5">Circuito</th>
                    <th className="p-2.5">Elementos</th>
                    <th className="p-2.5">Tensión Total</th>
                    <th className="p-2.5">Corriente Total</th>
                    <th className="p-2.5">Potencia Activa</th>
                    <th className="p-2.5 font-sans">Estado</th>
                    <th className="p-2.5">Fallas</th>
                    <th className="p-2.5 text-right font-sans">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {historyList.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-slate-400">{new Date(rec.timestamp).toLocaleString()}</td>
                      <td className="p-2.5 text-white font-bold">{rec.circuitName}</td>
                      <td className="p-2.5 text-slate-300">{rec.componentsCount}</td>
                      <td className="p-2.5 text-cyan-300 tabular-nums">{rec.totalVoltage.toFixed(1)} V</td>
                      <td className="p-2.5 text-amber-300 tabular-nums">{rec.totalCurrent.toFixed(2)} A</td>
                      <td className="p-2.5 text-emerald-400 tabular-nums">{rec.totalPower.toFixed(1)} W</td>
                      <td className="p-2.5 font-sans text-[11px]">
                        <span
                          className={`font-semibold ${
                            rec.circuitState === 'NORMAL'
                              ? 'text-emerald-400'
                              : rec.circuitState === 'ADVERTENCIA'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {rec.circuitState}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold tabular-nums">
                        {rec.faultCount > 0 ? (
                          <span className="text-rose-400">{rec.faultCount}</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Eliminar este registro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
