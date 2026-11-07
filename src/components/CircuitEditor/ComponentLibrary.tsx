/**
 * ELECTRODIAG - Component Library Palette
 * Categorized component inventory for adding electrical elements to the network canvas.
 */

import React from 'react';
import { ComponentType } from '../../types/circuit';
import {
  BatteryCharging,
  Zap,
  Gauge,
  SlidersHorizontal,
  ShieldAlert,
  Lightbulb,
  Cpu,
  Power,
  RotateCw,
  GitCommit,
  Radio,
  Flame,
} from 'lucide-react';

interface ComponentDefinition {
  type: ComponentType;
  name: string;
  category: 'sources' | 'passives' | 'loads' | 'meters' | 'faults';
  description: string;
  defaultProps: Record<string, any>;
  icon: React.ElementType;
}

export const COMPONENT_CATALOG: ComponentDefinition[] = [
  // Fuentes
  {
    type: 'dc_source',
    name: 'Fuente de Tensión DC',
    category: 'sources',
    description: 'Generador de corriente directa (V, polaridad fija)',
    icon: BatteryCharging,
    defaultProps: { voltage: 24 },
  },
  {
    type: 'ac_source',
    name: 'Fuente de Tensión AC',
    category: 'sources',
    description: 'Generador senoidal alterno (V RMS, frec, fase)',
    icon: Zap,
    defaultProps: { voltage: 120, frequency: 60, phase: 0 },
  },

  // Pasivos y Maniobra
  {
    type: 'resistor',
    name: 'Resistencia Eléctrica',
    category: 'passives',
    description: 'Resistencia pura en ohmios (Ley de Ohm: V = I·R)',
    icon: SlidersHorizontal,
    defaultProps: { resistance: 50, ratedCurrent: 5 },
  },
  {
    type: 'conductor',
    name: 'Conductor / Cable Eléctrico',
    category: 'passives',
    description: 'Tramo de cable con resistencia, longitud y calibre',
    icon: GitCommit,
    defaultProps: { resistance: 0.05, length: 15, crossSection: 2.5, ratedCurrent: 16 },
  },
  {
    type: 'switch',
    name: 'Interruptor de Control',
    category: 'passives',
    description: 'Maniobra de apertura y cierre de ramas',
    icon: Power,
    defaultProps: { isOpen: false, ratedCurrent: 16 },
  },
  {
    type: 'fuse',
    name: 'Fusible de Protección',
    category: 'passives',
    description: 'Protección contra sobrecorriente con disparo',
    icon: ShieldAlert,
    defaultProps: { ratedCurrent: 10, isBlown: false },
  },
  {
    type: 'ground',
    name: 'Tierra / Referencia (0V)',
    category: 'passives',
    description: 'Punto de potencial cero de referencia para la red',
    icon: Radio,
    defaultProps: {},
  },

  // Cargas
  {
    type: 'lamp',
    name: 'Lámpara Incandescente',
    category: 'loads',
    description: 'Carga resistiva con emisión lumínica proporcional',
    icon: Lightbulb,
    defaultProps: { ratedVoltage: 120, ratedPower: 60 },
  },
  {
    type: 'motor',
    name: 'Motor Eléctrico AC/DC',
    category: 'loads',
    description: 'Carga inductiva con potencia nominal e inductancia',
    icon: RotateCw,
    defaultProps: { ratedVoltage: 220, ratedPower: 1500, inductance: 0.05 },
  },
  {
    type: 'load',
    name: 'Carga Industrial',
    category: 'loads',
    description: 'Receptor genérico de potencia configurable',
    icon: Cpu,
    defaultProps: { ratedVoltage: 120, ratedPower: 1000, resistance: 14.4 },
  },

  // Instrumentos de Medida
  {
    type: 'ammeter',
    name: 'Amperímetro Digital',
    category: 'meters',
    description: 'Medición de corriente en serie (impedancia cero)',
    icon: Gauge,
    defaultProps: {},
  },
  {
    type: 'voltmeter',
    name: 'Voltímetro Digital',
    category: 'meters',
    description: 'Medición de tensión en derivación (alta impedancia)',
    icon: Gauge,
    defaultProps: {},
  },

  // Inyectores de Falla
  {
    type: 'fault_short',
    name: 'Inyector de Cortocircuito',
    category: 'faults',
    description: 'Puente directo de impedancia casi nula entre bornes',
    icon: Flame,
    defaultProps: { isFaultActive: true, resistance: 0.002 },
  },
  {
    type: 'fault_leakage',
    name: 'Fuga de Aislamiento a Tierra',
    category: 'faults',
    description: 'Resistencia degradada hacia conductor de protección',
    icon: ShieldAlert,
    defaultProps: { insulationResistance: 500 },
  },
];

interface ComponentLibraryProps {
  onAddComponent: (type: ComponentType, defaultProps: Record<string, any>) => void;
}

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onAddComponent }) => {
  const [activeCategory, setActiveCategory] = React.useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'sources', label: 'Fuentes' },
    { id: 'passives', label: 'Pasivos' },
    { id: 'loads', label: 'Cargas' },
    { id: 'meters', label: 'Medición' },
    { id: 'faults', label: 'Fallos' },
  ];

  const filteredComponents =
    activeCategory === 'all'
      ? COMPONENT_CATALOG
      : COMPONENT_CATALOG.filter((c) => c.category === activeCategory);

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0">
      <div className="p-3 border-b border-slate-800">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Biblioteca de Componentes
        </h2>
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                activeCategory === cat.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredComponents.map((item) => {
          const Icon = item.icon;
          const isFault = item.category === 'faults';
          return (
            <button
              key={item.type}
              onClick={() => onAddComponent(item.type, item.defaultProps)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all group flex items-start gap-3 ${
                isFault
                  ? 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/40 hover:border-rose-700/60'
                  : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2 rounded shrink-0 ${
                  isFault
                    ? 'bg-rose-900/40 text-rose-400'
                    : 'bg-slate-800 text-cyan-400 group-hover:text-cyan-300'
                }`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-2.5 bg-slate-950/80 border-t border-slate-800/80 text-[11px] text-slate-400 leading-tight">
        Haz clic en cualquier componente para agregarlo al lienzo. Conéctalos haciendo clic en sus bornes.
      </div>
    </aside>
  );
};
