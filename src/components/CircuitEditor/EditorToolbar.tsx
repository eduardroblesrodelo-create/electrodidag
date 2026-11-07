/**
 * ELECTRODIAG - Editor Toolbar & Simulation Controls
 * Controls execution state, scenario selection, canvas clearing, and persistence.
 */

import React from 'react';
import { Play, Pause, Square, SkipForward, RotateCcw, FolderOpen, Save, BookOpen } from 'lucide-react';
import { TEST_SCENARIOS } from '../../engine/scenarios';

interface EditorToolbarProps {
  isSimulating: boolean;
  circuitState: 'NORMAL' | 'ADVERTENCIA' | 'FALLA DETECTADA' | 'SIMULACION DETENIDA';
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onStopSimulation: () => void;
  onStepSimulation: () => void;
  onResetCircuit: () => void;
  onLoadScenario: (scenarioId: string) => void;
  onSaveCircuit: () => void;
  onOpenSavedModal: () => void;
  selectedScenarioId?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isSimulating,
  circuitState,
  onStartSimulation,
  onPauseSimulation,
  onStopSimulation,
  onStepSimulation,
  onResetCircuit,
  onLoadScenario,
  onSaveCircuit,
  onOpenSavedModal,
  selectedScenarioId,
}) => {
  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-4 select-none shrink-0">
      {/* Simulation Execution Controls */}
      <div className="flex items-center gap-2">
        {!isSimulating ? (
          <button
            onClick={onStartSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded transition-colors shadow-sm"
          >
            <Play size={14} className="fill-current" />
            <span>Iniciar Simulación</span>
          </button>
        ) : (
          <button
            onClick={onPauseSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded transition-colors"
          >
            <Pause size={14} className="fill-current" />
            <span>Pausar</span>
          </button>
        )}

        <button
          onClick={onStopSimulation}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Detener Simulación"
        >
          <Square size={14} />
        </button>

        <button
          onClick={onStepSimulation}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Paso a Paso"
        >
          <SkipForward size={14} />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        <button
          onClick={onResetCircuit}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded transition-colors text-xs"
          title="Limpiar circuito actual"
        >
          <RotateCcw size={13} />
          <span>Limpiar Lienzo</span>
        </button>
      </div>

      {/* Scenario Loader Dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
          <BookOpen size={13} className="text-cyan-400" />
          <span>Escenario de Prueba:</span>
        </label>
        <select
          value={selectedScenarioId || ''}
          onChange={(e) => {
            if (e.target.value) onLoadScenario(e.target.value);
          }}
          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 font-sans focus:outline-none focus:border-cyan-500"
        >
          <option value="" disabled>
            -- Seleccionar circuito precargado --
          </option>
          {TEST_SCENARIOS.map((sc) => (
            <option key={sc.id} value={sc.id}>
              {sc.name} ({sc.badge})
            </option>
          ))}
        </select>
      </div>

      {/* Persistence & Save */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSaveCircuit}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs border border-slate-700/80"
          title="Guardar circuito en memoria local"
        >
          <Save size={13} />
          <span>Guardar</span>
        </button>
        <button
          onClick={onOpenSavedModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs border border-slate-700/80"
          title="Abrir circuitos guardados"
        >
          <FolderOpen size={13} />
          <span>Cargar</span>
        </button>
      </div>
    </header>
  );
};
