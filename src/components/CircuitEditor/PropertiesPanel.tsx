/**
 * ELECTRODIAG - Component & Wire Properties Inspector
 * Live telemetry readout and physical property configuration.
 */

import React from 'react';
import { CircuitComponent, Wire, BranchResult } from '../../types/circuit';
import { Trash2, RotateCw, ToggleLeft, ToggleRight, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';

interface PropertiesPanelProps {
  selectedComponent: CircuitComponent | null;
  selectedWire: Wire | null;
  branchResult?: BranchResult;
  isSimulating: boolean;
  onUpdateComponent: (updated: CircuitComponent) => void;
  onDeleteComponent: (id: string) => void;
  onUpdateWire: (updated: Wire) => void;
  onDeleteWire: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedComponent,
  selectedWire,
  branchResult,
  isSimulating,
  onUpdateComponent,
  onDeleteComponent,
  onUpdateWire,
  onDeleteWire,
}) => {
  if (!selectedComponent && !selectedWire) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 p-4 text-slate-400 text-xs flex flex-col justify-between shrink-0">
        <div>
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Inspector de Propiedades
          </h2>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-slate-400 leading-relaxed">
            Seleccione un componente o conductor en el lienzo para ver y editar sus parámetros físicos y eléctricos, o consultar sus mediciones en tiempo real.
          </div>
        </div>
        <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
          Atajos: <span className="text-slate-300 font-mono">Supr / Backspace</span> para eliminar selección.
        </div>
      </aside>
    );
  }

  // --- Wire Selected ---
  if (selectedWire) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 p-4 text-slate-200 text-xs flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-cyan-400 font-mono text-[10px] uppercase">Conexión de Cable</span>
              <h2 className="text-sm font-bold text-white">Conductor Eléctrico</h2>
            </div>
            <button
              onClick={() => onDeleteWire(selectedWire.id)}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
              title="Eliminar conductor"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Resistencia Parásita (Ω)</label>
              <input
                type="number"
                step="0.001"
                min="0.0001"
                value={selectedWire.resistance ?? 0.005}
                onChange={(e) =>
                  onUpdateWire({ ...selectedWire, resistance: Math.max(parseFloat(e.target.value) || 0.001, 0.0001) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Capacidad Máxima (A)</label>
              <input
                type="number"
                step="1"
                min="1"
                value={selectedWire.maxCurrent ?? 15}
                onChange={(e) =>
                  onUpdateWire({ ...selectedWire, maxCurrent: Math.max(parseFloat(e.target.value) || 1, 1) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => onDeleteWire(selectedWire.id)}
          className="w-full py-2 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-300 rounded font-medium text-xs transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <Trash2 size={14} /> Eliminar Cable
        </button>
      </aside>
    );
  }

  // --- Component Selected ---
  const comp = selectedComponent!;

  const handleRotate = () => {
    const nextRot = (comp.rotation + 90) % 360;
    onUpdateComponent({ ...comp, rotation: nextRot });
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 p-4 text-slate-200 text-xs flex flex-col justify-between shrink-0 overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span className="text-cyan-400 font-mono text-[10px] uppercase">{comp.type}</span>
            <input
              type="text"
              value={comp.name}
              onChange={(e) => onUpdateComponent({ ...comp, name: e.target.value })}
              className="text-sm font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none px-0 py-0.5"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRotate}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Rotar 90°"
            >
              <RotateCw size={15} />
            </button>
            <button
              onClick={() => onDeleteComponent(comp.id)}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors"
              title="Eliminar elemento"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Live Telemetry Card (When simulating) */}
        {branchResult && (
          <div
            className={`p-3 rounded-lg border text-[11px] space-y-1.5 font-mono ${
              branchResult.isOverloaded
                ? 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between font-sans text-xs font-semibold mb-1 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1">
                <Zap size={13} className="text-cyan-400" /> Telemetría Eléctrica
              </span>
              {branchResult.isOverloaded ? (
                <span className="text-rose-400 flex items-center gap-1 font-bold">
                  <AlertTriangle size={12} /> SOBRECARGA
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Operando
                </span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Caída Tensión (V):</span>
              <span className="text-cyan-300 font-bold tabular-nums">
                {branchResult.voltageDrop.toFixed(3)} V
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Corriente (I):</span>
              <span className="text-amber-300 font-bold tabular-nums">
                {branchResult.current.toFixed(3)} A
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Potencia Activa (P):</span>
              <span className="text-emerald-300 font-bold tabular-nums">
                {branchResult.powerActive.toFixed(2)} W
              </span>
            </div>
            {branchResult.powerReactive !== undefined && branchResult.powerReactive > 0.01 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Potencia Reactiva (Q):</span>
                <span className="text-purple-300 tabular-nums">
                  {branchResult.powerReactive.toFixed(2)} VAR
                </span>
              </div>
            )}
            {branchResult.powerFactor !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-400">Factor de Potencia:</span>
                <span className="text-slate-200 tabular-nums">
                  {branchResult.powerFactor.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Component-Specific Parameters */}
        <div className="space-y-3">
          {/* DC Source */}
          {comp.type === 'dc_source' && (
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Voltaje de Salida (V DC)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={comp.voltage ?? 24}
                onChange={(e) =>
                  onUpdateComponent({ ...comp, voltage: Math.max(parseFloat(e.target.value) || 0, 0) })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* AC Source */}
          {comp.type === 'ac_source' && (
            <>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Voltaje Eficaz (V RMS)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={comp.voltage ?? 120}
                  onChange={(e) =>
                    onUpdateComponent({ ...comp, voltage: Math.max(parseFloat(e.target.value) || 0, 0) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Frecuencia (Hz)</label>
                  <input
                    type="number"
                    step="5"
                    min="1"
                    value={comp.frequency ?? 60}
                    onChange={(e) =>
                      onUpdateComponent({ ...comp, frequency: Math.max(parseFloat(e.target.value) || 1, 1) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Fase Inicial (°)</label>
                  <input
                    type="number"
                    step="15"
                    value={comp.phase ?? 0}
                    onChange={(e) =>
                      onUpdateComponent({ ...comp, phase: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Resistor */}
          {comp.type === 'resistor' && (
            <>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Resistencia (Ω)</label>
                <input
                  type="number"
                  step="1"
                  min="0.01"
                  value={comp.resistance ?? 50}
                  onChange={(e) =>
                    onUpdateComponent({ ...comp, resistance: Math.max(parseFloat(e.target.value) || 0.01, 0.001) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Corriente Nominal Máxima (A)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={comp.ratedCurrent ?? 5}
                  onChange={(e) =>
                    onUpdateComponent({ ...comp, ratedCurrent: Math.max(parseFloat(e.target.value) || 0.1, 0.1) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </>
          )}

          {/* Conductor */}
          {comp.type === 'conductor' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Longitud (m)</label>
                  <input
                    type="number"
                    step="1"
                    min="0.1"
                    value={comp.length ?? 15}
                    onChange={(e) => {
                      const len = Math.max(parseFloat(e.target.value) || 0.1, 0.1);
                      const s = comp.crossSection ?? 2.5;
                      const rho = comp.resistivity ?? 0.0175;
                      onUpdateComponent({ ...comp, length: len, resistance: (rho * len) / s });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Sección (mm²)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={comp.crossSection ?? 2.5}
                    onChange={(e) => {
                      const s = Math.max(parseFloat(e.target.value) || 0.5, 0.2);
                      const len = comp.length ?? 15;
                      const rho = comp.resistivity ?? 0.0175;
                      onUpdateComponent({ ...comp, crossSection: s, resistance: (rho * len) / s });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Capacidad Máxima / Ampacidad (A)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={comp.ratedCurrent ?? 16}
                  onChange={(e) =>
                    onUpdateComponent({ ...comp, ratedCurrent: Math.max(parseFloat(e.target.value) || 1, 1) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 font-mono">
                Resistencia calculada: <span className="text-cyan-400">{((comp.resistance ?? 0.05)).toFixed(4)} Ω</span> (R = ρ·L/S)
              </div>
            </>
          )}

          {/* Switch */}
          {comp.type === 'switch' && (
            <div className="space-y-3">
              <label className="block text-[11px] text-slate-400">Estado de los Contactos</label>
              <button
                onClick={() => onUpdateComponent({ ...comp, isOpen: !comp.isOpen })}
                className={`w-full py-2.5 px-3 rounded flex items-center justify-between font-semibold transition-colors ${
                  comp.isOpen
                    ? 'bg-amber-950/60 border border-amber-800 text-amber-300'
                    : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                }`}
              >
                <span>{comp.isOpen ? 'Abierto (Sin Conducción)' : 'Cerrado (Conduciendo)'}</span>
                {comp.isOpen ? <ToggleLeft size={20} /> : <ToggleRight size={20} />}
              </button>
            </div>
          )}

          {/* Fuse */}
          {comp.type === 'fuse' && (
            <>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Calibre Nominal (A)</label>
                <input
                  type="number"
                  step="1"
                  min="0.5"
                  value={comp.ratedCurrent ?? 10}
                  onChange={(e) =>
                    onUpdateComponent({ ...comp, ratedCurrent: Math.max(parseFloat(e.target.value) || 0.5, 0.5) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <button
                  onClick={() => onUpdateComponent({ ...comp, isBlown: !comp.isBlown })}
                  className={`w-full py-2 rounded border font-medium text-xs transition-colors ${
                    comp.isBlown
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {comp.isBlown ? 'Fusible Disparado (Reemplazar)' : 'Disparar / Fundir Fusible'}
                </button>
              </div>
            </>
          )}

          {/* Lamp */}
          {comp.type === 'lamp' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tensión Nom. (V)</label>
                <input
                  type="number"
                  step="10"
                  min="6"
                  value={comp.ratedVoltage ?? 120}
                  onChange={(e) =>
                    onUpdateComponent({ ...comp, ratedVoltage: Math.max(parseFloat(e.target.value) || 12, 1) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Potencia (W)</label>
                <input
                  type="number"
                  step="10"
                  min="1"
                  value={comp.ratedPower ?? 60}
                  onChange={(e) =>
                    onUpdateComponent({ ...comp, ratedPower: Math.max(parseFloat(e.target.value) || 1, 1) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Motor */}
          {comp.type === 'motor' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tensión (V)</label>
                  <input
                    type="number"
                    step="10"
                    min="12"
                    value={comp.ratedVoltage ?? 220}
                    onChange={(e) =>
                      onUpdateComponent({ ...comp, ratedVoltage: Math.max(parseFloat(e.target.value) || 12, 1) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Potencia (W)</label>
                  <input
                    type="number"
                    step="100"
                    min="10"
                    value={comp.ratedPower ?? 1500}
                    onChange={(e) =>
                      onUpdateComponent({ ...comp, ratedPower: Math.max(parseFloat(e.target.value) || 10, 1) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Inductancia (H)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={comp.inductance ?? 0.05}
                  onChange={(e) =>
                    onUpdateComponent({ ...comp, inductance: Math.max(parseFloat(e.target.value) || 0.001, 0.001) })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </>
          )}

          {/* Fault Short Injection */}
          {comp.type === 'fault_short' && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg space-y-2">
              <div className="font-semibold text-rose-300 text-xs">Simulación de Cortocircuito</div>
              <p className="text-[11px] text-rose-200/80">
                Puente franco entre terminales (R = 0.002 Ω) para estudiar corrientes transitorias y disparo de protecciones.
              </p>
              <button
                onClick={() => onUpdateComponent({ ...comp, isFaultActive: !comp.isFaultActive })}
                className={`w-full py-1.5 rounded font-bold text-xs transition-colors ${
                  comp.isFaultActive
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {comp.isFaultActive ? 'Cortocircuito ACTIVO' : 'Cortocircuito INACTIVO'}
              </button>
            </div>
          )}

          {/* Fault Leakage Injection */}
          {comp.type === 'fault_leakage' && (
            <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-lg space-y-2">
              <div className="font-semibold text-amber-300 text-xs">Fuga de Aislamiento a Tierra</div>
              <div>
                <label className="block text-[11px] text-amber-200/80 mb-1">Resistencia de Fuga (Ω)</label>
                <input
                  type="number"
                  step="50"
                  min="1"
                  value={comp.insulationResistance ?? 500}
                  onChange={(e) =>
                    onUpdateComponent({
                      ...comp,
                      insulationResistance: Math.max(parseFloat(e.target.value) || 1, 1),
                    })
                  }
                  className="w-full bg-slate-950 border border-amber-700/60 rounded px-2.5 py-1.5 font-mono text-amber-300 text-xs focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-800 pt-3">
        <button
          onClick={() => onDeleteComponent(comp.id)}
          className="w-full py-2 bg-rose-950/30 border border-rose-900/50 hover:bg-rose-900/50 text-rose-300 rounded font-medium text-xs transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={14} /> Eliminar Componente
        </button>
      </div>
    </aside>
  );
};
