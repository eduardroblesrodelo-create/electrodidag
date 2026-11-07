/**
 * ELECTRODIAG - System Settings Modal
 * Configures normative thresholds (voltage drop %, overload factor, insulation limit, AC frequency, theme).
 */

import React from 'react';
import { AppSettings } from '../types/circuit';
import { X, Sliders, Moon, Sun, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Configuración & Parámetros
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Umbral de Caída de Tensión */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Límite Admisible de Caída de Tensión (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="15"
              value={localSettings.voltageDropThresholdPercent}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  voltageDropThresholdPercent: parseFloat(e.target.value) || 3.0,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Normativa estándar: 3% para alimentadores ramales, 5% caída total combinada (NEC / IEC 60364).
            </p>
          </div>

          {/* Umbral de Sobrecarga */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Umbral de Alerta de Sobrecarga (% de Inom)
            </label>
            <input
              type="number"
              step="5"
              min="80"
              max="200"
              value={localSettings.overloadWarningPercent}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  overloadWarningPercent: parseFloat(e.target.value) || 100,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Porcentaje a partir del cual se genera alerta térmica en conductores o protecciones (típico: 100%).
            </p>
          </div>

          {/* Límite de Resistencia de Aislamiento */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Resistencia Mínima de Aislamiento (Ω)
            </label>
            <input
              type="number"
              step="100000"
              min="10000"
              value={localSettings.insulationResistanceLimit}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  insulationResistanceLimit: parseFloat(e.target.value) || 1000000,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Valores inferiores a 1,000,000 Ω (1 MΩ) activan diagnóstico de degradación dieléctrica.
            </p>
          </div>

          {/* Frecuencia Base AC */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Frecuencia Base AC (Hz)</label>
            <select
              value={localSettings.defaultACFrequency}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  defaultACFrequency: parseInt(e.target.value, 10) || 60,
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={60}>60 Hz (América: Colombia, EE.UU., México, etc.)</option>
              <option value={50}>50 Hz (Europa, Argentina, Chile, etc.)</option>
            </select>
          </div>

          {/* Opciones del Lienzo */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <label className="flex items-center justify-between text-slate-300 cursor-pointer">
              <span>Ajustar componentes a rejilla (Grid Snap)</span>
              <input
                type="checkbox"
                checked={localSettings.gridSnap}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, gridSnap: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-slate-300 cursor-pointer">
              <span>Animar flujo de corriente en conductores</span>
              <input
                type="checkbox"
                checked={localSettings.showCurrentParticles}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, showCurrentParticles: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Check size={14} />
            <span>Guardar Parámetros</span>
          </button>
        </div>
      </div>
    </div>
  );
};
