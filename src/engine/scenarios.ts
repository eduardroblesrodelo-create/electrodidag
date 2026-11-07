/**
 * ELECTRODIAG - Preloaded Test Scenarios & Educational Benchmarks
 * 8 verified circuits covering standard configurations, nominal conditions, and fault modes.
 */

import { CircuitComponent, Wire } from '../types/circuit';

export interface TestScenario {
  id: string;
  name: string;
  category: 'nominal' | 'fault' | 'ac';
  badge: string;
  description: string;
  expectedValues: {
    totalVoltage: string;
    totalCurrent: string;
    totalPower: string;
    equivalentResistance: string;
    expectedFaults: string;
    keyObservation: string;
  };
  components: CircuitComponent[];
  wires: Wire[];
}

export const TEST_SCENARIOS: TestScenario[] = [
  // 1. Circuito Resistivo en Serie
  {
    id: 'esc-1-serie',
    name: '01. Circuito Resistivo en Serie',
    category: 'nominal',
    badge: 'Nominal DC',
    description: 'Tres resistencias conectadas en serie (R1=20Ω, R2=30Ω, R3=50Ω) alimentadas por una fuente DC de 100V. La corriente es idéntica en toda la malla y la suma de caídas de tensión iguala la tensión total (2ª Ley de Kirchhoff).',
    expectedValues: {
      totalVoltage: '100.00 V',
      totalCurrent: '1.00 A',
      totalPower: '100.00 W',
      equivalentResistance: '100.00 Ω (Req = R1 + R2 + R3)',
      expectedFaults: 'Ninguna (Estado NORMAL)',
      keyObservation: 'V(R1)=20V, V(R2)=30V, V(R3)=50V. Corriente uniforme I = 1.0 A.',
    },
    components: [
      {
        id: 'c-v1',
        type: 'dc_source',
        name: 'Fuente DC (100V)',
        x: 100,
        y: 220,
        rotation: 0,
        voltage: 100,
        pins: [
          { id: 'p1', label: '+', x: 0, y: -40 },
          { id: 'p2', label: '-', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-r1',
        type: 'resistor',
        name: 'Resistencia R1 (20Ω)',
        x: 260,
        y: 120,
        rotation: 90,
        resistance: 20,
        ratedCurrent: 5,
        pins: [
          { id: 'p1', label: 'A', x: -40, y: 0 },
          { id: 'p2', label: 'B', x: 40, y: 0 },
        ],
      },
      {
        id: 'c-r2',
        type: 'resistor',
        name: 'Resistencia R2 (30Ω)',
        x: 420,
        y: 120,
        rotation: 90,
        resistance: 30,
        ratedCurrent: 5,
        pins: [
          { id: 'p1', label: 'A', x: -40, y: 0 },
          { id: 'p2', label: 'B', x: 40, y: 0 },
        ],
      },
      {
        id: 'c-r3',
        type: 'resistor',
        name: 'Resistencia R3 (50Ω)',
        x: 580,
        y: 220,
        rotation: 0,
        resistance: 50,
        ratedCurrent: 5,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-gnd',
        type: 'ground',
        name: 'Tierra / Referencia',
        x: 100,
        y: 350,
        rotation: 0,
        pins: [{ id: 'p1', label: 'GND', x: 0, y: -20 }],
      },
    ],
    wires: [
      { id: 'w1', fromComponentId: 'c-v1', fromPinId: 'p1', toComponentId: 'c-r1', toPinId: 'p1' },
      { id: 'w2', fromComponentId: 'c-r1', fromPinId: 'p2', toComponentId: 'c-r2', toPinId: 'p1' },
      { id: 'w3', fromComponentId: 'c-r2', fromPinId: 'p2', toComponentId: 'c-r3', toPinId: 'p1' },
      { id: 'w4', fromComponentId: 'c-r3', fromPinId: 'p2', toComponentId: 'c-v1', toPinId: 'p2' },
      { id: 'w5', fromComponentId: 'c-v1', fromPinId: 'p2', toComponentId: 'c-gnd', toPinId: 'p1' },
    ],
  },

  // 2. Circuito Resistivo en Paralelo
  {
    id: 'esc-2-paralelo',
    name: '02. Circuito Resistivo en Paralelo',
    category: 'nominal',
    badge: 'Nominal DC',
    description: 'Tres resistencias conectadas en paralelo (R1=60Ω, R2=30Ω, R3=20Ω) bajo 60V DC. La tensión es idéntica en cada rama y la corriente total es la suma de corrientes de rama (1ª Ley de Kirchhoff).',
    expectedValues: {
      totalVoltage: '60.00 V',
      totalCurrent: '6.00 A',
      totalPower: '360.00 W',
      equivalentResistance: '10.00 Ω (1/Req = 1/60 + 1/30 + 1/20)',
      expectedFaults: 'Ninguna (Estado NORMAL)',
      keyObservation: 'I(R1)=1A, I(R2)=2A, I(R3)=3A. Total I = 1+2+3 = 6A.',
    },
    components: [
      {
        id: 'c-v1',
        type: 'dc_source',
        name: 'Fuente DC (60V)',
        x: 100,
        y: 240,
        rotation: 0,
        voltage: 60,
        pins: [
          { id: 'p1', label: '+', x: 0, y: -40 },
          { id: 'p2', label: '-', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-r1',
        type: 'resistor',
        name: 'Rama 1 - R1 (60Ω)',
        x: 280,
        y: 240,
        rotation: 0,
        resistance: 60,
        ratedCurrent: 5,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-r2',
        type: 'resistor',
        name: 'Rama 2 - R2 (30Ω)',
        x: 440,
        y: 240,
        rotation: 0,
        resistance: 30,
        ratedCurrent: 5,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-r3',
        type: 'resistor',
        name: 'Rama 3 - R3 (20Ω)',
        x: 600,
        y: 240,
        rotation: 0,
        resistance: 20,
        ratedCurrent: 5,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-gnd',
        type: 'ground',
        name: 'Tierra / Referencia',
        x: 100,
        y: 360,
        rotation: 0,
        pins: [{ id: 'p1', label: 'GND', x: 0, y: -20 }],
      },
    ],
    wires: [
      { id: 'w1', fromComponentId: 'c-v1', fromPinId: 'p1', toComponentId: 'c-r1', toPinId: 'p1' },
      { id: 'w2', fromComponentId: 'c-r1', fromPinId: 'p1', toComponentId: 'c-r2', toPinId: 'p1' },
      { id: 'w3', fromComponentId: 'c-r2', fromPinId: 'p1', toComponentId: 'c-r3', toPinId: 'p1' },
      { id: 'w4', fromComponentId: 'c-v1', fromPinId: 'p2', toComponentId: 'c-r1', toPinId: 'p2' },
      { id: 'w5', fromComponentId: 'c-r1', fromPinId: 'p2', toComponentId: 'c-r2', toPinId: 'p2' },
      { id: 'w6', fromComponentId: 'c-r2', fromPinId: 'p2', toComponentId: 'c-r3', toPinId: 'p2' },
      { id: 'w7', fromComponentId: 'c-v1', fromPinId: 'p2', toComponentId: 'c-gnd', toPinId: 'p1' },
    ],
  },

  // 3. Circuito Mixto (Serie-Paralelo)
  {
    id: 'esc-3-mixto',
    name: '03. Circuito Mixto (Serie-Paralelo)',
    category: 'nominal',
    badge: 'Nominal DC',
    description: 'Resistencia en serie R1 (10Ω) en cascada con un banco en paralelo formado por R2 (20Ω) y R3 (20Ω), alimentados con 40V DC. Demuestra análisis nodal y reducción equivalente.',
    expectedValues: {
      totalVoltage: '40.00 V',
      totalCurrent: '2.00 A',
      totalPower: '80.00 W',
      equivalentResistance: '20.00 Ω (R1 + [R2 // R3] = 10 + 10 = 20Ω)',
      expectedFaults: 'Ninguna (Estado NORMAL)',
      keyObservation: 'V(R1)=20V, V(banco paralelo)=20V. I(R2)=1A, I(R3)=1A.',
    },
    components: [
      {
        id: 'c-v1',
        type: 'dc_source',
        name: 'Fuente DC (40V)',
        x: 100,
        y: 220,
        rotation: 0,
        voltage: 40,
        pins: [
          { id: 'p1', label: '+', x: 0, y: -40 },
          { id: 'p2', label: '-', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-r1',
        type: 'resistor',
        name: 'R_serie (10Ω)',
        x: 260,
        y: 120,
        rotation: 90,
        resistance: 10,
        ratedCurrent: 5,
        pins: [
          { id: 'p1', label: 'A', x: -40, y: 0 },
          { id: 'p2', label: 'B', x: 40, y: 0 },
        ],
      },
      {
        id: 'c-r2',
        type: 'resistor',
        name: 'R2_paralelo (20Ω)',
        x: 440,
        y: 180,
        rotation: 0,
        resistance: 20,
        ratedCurrent: 5,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-r3',
        type: 'resistor',
        name: 'R3_paralelo (20Ω)',
        x: 580,
        y: 180,
        rotation: 0,
        resistance: 20,
        ratedCurrent: 5,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-gnd',
        type: 'ground',
        name: 'Tierra / Referencia',
        x: 100,
        y: 350,
        rotation: 0,
        pins: [{ id: 'p1', label: 'GND', x: 0, y: -20 }],
      },
    ],
    wires: [
      { id: 'w1', fromComponentId: 'c-v1', fromPinId: 'p1', toComponentId: 'c-r1', toPinId: 'p1' },
      { id: 'w2', fromComponentId: 'c-r1', fromPinId: 'p2', toComponentId: 'c-r2', toPinId: 'p1' },
      { id: 'w3', fromComponentId: 'c-r1', fromPinId: 'p2', toComponentId: 'c-r3', toPinId: 'p1' },
      { id: 'w4', fromComponentId: 'c-r2', fromPinId: 'p2', toComponentId: 'c-r3', toPinId: 'p2' },
      { id: 'w5', fromComponentId: 'c-r2', fromPinId: 'p2', toComponentId: 'c-v1', toPinId: 'p2' },
      { id: 'w6', fromComponentId: 'c-v1', fromPinId: 'p2', toComponentId: 'c-gnd', toPinId: 'p1' },
    ],
  },

  // 4. Red con Sobrecarga
  {
    id: 'esc-4-sobrecarga',
    name: '04. Red con Sobrecarga Térmica',
    category: 'fault',
    badge: 'Falla: Sobrecarga',
    description: 'Circuito con conductor principal calibre 1.5 mm² (capacidad nominal 12A) alimentando una carga resistiva pesada que demanda 20A a 120V. El motor de diagnóstico detecta la sobrecarga del 66.7% y recomienda el cambio de conductor.',
    expectedValues: {
      totalVoltage: '120.00 V',
      totalCurrent: '19.98 A',
      totalPower: '~2396 W',
      equivalentResistance: '~6.0 Ω',
      expectedFaults: 'SOBRECARGA SEVERA (+66.5% sobre nominal de 12A)',
      keyObservation: 'Conductor C1 sobrecalentado disipando potencia excesiva.',
    },
    components: [
      {
        id: 'c-v1',
        type: 'dc_source',
        name: 'Fuente DC (120V)',
        x: 100,
        y: 220,
        rotation: 0,
        voltage: 120,
        pins: [
          { id: 'p1', label: '+', x: 0, y: -40 },
          { id: 'p2', label: '-', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-cond1',
        type: 'conductor',
        name: 'Conductor C1 (Calibre 1.5 mm²)',
        x: 280,
        y: 120,
        rotation: 90,
        resistance: 0.12,
        ratedCurrent: 12, // 12A nominal rating
        crossSection: 1.5,
        length: 10,
        pins: [
          { id: 'p1', label: 'A', x: -40, y: 0 },
          { id: 'p2', label: 'B', x: 40, y: 0 },
        ],
      },
      {
        id: 'c-load1',
        type: 'load',
        name: 'Carga Pesada (2400W / 6Ω)',
        x: 480,
        y: 220,
        rotation: 0,
        resistance: 6,
        ratedVoltage: 120,
        ratedPower: 2400,
        ratedCurrent: 20,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-gnd',
        type: 'ground',
        name: 'Tierra / Referencia',
        x: 100,
        y: 350,
        rotation: 0,
        pins: [{ id: 'p1', label: 'GND', x: 0, y: -20 }],
      },
    ],
    wires: [
      { id: 'w1', fromComponentId: 'c-v1', fromPinId: 'p1', toComponentId: 'c-cond1', toPinId: 'p1' },
      { id: 'w2', fromComponentId: 'c-cond1', fromPinId: 'p2', toComponentId: 'c-load1', toPinId: 'p1' },
      { id: 'w3', fromComponentId: 'c-load1', fromPinId: 'p2', toComponentId: 'c-v1', toPinId: 'p2' },
      { id: 'w4', fromComponentId: 'c-v1', fromPinId: 'p2', toComponentId: 'c-gnd', toPinId: 'p1' },
    ],
  },

  // 5. Red con Cortocircuito Directo
  {
    id: 'esc-5-cortocircuito',
    name: '05. Red con Cortocircuito Directo',
    category: 'fault',
    badge: 'Falla: Cortocircuito',
    description: 'Un puente accidental de muy baja impedancia (0.005Ω) se interpone entre la barra positiva y el retorno, provocando una corriente destructiva superior a 50A. El diagnóstico localiza el tramo del cortocircuito y genera alerta crítica.',
    expectedValues: {
      totalVoltage: '24.00 V',
      totalCurrent: '> 100 A (Corriente Icc extrema)',
      totalPower: '> 2400 W en falla',
      equivalentResistance: '< 0.05 Ω',
      expectedFaults: 'FALLA CRÍTICA: CORTOCIRCUITO DIRECTO',
      keyObservation: 'Corriente descontrolada. El tramo del puente se resalta en rojo.',
    },
    components: [
      {
        id: 'c-v1',
        type: 'dc_source',
        name: 'Fuente DC (24V)',
        x: 100,
        y: 220,
        rotation: 0,
        voltage: 24,
        pins: [
          { id: 'p1', label: '+', x: 0, y: -40 },
          { id: 'p2', label: '-', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-fuse1',
        type: 'fuse',
        name: 'Fusible F1 (10A)',
        x: 250,
        y: 120,
        rotation: 90,
        ratedCurrent: 10,
        isBlown: false,
        pins: [
          { id: 'p1', label: 'A', x: -40, y: 0 },
          { id: 'p2', label: 'B', x: 40, y: 0 },
        ],
      },
      {
        id: 'c-short1',
        type: 'fault_short',
        name: 'Puente Cortocircuito (Falla)',
        x: 390,
        y: 220,
        rotation: 0,
        isFaultActive: true,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-lamp1',
        type: 'lamp',
        name: 'Lámpara L1 (24V 24W)',
        x: 540,
        y: 220,
        rotation: 0,
        ratedVoltage: 24,
        ratedPower: 24,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-gnd',
        type: 'ground',
        name: 'Tierra / Referencia',
        x: 100,
        y: 350,
        rotation: 0,
        pins: [{ id: 'p1', label: 'GND', x: 0, y: -20 }],
      },
    ],
    wires: [
      { id: 'w1', fromComponentId: 'c-v1', fromPinId: 'p1', toComponentId: 'c-fuse1', toPinId: 'p1' },
      { id: 'w2', fromComponentId: 'c-fuse1', fromPinId: 'p2', toComponentId: 'c-short1', toPinId: 'p1' },
      { id: 'w3', fromComponentId: 'c-short1', fromPinId: 'p1', toComponentId: 'c-lamp1', toPinId: 'p1' },
      { id: 'w4', fromComponentId: 'c-v1', fromPinId: 'p2', toComponentId: 'c-short1', toPinId: 'p2' },
      { id: 'w5', fromComponentId: 'c-short1', fromPinId: 'p2', toComponentId: 'c-lamp1', toPinId: 'p2' },
      { id: 'w6', fromComponentId: 'c-v1', fromPinId: 'p2', toComponentId: 'c-gnd', toPinId: 'p1' },
    ],
  },

  // 6. Red con Circuito Abierto
  {
    id: 'esc-6-abierto',
    name: '06. Red con Circuito Abierto',
    category: 'fault',
    badge: 'Falla: Circuito Abierto',
    description: 'Un interruptor en posición abierta o fusible disparado interrumpe la continuidad hacia la carga. La lámpara queda completamente desenergizada (0V, 0A), mientras la fuente conserva su potencial nominal.',
    expectedValues: {
      totalVoltage: '120.00 V',
      totalCurrent: '0.00 A',
      totalPower: '0.00 W',
      equivalentResistance: 'Infinito (Circuito Abierto)',
      expectedFaults: 'DISCONTINUIDAD: INTERRUPTOR ABIERTO + CARGA DESENERGIZADA',
      keyObservation: 'Corriente nula. La lámpara no emite luz.',
    },
    components: [
      {
        id: 'c-v1',
        type: 'dc_source',
        name: 'Fuente DC (120V)',
        x: 100,
        y: 220,
        rotation: 0,
        voltage: 120,
        pins: [
          { id: 'p1', label: '+', x: 0, y: -40 },
          { id: 'p2', label: '-', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-sw1',
        type: 'switch',
        name: 'Interruptor S1 (Abierto)',
        x: 280,
        y: 120,
        rotation: 90,
        isOpen: true,
        pins: [
          { id: 'p1', label: 'A', x: -40, y: 0 },
          { id: 'p2', label: 'B', x: 40, y: 0 },
        ],
      },
      {
        id: 'c-lamp1',
        type: 'lamp',
        name: 'Lámpara Iluminación (120V 100W)',
        x: 480,
        y: 220,
        rotation: 0,
        ratedVoltage: 120,
        ratedPower: 100,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-gnd',
        type: 'ground',
        name: 'Tierra / Referencia',
        x: 100,
        y: 350,
        rotation: 0,
        pins: [{ id: 'p1', label: 'GND', x: 0, y: -20 }],
      },
    ],
    wires: [
      { id: 'w1', fromComponentId: 'c-v1', fromPinId: 'p1', toComponentId: 'c-sw1', toPinId: 'p1' },
      { id: 'w2', fromComponentId: 'c-sw1', fromPinId: 'p2', toComponentId: 'c-lamp1', toPinId: 'p1' },
      { id: 'w3', fromComponentId: 'c-lamp1', fromPinId: 'p2', toComponentId: 'c-v1', toPinId: 'p2' },
      { id: 'w4', fromComponentId: 'c-v1', fromPinId: 'p2', toComponentId: 'c-gnd', toPinId: 'p1' },
    ],
  },

  // 7. Red con Caída de Tensión Crítica
  {
    id: 'esc-7-caida-tension',
    name: '07. Red con Caída de Tensión Crítica',
    category: 'fault',
    badge: 'Falla: Caída de Tensión',
    description: 'Línea de alimentación extensa de 150 metros con conductor subdimensionado (R = 2.1Ω). Al alimentar una carga de 10A a 120V, la caída de tensión supera el 16% (límite normativo: 3%), reduciendo la tensión en la carga a ~100V.',
    expectedValues: {
      totalVoltage: '120.00 V',
      totalCurrent: '~9.90 A',
      totalPower: '~1188 W',
      equivalentResistance: '12.1 Ω',
      expectedFaults: 'CAÍDA DE TENSIÓN EXCESIVA (> 3% en conductor)',
      keyObservation: 'ΔV en conductor = 20.8V (17.3%). Pérdida de eficiencia luminosa.',
    },
    components: [
      {
        id: 'c-v1',
        type: 'dc_source',
        name: 'Subestación DC (120V)',
        x: 100,
        y: 220,
        rotation: 0,
        voltage: 120,
        pins: [
          { id: 'p1', label: '+', x: 0, y: -40 },
          { id: 'p2', label: '-', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-cond1',
        type: 'conductor',
        name: 'Línea Distribución (150m, 1.5mm²)',
        x: 280,
        y: 120,
        rotation: 90,
        resistance: 2.1, // High resistance due to length
        ratedCurrent: 16,
        length: 150,
        crossSection: 1.5,
        pins: [
          { id: 'p1', label: 'A', x: -40, y: 0 },
          { id: 'p2', label: 'B', x: 40, y: 0 },
        ],
      },
      {
        id: 'c-load1',
        type: 'load',
        name: 'Receptor Remoto (10Ω)',
        x: 480,
        y: 220,
        rotation: 0,
        resistance: 10,
        ratedVoltage: 120,
        ratedPower: 1200,
        pins: [
          { id: 'p1', label: 'A', x: 0, y: -40 },
          { id: 'p2', label: 'B', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-gnd',
        type: 'ground',
        name: 'Tierra / Referencia',
        x: 100,
        y: 350,
        rotation: 0,
        pins: [{ id: 'p1', label: 'GND', x: 0, y: -20 }],
      },
    ],
    wires: [
      { id: 'w1', fromComponentId: 'c-v1', fromPinId: 'p1', toComponentId: 'c-cond1', toPinId: 'p1' },
      { id: 'w2', fromComponentId: 'c-cond1', fromPinId: 'p2', toComponentId: 'c-load1', toPinId: 'p1' },
      { id: 'w3', fromComponentId: 'c-load1', fromPinId: 'p2', toComponentId: 'c-v1', toPinId: 'p2' },
      { id: 'w4', fromComponentId: 'c-v1', fromPinId: 'p2', toComponentId: 'c-gnd', toPinId: 'p1' },
    ],
  },

  // 8. Circuito Básico de Corriente Alterna (AC) con Motor e Impedancia
  {
    id: 'esc-8-ac',
    name: '08. Circuito AC con Motor e Impedancia Fasorial',
    category: 'ac',
    badge: 'Análisis Fasorial AC',
    description: 'Fuente senoidal AC (220V RMS, 60 Hz) alimentando un motor industrial modelado con resistencia interna y reactancia inductiva (L = 60 mH => XL = 22.6Ω). Calcula potencia activa (W), reactiva (VAR), aparente (VA) y factor de potencia.',
    expectedValues: {
      totalVoltage: '220.00 V RMS',
      totalCurrent: '~6.85 A RMS',
      totalPower: '~1080 W activos',
      equivalentResistance: 'Impedancia Z ≈ 32.1 Ω ∠ 44.8°',
      expectedFaults: 'Ninguna (Estado NORMAL - AC Inductivo)',
      keyObservation: 'Potencia reactiva Q ≈ 1060 VAR, Factor de Potencia FP ≈ 0.71 inductivo.',
    },
    components: [
      {
        id: 'c-vac1',
        type: 'ac_source',
        name: 'Generador AC (220V 60Hz)',
        x: 100,
        y: 220,
        rotation: 0,
        voltage: 220,
        frequency: 60,
        phase: 0,
        pins: [
          { id: 'p1', label: '~', x: 0, y: -40 },
          { id: 'p2', label: 'N', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-motor1',
        type: 'motor',
        name: 'Motor Asíncrono (1.5 kW)',
        x: 320,
        y: 220,
        rotation: 0,
        ratedVoltage: 220,
        ratedPower: 1500,
        inductance: 0.06, // 60 mH
        pins: [
          { id: 'p1', label: 'U', x: 0, y: -40 },
          { id: 'p2', label: 'V', x: 0, y: 40 },
        ],
      },
      {
        id: 'c-ammeter1',
        type: 'ammeter',
        name: 'Amperímetro Digital AC',
        x: 210,
        y: 120,
        rotation: 90,
        pins: [
          { id: 'p1', label: 'A', x: -40, y: 0 },
          { id: 'p2', label: 'B', x: 40, y: 0 },
        ],
      },
      {
        id: 'c-gnd',
        type: 'ground',
        name: 'Tierra / Neutro Ref',
        x: 100,
        y: 350,
        rotation: 0,
        pins: [{ id: 'p1', label: 'GND', x: 0, y: -20 }],
      },
    ],
    wires: [
      { id: 'w1', fromComponentId: 'c-vac1', fromPinId: 'p1', toComponentId: 'c-ammeter1', toPinId: 'p1' },
      { id: 'w2', fromComponentId: 'c-ammeter1', fromPinId: 'p2', toComponentId: 'c-motor1', toPinId: 'p1' },
      { id: 'w3', fromComponentId: 'c-motor1', fromPinId: 'p2', toComponentId: 'c-vac1', toPinId: 'p2' },
      { id: 'w4', fromComponentId: 'c-vac1', fromPinId: 'p2', toComponentId: 'c-gnd', toPinId: 'p1' },
    ],
  },
];
