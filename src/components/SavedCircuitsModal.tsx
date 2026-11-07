/**
 * ELECTRODIAG - Saved Circuits Modal
 * Allows saving current design to LocalStorage and loading previously saved networks.
 */

import React, { useState, useEffect } from 'react';
import { SavedCircuit } from '../types/circuit';
import { AppStorage } from '../utils/storage';
import { FolderOpen, Save, Trash2, X, Check, FileDown } from 'lucide-react';

interface SavedCircuitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCircuit: (circuit: SavedCircuit) => void;
  onSaveCurrentCircuit: (name: string, description: string) => void;
  currentCircuitName: string;
}

export const SavedCircuitsModal: React.FC<SavedCircuitsModalProps> = ({
  isOpen,
  onClose,
  onLoadCircuit,
  onSaveCurrentCircuit,
  currentCircuitName,
}) => {
  const [circuits, setCircuits] = useState<SavedCircuit[]>([]);
  const [saveName, setSaveName] = useState(currentCircuitName);
  const [saveDesc, setSaveDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'load' | 'save'>('load');

  useEffect(() => {
    if (isOpen) {
      setCircuits(AppStorage.getSavedCircuits());
      setSaveName(currentCircuitName);
    }
  }, [isOpen, currentCircuitName]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    onSaveCurrentCircuit(saveName.trim(), saveDesc.trim());
    setCircuits(AppStorage.getSavedCircuits());
    setActiveTab('load');
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este circuito guardado?')) {
      AppStorage.deleteCircuit(id);
      setCircuits((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Gestor de Circuitos Guardados
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 text-xs">
          <button
            onClick={() => setActiveTab('load')}
            className={`flex-1 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'load' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cargar Circuito Existente ({circuits.length})
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-1.5 rounded font-medium transition-colors ${
              activeTab === 'save' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Guardar Red Actual
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {activeTab === 'load' ? (
            circuits.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No hay circuitos guardados en el almacenamiento local. Guarde el circuito actual desde la pestaña "Guardar Red Actual".
              </div>
            ) : (
              <div className="space-y-2">
                {circuits.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {c.components.length} componentes · {c.wires.length} cables ·{' '}
                        {new Date(c.updatedAt || c.createdAt).toLocaleDateString()}
                      </div>
                      {c.description && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                          {c.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onLoadCircuit(c);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium flex items-center gap-1 transition-colors"
                      >
                        <FileDown size={13} />
                        <span>Cargar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Eliminar circuito"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre del Circuito</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Subestación Primaria 120V"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Descripción / Notas Técnicas (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Observaciones de configuración, calibre de conductores, etc."
                  value={saveDesc}
                  onChange={(e) => setSaveDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Save size={14} />
                <span>Guardar en Almacenamiento Local</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
