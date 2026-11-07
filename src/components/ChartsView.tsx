/**
 * ELECTRODIAG - Interactive Engineering Charts & Visualizations
 * Built with Chart.js: branch currents, node voltages, power distribution, voltage drops, and AC waveforms.
 */

import React, { useEffect, useRef } from 'react';
import { SimulationResult, CircuitComponent } from '../types/circuit';
import {
  Chart,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { BarChart3, LineChart, PieChart, Activity } from 'lucide-react';

// Register Chart.js components
Chart.register(
  BarController,
  LineController,
  PieController,
  DoughnutController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

interface ChartsViewProps {
  simulationResult: SimulationResult | null;
  components: CircuitComponent[];
}

export const ChartsView: React.FC<ChartsViewProps> = ({ simulationResult, components }) => {
  const currentChartRef = useRef<HTMLCanvasElement>(null);
  const voltageChartRef = useRef<HTMLCanvasElement>(null);
  const powerChartRef = useRef<HTMLCanvasElement>(null);
  const acWaveChartRef = useRef<HTMLCanvasElement>(null);

  const chartInstances = useRef<Chart[]>([]);

  useEffect(() => {
    // Destroy previous chart instances
    chartInstances.current.forEach((c) => c.destroy());
    chartInstances.current = [];

    if (!simulationResult || !simulationResult.success) return;

    const branches = Array.from(simulationResult.branchResults.values()).filter(
      (b) => b.type !== 'ground' && b.type !== 'voltmeter'
    );
    const nodes = Array.from(simulationResult.nodeVoltages.values());

    // --- 1. Current by Component Chart ---
    if (currentChartRef.current) {
      const labels = branches.map((b) => b.name);
      const measuredCurrents = branches.map((b) => b.current);
      const nominalCurrents = branches.map((b) => {
        const c = components.find((comp) => comp.id === b.componentId);
        return c?.ratedCurrent ?? (c?.type === 'conductor' ? 16 : 10);
      });

      const currentChart = new Chart(currentChartRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Corriente Calculada (A)',
              data: measuredCurrents,
              backgroundColor: branches.map((b) =>
                b.isOverloaded ? 'rgba(239, 68, 68, 0.85)' : 'rgba(56, 189, 248, 0.85)'
              ),
              borderColor: branches.map((b) =>
                b.isOverloaded ? '#ef4444' : '#0284c7'
              ),
              borderWidth: 1.5,
              borderRadius: 4,
            },
            {
              label: 'Capacidad Nominal (A)',
              data: nominalCurrents,
              backgroundColor: 'rgba(148, 163, 184, 0.35)',
              borderColor: '#94a3b8',
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 } },
            },
            tooltip: {
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderWidth: 1,
            },
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8', font: { size: 10 } },
              grid: { color: 'rgba(51, 65, 85, 0.4)' },
            },
            y: {
              ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
              grid: { color: 'rgba(51, 65, 85, 0.4)' },
              title: { display: true, text: 'Amperios (A)', color: '#64748b', font: { size: 11 } },
            },
          },
        },
      });
      chartInstances.current.push(currentChart);
    }

    // --- 2. Nodal Voltages Chart ---
    if (voltageChartRef.current) {
      const nodeLabels = nodes.map((n) => (n.nodeId === 0 ? 'Nodo 0 (GND)' : `Nodo ${n.nodeId}`));
      const nodeVals = nodes.map((n) => n.voltage);

      const voltageChart = new Chart(voltageChartRef.current, {
        type: 'bar',
        data: {
          labels: nodeLabels,
          datasets: [
            {
              label: 'Potencial Nodal (V)',
              data: nodeVals,
              backgroundColor: 'rgba(16, 185, 129, 0.75)',
              borderColor: '#10b981',
              borderWidth: 1.5,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 } },
            },
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8', font: { size: 10 } },
              grid: { color: 'rgba(51, 65, 85, 0.4)' },
            },
            y: {
              ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
              grid: { color: 'rgba(51, 65, 85, 0.4)' },
              title: { display: true, text: 'Voltios (V)', color: '#64748b', font: { size: 11 } },
            },
          },
        },
      });
      chartInstances.current.push(voltageChart);
    }

    // --- 3. Power Distribution Chart (Active Power by Loads) ---
    if (powerChartRef.current) {
      const loadBranches = branches.filter(
        (b) => b.type !== 'dc_source' && b.type !== 'ac_source' && b.powerActive > 0.001
      );
      const labels = loadBranches.map((b) => b.name);
      const powers = loadBranches.map((b) => Number(b.powerActive.toFixed(2)));

      const colors = [
        '#06b6d4',
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#ec4899',
        '#8b5cf6',
        '#14b8a6',
        '#f97316',
      ];

      const powerChart = new Chart(powerChartRef.current, {
        type: 'doughnut',
        data: {
          labels: labels.length > 0 ? labels : ['Sin Carga'],
          datasets: [
            {
              data: powers.length > 0 ? powers : [1],
              backgroundColor: colors.slice(0, Math.max(labels.length, 1)),
              borderColor: '#0f172a',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 12 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw} W`,
              },
            },
          },
        },
      });
      chartInstances.current.push(powerChart);
    }

    // --- 4. AC Waveform or DC Time Horizon ---
    if (acWaveChartRef.current) {
      const freq = simulationResult.isAC ? simulationResult.frequency || 60 : 60;
      const period = 1 / freq; // seconds
      const steps = 60;
      const timePoints: string[] = [];
      const voltageWave: number[] = [];
      const currentWave: number[] = [];

      const vPeak = simulationResult.isAC
        ? simulationResult.totalVoltage * Math.SQRT2
        : simulationResult.totalVoltage;
      const iPeak = simulationResult.isAC
        ? simulationResult.totalCurrent * Math.SQRT2
        : simulationResult.totalCurrent;
      const phi = simulationResult.powerFactor ? Math.acos(simulationResult.powerFactor) : 0;

      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * period;
        timePoints.push(`${(t * 1000).toFixed(1)} ms`);

        if (simulationResult.isAC) {
          const omega = 2 * Math.PI * freq;
          voltageWave.push(Number((vPeak * Math.sin(omega * t)).toFixed(2)));
          currentWave.push(Number((iPeak * Math.sin(omega * t - phi)).toFixed(2)));
        } else {
          voltageWave.push(Number(vPeak.toFixed(2)));
          currentWave.push(Number(iPeak.toFixed(2)));
        }
      }

      const waveChart = new Chart(acWaveChartRef.current, {
        type: 'line',
        data: {
          labels: timePoints,
          datasets: [
            {
              label: simulationResult.isAC ? 'v(t) Tensión Instantánea (V)' : 'V(t) Tensión Constante (V)',
              data: voltageWave,
              borderColor: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3,
              yAxisID: 'yV',
            },
            {
              label: simulationResult.isAC ? 'i(t) Corriente Instantánea (A)' : 'I(t) Corriente Constante (A)',
              data: currentWave,
              borderColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3,
              yAxisID: 'yI',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#cbd5e1', font: { family: 'Plus Jakarta Sans', size: 11 } },
            },
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8', font: { size: 9 }, maxTicksLimit: 12 },
              grid: { color: 'rgba(51, 65, 85, 0.4)' },
            },
            yV: {
              type: 'linear',
              position: 'left',
              ticks: { color: '#38bdf8', font: { family: 'JetBrains Mono', size: 10 } },
              grid: { color: 'rgba(51, 65, 85, 0.4)' },
              title: { display: true, text: 'Voltaje (V)', color: '#38bdf8' },
            },
            yI: {
              type: 'linear',
              position: 'right',
              ticks: { color: '#f59e0b', font: { family: 'JetBrains Mono', size: 10 } },
              grid: { drawOnChartArea: false },
              title: { display: true, text: 'Corriente (A)', color: '#f59e0b' },
            },
          },
        },
      });
      chartInstances.current.push(waveChart);
    }

    return () => {
      chartInstances.current.forEach((c) => c.destroy());
      chartInstances.current = [];
    };
  }, [simulationResult, components]);

  if (!simulationResult || !simulationResult.success) {
    return (
      <div className="flex-1 p-8 text-center text-slate-400 max-w-xl mx-auto space-y-3">
        <BarChart3 size={36} className="text-slate-600 mx-auto" />
        <h2 className="text-sm font-bold text-white">Sin Datos para Gráficas</h2>
        <p className="text-xs">
          Ejecute una simulación desde el Constructor para generar los perfiles gráficos de corriente, tensión y potencia.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-cyan-400" />
          <span>Gráficas & Perfiles Eléctricos</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Visualización comparativa de variables físicas, corrientes por rama, potenciales nodales y ondas temporales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Corrientes por Rama */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity size={15} className="text-cyan-400" />
            <span>Corriente por Componente vs. Capacidad Nominal</span>
          </h2>
          <div className="h-64 w-full">
            <canvas ref={currentChartRef} />
          </div>
        </div>

        {/* Chart 2: Tensiones Nodales */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 size={15} className="text-emerald-400" />
            <span>Perfil de Tensiones Nodales (V)</span>
          </h2>
          <div className="h-64 w-full">
            <canvas ref={voltageChartRef} />
          </div>
        </div>

        {/* Chart 3: Distribución de Potencia */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart size={15} className="text-purple-400" />
            <span>Distribución de Potencia Activa (W) por Cargas</span>
          </h2>
          <div className="h-64 w-full">
            <canvas ref={powerChartRef} />
          </div>
        </div>

        {/* Chart 4: Evolución Temporal AC */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <LineChart size={15} className="text-amber-400" />
            <span>Evolución Temporal de Tensión v(t) y Corriente i(t)</span>
          </h2>
          <div className="h-64 w-full">
            <canvas ref={acWaveChartRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
