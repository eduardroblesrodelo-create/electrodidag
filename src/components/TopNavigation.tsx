/**
 * ELECTRODIAG - Universal Header (Strict 3-Zone Contract)
 * Zone 1: Single text wordmark
 * Zone 2: Single-line navigation links
 * Zone 3: 1 primary execution action
 */

import React from 'react';
import { Play, Activity, Settings as SettingsIcon } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'editor' | 'diagnostic' | 'analysis' | 'charts' | 'history';

interface TopNavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onOpenSettings: () => void;
  faultCount: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onSelectTab,
  isSimulating,
  onToggleSimulation,
  onOpenSettings,
  faultCount,
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between gap-8 select-none shrink-0 z-20">
      {/* Zone 1: Brand Title */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('dashboard');
          }}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap hover:text-cyan-400 transition-colors flex items-center gap-2"
        >
          <div className="w-2.5 h-2.5 bg-cyan-500 rounded-sm" />
          <span>ELECTRODIAG</span>
        </a>
      </div>

      {/* Zone 2: Nav Links (Clean typography, whitespace-nowrap) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'dashboard'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Panel Principal
        </button>

        <button
          onClick={() => onSelectTab('editor')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'editor'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Constructor de Redes
        </button>

        <button
          onClick={() => onSelectTab('diagnostic')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
            activeTab === 'diagnostic'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <span>Diagnóstico de Fallas</span>
          {faultCount > 0 && (
            <span className="font-mono text-[10px] text-rose-300 font-bold">
              ({faultCount})
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('analysis')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'analysis'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Análisis Matemático
        </button>

        <button
          onClick={() => onSelectTab('charts')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'charts'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Gráficas de Red
        </button>

        <button
          onClick={() => onSelectTab('history')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'history'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Historial y Reportes
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action + Settings */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Configuración de Parámetros y Umbrales"
        >
          <SettingsIcon size={16} />
        </button>

        <button
          onClick={onToggleSimulation}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            isSimulating
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
          }`}
        >
          {isSimulating ? (
            <>
              <Activity size={14} className="animate-spin" />
              <span>Simulando Red</span>
            </>
          ) : (
            <>
              <Play size={14} className="fill-current" />
              <span>Ejecutar Simulación</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
