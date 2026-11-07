/**
 * ELECTRODIAG - Electrical Network Simulation & Fault Diagnostic Types
 */

export type ComponentType =
  | 'dc_source'
  | 'ac_source'
  | 'resistor'
  | 'switch'
  | 'fuse'
  | 'lamp'
  | 'motor'
  | 'load'
  | 'conductor'
  | 'ground'
  | 'ammeter'
  | 'voltmeter'
  | 'fault_short'
  | 'fault_leakage';

export interface Pin {
  id: string; // e.g., 'pin-1', 'pin-2'
  label: string; // '+', '-', 'A', 'B', 'GND'
  x: number; // offset relative to component origin
  y: number;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  name: string;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270 degrees
  pins: Pin[];
  
  // Electrical properties
  voltage?: number; // Volts (DC or AC peak/RMS)
  frequency?: number; // Hz (for AC sources)
  phase?: number; // degrees (for AC sources)
  resistance?: number; // Ohms
  inductance?: number; // Henries (for motors/reactors)
  capacitance?: number; // Farads
  ratedPower?: number; // Watts
  ratedCurrent?: number; // Amperes
  ratedVoltage?: number; // Volts
  length?: number; // Meters (for conductors)
  resistivity?: number; // Ohm*mm^2/m (e.g., 0.0175 for Copper)
  gauge?: string; // e.g. "14 AWG", "2.5 mm²"
  crossSection?: number; // mm^2
  insulationResistance?: number; // Ohms (for leakage faults)
  
  // State
  isOpen?: boolean; // For switches
  isBlown?: boolean; // For fuses
  isFaultActive?: boolean; // For fault injection elements
}

export interface Wire {
  id: string;
  name?: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  resistance?: number; // Wire specific resistance (Ohms), defaults to 0.01
  maxCurrent?: number; // Rated current in A, e.g. 15A
  length?: number; // meters
}

export type FaultSeverity = 'critical' | 'warning' | 'info';

export type FaultType = 
  | 'short_circuit'
  | 'overload'
  | 'voltage_drop'
  | 'open_circuit'
  | 'insulation_leakage'
  | 'floating_node'
  | 'no_power_source'
  | 'singular_matrix';

export interface FaultDiagnostic {
  id: string;
  type: FaultType;
  severity: FaultSeverity;
  title: string;
  componentId?: string;
  wireId?: string;
  nodeId?: number;
  locationDescription: string;
  calculatedValue: number;
  calculatedUnit: string;
  nominalValue: number;
  nominalUnit: string;
  percentageDiff?: number;
  explanation: string;
  probableCauses: string[];
  recommendations: string[];
  timestamp: number;
}

export interface BranchResult {
  componentId: string;
  type: ComponentType;
  name: string;
  fromNode: number;
  toNode: number;
  voltageDrop: number; // Volts (magnitude)
  voltageAngle?: number; // degrees for AC
  current: number; // Amperes (magnitude)
  currentAngle?: number; // degrees for AC
  powerActive: number; // Watts (P)
  powerReactive?: number; // VAR (Q)
  powerApparent?: number; // VA (S)
  powerFactor?: number; // cos(phi)
  resistance: number; // Ohms
  isOverloaded: boolean;
  overloadPercent?: number;
  status: 'normal' | 'overload' | 'fault' | 'off';
}

export interface NodeResult {
  nodeId: number;
  voltage: number; // Volts relative to ground (RMS / DC)
  phaseAngle?: number; // degrees
  connectedComponents: string[];
}

export interface SimulationResult {
  success: boolean;
  timestamp: number;
  error?: string;
  circuitState: 'NORMAL' | 'ADVERTENCIA' | 'FALLA DETECTADA' | 'SIMULACION DETENIDA';
  
  // Global KPIs
  totalVoltage: number; // Volts
  totalCurrent: number; // Amperes
  totalPower: number; // Watts
  totalReactivePower?: number; // VAR
  totalApparentPower?: number; // VA
  powerFactor?: number;
  equivalentResistance?: number; // Ohms
  frequency: number; // Hz (0 if DC)
  isAC: boolean;
  
  // Counts
  totalComponents: number;
  normalComponentsCount: number;
  faultyComponentsCount: number;
  
  // Detailed results
  nodeVoltages: Map<number, NodeResult>;
  branchResults: Map<string, BranchResult>;
  faults: FaultDiagnostic[];
  kirchhoffSumAtNodes: { nodeId: number; currentSum: number }[];
}

export interface SavedCircuit {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  components: CircuitComponent[];
  wires: Wire[];
  lastSimulation?: {
    timestamp: number;
    state: string;
    faultsCount: number;
    totalPower: number;
  };
}

export interface SimulationHistoryRecord {
  id: string;
  circuitId?: string;
  circuitName: string;
  timestamp: number;
  durationMs: number;
  totalVoltage: number;
  totalCurrent: number;
  totalPower: number;
  faultCount: number;
  circuitState: string;
  componentsCount: number;
  faultsSummary: {
    type: string;
    severity: string;
    location: string;
  }[];
}

export interface AppSettings {
  voltageDropThresholdPercent: number; // default 3%
  overloadWarningPercent: number; // default 100%
  insulationResistanceLimit: number; // default 1000000 Ohms (1 MΩ)
  defaultACFrequency: number; // 60 Hz or 50 Hz
  gridSnap: boolean;
  gridSize: number; // px, default 20
  darkMode: boolean;
  showCurrentParticles: boolean;
  particleSpeedMultiplier: number;
}
