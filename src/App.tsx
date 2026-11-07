/**
 * ELECTRODIAG - Intelligent Electrical Network Simulation & Fault Diagnostic Suite
 * Main Application Coordinator
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CircuitComponent,
  Wire,
  SimulationResult,
  ComponentType,
  SavedCircuit,
  AppSettings,
  Pin,
} from './types/circuit';
import { CircuitEngine } from './engine/circuitEngine';
import { FaultDetector } from './engine/faultDetector';
import { TEST_SCENARIOS } from './engine/scenarios';
import { AppStorage, DEFAULT_SETTINGS } from './utils/storage';

// UI Modules
import { TopNavigation, ActiveTab } from './components/TopNavigation';
import { DashboardView } from './components/DashboardView';
import { EditorCanvas } from './components/CircuitEditor/EditorCanvas';
import { ComponentLibrary } from './components/CircuitEditor/ComponentLibrary';
import { PropertiesPanel } from './components/CircuitEditor/PropertiesPanel';
import { EditorToolbar } from './components/CircuitEditor/EditorToolbar';
import { FaultDiagnosisView } from './components/FaultDiagnosisView';
import { ElectricalAnalysisView } from './components/ElectricalAnalysisView';
import { ChartsView } from './components/ChartsView';
import { HistoryReportsView } from './components/HistoryReportsView';
import { SettingsModal } from './components/SettingsModal';
import { SavedCircuitsModal } from './components/SavedCircuitsModal';

export default function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => AppStorage.getSettings());

  // Circuit Model: Initialize with Scenario 1 (Series Resistor Network)
  const defaultScenario = TEST_SCENARIOS[0];
  const [circuitName, setCircuitName] = useState<string>(defaultScenario.name);
  const [components, setComponents] = useState<CircuitComponent[]>(defaultScenario.components);
  const [wires, setWires] = useState<Wire[]>(defaultScenario.wires);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(defaultScenario.id);

  // Selection
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Ref to hold current state for keyboard handler
  const stateRef = useRef({ selectedComponentId, selectedWireId, components, wires });
  stateRef.current = { selectedComponentId, selectedWireId, components, wires };

  // Core Simulation Solver Function
  const runSimulationCalculation = useCallback(
    (currentComponents: CircuitComponent[], currentWires: Wire[]) => {
      const rawResult = CircuitEngine.simulate(
        currentComponents,
        currentWires,
        settings.defaultACFrequency
      );

      const diagnosis = FaultDetector.analyze(
        rawResult,
        currentComponents,
        currentWires,
        settings
      );

      const completeResult: SimulationResult = {
        ...rawResult,
        circuitState: diagnosis.circuitState,
        faults: diagnosis.faults,
        normalComponentsCount: diagnosis.normalComponentsCount,
        faultyComponentsCount: diagnosis.faultyComponentsCount,
      };

      setSimulationResult(completeResult);

      // Record to history if running and valid
      if (rawResult.success) {
        AppStorage.addHistoryRecord({
          id: `hist-${Date.now()}`,
          circuitName: circuitName,
          timestamp: Date.now(),
          durationMs: 12,
          totalVoltage: completeResult.totalVoltage,
          totalCurrent: completeResult.totalCurrent,
          totalPower: completeResult.totalPower,
          faultCount: diagnosis.faults.length,
          circuitState: diagnosis.circuitState,
          componentsCount: currentComponents.length,
          faultsSummary: diagnosis.faults.map((f) => ({
            type: f.type,
            severity: f.severity,
            location: f.locationDescription,
          })),
        });
      }
    },
    [settings, circuitName]
  );

  // Initial Calculation on mount
  useEffect(() => {
    runSimulationCalculation(components, wires);
  }, []);

  // Continuous auto-simulation update whenever circuit topology changes
  useEffect(() => {
    if (isSimulating) {
      runSimulationCalculation(components, wires);
    }
  }, [components, wires, isSimulating, runSimulationCalculation]);

  // Dark mode DOM synchronizer
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Keyboard shortcut listener (Delete/Backspace to remove selected element)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedComponentId, selectedWireId } = stateRef.current;
        if (selectedComponentId) {
          handleDeleteComponent(selectedComponentId);
        } else if (selectedWireId) {
          handleDeleteWire(selectedWireId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Component Handlers ---
  const handleAddComponent = (type: ComponentType, defaultProps: Record<string, any>) => {
    const id = `comp-${type}-${Date.now().toString().slice(-5)}`;
    let pins: Pin[] = [];

    // Assign standard terminal pins based on orientation and component type
    if (type === 'ground') {
      pins = [{ id: 'p1', label: 'GND', x: 0, y: -20 }];
    } else if (
      type === 'resistor' ||
      type === 'conductor' ||
      type === 'switch' ||
      type === 'fuse' ||
      type === 'ammeter'
    ) {
      pins = [
        { id: 'p1', label: 'A', x: -40, y: 0 },
        { id: 'p2', label: 'B', x: 40, y: 0 },
      ];
    } else {
      pins = [
        { id: 'p1', label: type === 'dc_source' ? '+' : type === 'ac_source' ? '~' : 'A', x: 0, y: -40 },
        { id: 'p2', label: type === 'dc_source' ? '-' : type === 'ac_source' ? 'N' : 'B', x: 0, y: 40 },
      ];
    }

    // Default label naming
    const count = components.filter((c) => c.type === type).length + 1;
    const typeLabel =
      type === 'dc_source'
        ? `Fuente DC ${count}`
        : type === 'ac_source'
        ? `Fuente AC ${count}`
        : type === 'resistor'
        ? `Resistencia R${count}`
        : type === 'conductor'
        ? `Conductor C${count}`
        : type === 'switch'
        ? `Interruptor S${count}`
        : type === 'fuse'
        ? `Fusible F${count}`
        : type === 'lamp'
        ? `Lámpara L${count}`
        : type === 'motor'
        ? `Motor M${count}`
        : type === 'load'
        ? `Carga ${count}`
        : type === 'ground'
        ? `Tierra ${count}`
        : type === 'ammeter'
        ? `Amperímetro ${count}`
        : type === 'voltmeter'
        ? `Voltímetro ${count}`
        : type === 'fault_short'
        ? `Cortocircuito ${count}`
        : `Fuga Tierra ${count}`;

    // Place at slightly staggered center
    const x = 320 + (components.length % 5) * 30;
    const y = 200 + (components.length % 4) * 30;

    const newComp: CircuitComponent = {
      id,
      type,
      name: typeLabel,
      x,
      y,
      rotation: 0,
      pins,
      ...defaultProps,
    };

    setComponents((prev) => [...prev, newComp]);
    setSelectedComponentId(id);
    setSelectedWireId(null);
  };

  const handleUpdateComponent = (updated: CircuitComponent) => {
    setComponents((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleUpdateComponentPosition = (id: string, x: number, y: number) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, x, y } : c)));
  };

  const handleDeleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    // Remove all wires connected to this component
    setWires((prev) =>
      prev.filter((w) => w.fromComponentId !== id && w.toComponentId !== id)
    );
    if (selectedComponentId === id) setSelectedComponentId(null);
  };

  // --- Wire Handlers ---
  const handleAddWire = (
    fromCompId: string,
    fromPinId: string,
    toCompId: string,
    toPinId: string
  ) => {
    // Check if wire already exists
    const exists = wires.some(
      (w) =>
        (w.fromComponentId === fromCompId &&
          w.fromPinId === fromPinId &&
          w.toComponentId === toCompId &&
          w.toPinId === toPinId) ||
        (w.fromComponentId === toCompId &&
          w.fromPinId === toPinId &&
          w.toComponentId === fromCompId &&
          w.toPinId === fromPinId)
    );

    if (exists) return;

    const newWire: Wire = {
      id: `w-${Date.now().toString().slice(-6)}`,
      fromComponentId: fromCompId,
      fromPinId: fromPinId,
      toComponentId: toCompId,
      toPinId: toPinId,
      resistance: 0.005,
      maxCurrent: 16,
    };

    setWires((prev) => [...prev, newWire]);
    setSelectedWireId(newWire.id);
    setSelectedComponentId(null);
  };

  const handleUpdateWire = (updated: Wire) => {
    setWires((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  const handleDeleteWire = (id: string) => {
    setWires((prev) => prev.filter((w) => w.id !== id));
    if (selectedWireId === id) setSelectedWireId(null);
  };

  // --- Scenario & Presets ---
  const handleLoadScenario = (scenarioId: string) => {
    const sc = TEST_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;

    setSelectedScenarioId(sc.id);
    setCircuitName(sc.name);
    // Deep clone components and wires
    const clonedComps = JSON.parse(JSON.stringify(sc.components));
    const clonedWires = JSON.parse(JSON.stringify(sc.wires));
    setComponents(clonedComps);
    setWires(clonedWires);
    setSelectedComponentId(null);
    setSelectedWireId(null);

    runSimulationCalculation(clonedComps, clonedWires);
  };

  const handleResetCircuit = () => {
    if (confirm('¿Desea limpiar todo el lienzo y comenzar un diseño desde cero?')) {
      setComponents([]);
      setWires([]);
      setSelectedComponentId(null);
      setSelectedWireId(null);
      setCircuitName('Nuevo Circuito');
      setSimulationResult(null);
    }
  };

  const handleSaveCurrentCircuit = (name: string, description: string) => {
    const saved: SavedCircuit = {
      id: `saved-${Date.now()}`,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      components,
      wires,
      lastSimulation: {
        timestamp: Date.now(),
        state: simulationResult?.circuitState || 'NORMAL',
        faultsCount: simulationResult?.faults.length || 0,
        totalPower: simulationResult?.totalPower || 0,
      },
    };
    AppStorage.saveCircuit(saved);
    setCircuitName(name);
  };

  const handleLoadCircuitFromStorage = (saved: SavedCircuit) => {
    setCircuitName(saved.name);
    setComponents(saved.components);
    setWires(saved.wires);
    setSelectedComponentId(null);
    setSelectedWireId(null);
    runSimulationCalculation(saved.components, saved.wires);
  };

  // Currently selected objects
  const selectedComponent = components.find((c) => c.id === selectedComponentId) || null;
  const selectedWire = wires.find((w) => w.id === selectedWireId) || null;
  const selectedBranchResult = selectedComponent
    ? simulationResult?.branchResults.get(selectedComponent.id)
    : undefined;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Global Header Navigation (Strict 3-zone Top Bar Contract) */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isSimulating={isSimulating}
        onToggleSimulation={() => {
          if (!isSimulating) {
            setIsSimulating(true);
            runSimulationCalculation(components, wires);
          } else {
            setIsSimulating(false);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        faultCount={simulationResult?.faults.length || 0}
      />

      {/* 2. Main Work Area Based on Active Navigation Tab */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* TAB 1: DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <DashboardView
            simulationResult={simulationResult}
            components={components}
            isSimulating={isSimulating}
            onNavigateToEditor={() => setActiveTab('editor')}
            onNavigateToDiagnostics={() => setActiveTab('diagnostic')}
            onLoadScenario={handleLoadScenario}
            onRunSimulation={() => {
              setIsSimulating(true);
              runSimulationCalculation(components, wires);
            }}
          />
        )}

        {/* TAB 2: CIRCUIT BUILDER & EDITOR VIEW */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Editor Top Toolbar */}
            <EditorToolbar
              isSimulating={isSimulating}
              circuitState={simulationResult?.circuitState || 'SIMULACION DETENIDA'}
              onStartSimulation={() => {
                setIsSimulating(true);
                runSimulationCalculation(components, wires);
              }}
              onPauseSimulation={() => setIsSimulating(false)}
              onStopSimulation={() => {
                setIsSimulating(false);
                setSimulationResult((prev) =>
                  prev ? { ...prev, circuitState: 'SIMULACION DETENIDA' } : null
                );
              }}
              onStepSimulation={() => runSimulationCalculation(components, wires)}
              onResetCircuit={handleResetCircuit}
              onLoadScenario={handleLoadScenario}
              onSaveCircuit={() => setIsSavedModalOpen(true)}
              onOpenSavedModal={() => setIsSavedModalOpen(true)}
              selectedScenarioId={selectedScenarioId}
            />

            {/* Editor Workspace: Component Palette (Left) + Interactive SVG Canvas + Properties (Right) */}
            <div className="flex-1 flex overflow-hidden">
              <ComponentLibrary onAddComponent={handleAddComponent} />

              <EditorCanvas
                components={components}
                wires={wires}
                selectedComponentId={selectedComponentId}
                selectedWireId={selectedWireId}
                simulationResult={simulationResult}
                isSimulating={isSimulating}
                settings={settings}
                onSelectComponent={setSelectedComponentId}
                onSelectWire={setSelectedWireId}
                onUpdateComponentPosition={handleUpdateComponentPosition}
                onAddWire={handleAddWire}
              />

              <PropertiesPanel
                selectedComponent={selectedComponent}
                selectedWire={selectedWire}
                branchResult={selectedBranchResult}
                isSimulating={isSimulating}
                onUpdateComponent={handleUpdateComponent}
                onDeleteComponent={handleDeleteComponent}
                onUpdateWire={handleUpdateWire}
                onDeleteWire={handleDeleteWire}
              />
            </div>
          </div>
        )}

        {/* TAB 3: FAULT DIAGNOSIS VIEW */}
        {activeTab === 'diagnostic' && (
          <FaultDiagnosisView
            simulationResult={simulationResult}
            onSelectComponentInEditor={(comp) => setSelectedComponentId(comp)}
            onNavigateToEditor={() => setActiveTab('editor')}
          />
        )}

        {/* TAB 4: MATHEMATICAL & PHYSICAL ANALYSIS VIEW */}
        {activeTab === 'analysis' && (
          <ElectricalAnalysisView
            simulationResult={simulationResult}
            components={components}
          />
        )}

        {/* TAB 5: GRAPHS & VISUALIZATIONS VIEW */}
        {activeTab === 'charts' && (
          <ChartsView
            simulationResult={simulationResult}
            components={components}
          />
        )}

        {/* TAB 6: SIMULATION HISTORY & REPORTS */}
        {activeTab === 'history' && (
          <HistoryReportsView
            simulationResult={simulationResult}
            components={components}
            circuitName={circuitName}
          />
        )}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          AppStorage.saveSettings(newSettings);
          if (isSimulating) {
            runSimulationCalculation(components, wires);
          }
        }}
      />

      <SavedCircuitsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        onLoadCircuit={handleLoadCircuitFromStorage}
        onSaveCurrentCircuit={handleSaveCurrentCircuit}
        currentCircuitName={circuitName}
      />
    </div>
  );
}
