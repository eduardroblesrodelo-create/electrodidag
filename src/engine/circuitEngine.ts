/**
 * ELECTRODIAG - Circuit Engine & Modified Nodal Analysis (MNA) Simulator
 * Performs node extraction, netlist formulation, matrix assembly, and solves DC & AC networks.
 */

import { CircuitComponent, Wire, SimulationResult, NodeResult, BranchResult } from '../types/circuit';
import { MathSolver } from './mathSolver';

export class CircuitEngine {
  /**
   * Executes full electrical simulation for the provided components and wires.
   */
  public static simulate(
    components: CircuitComponent[],
    wires: Wire[],
    defaultFrequency: number = 60
  ): SimulationResult {
    const timestamp = Date.now();

    // 1. Initial Validations
    if (!components || components.length === 0) {
      return this.createEmptyResult(timestamp, 'No hay componentes en el espacio de trabajo.');
    }

    const voltageSources = components.filter(
      (c) => c.type === 'dc_source' || c.type === 'ac_source'
    );

    if (voltageSources.length === 0) {
      return this.createEmptyResult(
        timestamp,
        'Circuito sin fuente de energía. Debe incorporar al menos una fuente de voltaje (DC o AC).'
      );
    }

    // Determine if network has AC sources
    const hasAC = components.some((c) => c.type === 'ac_source');
    const systemFrequency = hasAC
      ? (components.find((c) => c.type === 'ac_source')?.frequency || defaultFrequency)
      : 0;

    // 2. Node Extraction via Union-Find (Disjoint Set)
    const { pinToNode, nodeCount, groundNodeId } = this.extractNodes(components, wires);

    // If node count <= 1, no closed circuit is possible
    if (nodeCount <= 1) {
      return this.createEmptyResult(
        timestamp,
        'Circuito incompleto o desconectado. Conecte los componentes mediante conductores.'
      );
    }

    // Reference node (Ground)
    // Nodes are numbered 0 ... nodeCount - 1. Node 0 is the reference (Ground) node.
    const refNode = groundNodeId !== undefined ? groundNodeId : 0;

    // Remap nodes so that refNode becomes index 0
    const nodeMap = new Map<number, number>();
    let assignedIndex = 1;
    for (let i = 0; i < nodeCount; i++) {
      if (i === refNode) {
        nodeMap.set(i, 0);
      } else {
        nodeMap.set(i, assignedIndex++);
      }
    }

    // Normalized node IDs: 0 is reference, 1 to N-1 are unknown potentials
    const N = nodeCount; // Total nodes including 0
    const unknownNodesCount = N - 1;

    // 3. Classify components and determine voltage sources (MNA auxiliary variables)
    // Active voltage sources introduce additional current variables
    interface VSourceBranch {
      component: CircuitComponent;
      nodePlus: number;
      nodeMinus: number;
      voltage: number;
      phase: number; // degrees
    }

    const vSources: VSourceBranch[] = [];

    // Map each component's terminal nodes
    const compNodePairs = new Map<string, { node1: number; node2: number }>();

    for (const comp of components) {
      if (comp.type === 'ground') {
        continue;
      }
      const pin1 = comp.pins[0];
      const pin2 = comp.pins[1];
      if (!pin1 || !pin2) continue;

      const n1Raw = pinToNode.get(`${comp.id}_${pin1.id}`) ?? 0;
      const n2Raw = pinToNode.get(`${comp.id}_${pin2.id}`) ?? 0;
      const node1 = nodeMap.get(n1Raw) ?? 0;
      const node2 = nodeMap.get(n2Raw) ?? 0;

      compNodePairs.set(comp.id, { node1, node2 });

      if (comp.type === 'dc_source' || comp.type === 'ac_source') {
        const v = comp.voltage ?? 12;
        const phase = comp.phase ?? 0;
        vSources.push({
          component: comp,
          nodePlus: node1,
          nodeMinus: node2,
          voltage: v,
          phase: phase,
        });
      }
    }

    const M = vSources.length;
    const matrixSize = unknownNodesCount + M;

    if (matrixSize === 0) {
      return this.createEmptyResult(timestamp, 'La red carece de ramas independientes para resolver.');
    }

    // 4. Assemble MNA System:
    // If AC: Complex admittance G + jB
    // If DC: Real conductance G
    const G_mat: number[][] = Array.from({ length: matrixSize }, () => new Array(matrixSize).fill(0));
    const B_mat: number[][] = Array.from({ length: matrixSize }, () => new Array(matrixSize).fill(0));
    const I_r: number[] = new Array(matrixSize).fill(0);
    const I_i: number[] = new Array(matrixSize).fill(0);

    const omega = 2 * Math.PI * (systemFrequency || 60);

    // Helper to stamp conductance/admittance between two nodes (1-based to unknown index)
    const stampAdmittance = (n1: number, n2: number, g: number, b: number) => {
      // n1 and n2 are in {0, ..., N-1}, where 0 is ground
      const i = n1 - 1; // index in submatrix [0 ... unknownNodesCount - 1]
      const j = n2 - 1;

      if (i >= 0) {
        G_mat[i][i] += g;
        B_mat[i][i] += b;
      }
      if (j >= 0) {
        G_mat[j][j] += g;
        B_mat[j][j] += b;
      }
      if (i >= 0 && j >= 0) {
        G_mat[i][j] -= g;
        G_mat[j][i] -= g;
        B_mat[i][j] -= b;
        B_mat[j][i] -= b;
      }
    };

    // Helper to add shunt admittance to ground from wire resistance
    for (const wire of wires) {
      const pin1Key = `${wire.fromComponentId}_${wire.fromPinId}`;
      const pin2Key = `${wire.toComponentId}_${wire.toPinId}`;
      const n1Raw = pinToNode.get(pin1Key) ?? 0;
      const n2Raw = pinToNode.get(pin2Key) ?? 0;
      const n1 = nodeMap.get(n1Raw) ?? 0;
      const n2 = nodeMap.get(n2Raw) ?? 0;

      // Wire resistance (defaults to 0.005 Ohms for ideal wire, or explicit resistance)
      const rWire = Math.max(wire.resistance ?? 0.002, 0.0005);
      const gWire = 1 / rWire;
      stampAdmittance(n1, n2, gWire, 0);
    }

    // Stamp passive & load components
    for (const comp of components) {
      if (comp.type === 'ground' || comp.type === 'dc_source' || comp.type === 'ac_source') {
        continue;
      }

      const pair = compNodePairs.get(comp.id);
      if (!pair) continue;
      const { node1, node2 } = pair;

      let R = 1e9; // Open circuit fallback
      let L = 0;
      let C = 0;

      switch (comp.type) {
        case 'resistor':
          R = Math.max(comp.resistance ?? 100, 0.001);
          break;

        case 'conductor': {
          // Conductor resistance calculation based on resistivity, length and crossSection:
          // R = rho * L / S
          if (comp.resistance !== undefined && comp.resistance > 0) {
            R = comp.resistance;
          } else {
            const rho = comp.resistivity ?? 0.0175; // Copper standard: 0.0175 Ohm*mm^2/m
            const len = Math.max(comp.length ?? 10, 0.1);
            const s = Math.max(comp.crossSection ?? 2.5, 0.5); // mm^2
            R = (rho * len) / s;
          }
          R = Math.max(R, 0.0001);
          break;
        }

        case 'switch':
          // Closed switch: ~0.0001 Ohms, Open switch: 1e9 Ohms
          R = comp.isOpen ? 1e9 : 0.0001;
          break;

        case 'fuse':
          // Blown fuse: 1e9 Ohms, Intact fuse: 0.002 Ohms
          R = comp.isBlown ? 1e9 : 0.002;
          break;

        case 'lamp': {
          // Lamp nominal resistance: R = V_nom^2 / P_nom
          const vNom = comp.ratedVoltage ?? 120;
          const pNom = comp.ratedPower ?? 60;
          R = Math.max((vNom * vNom) / Math.max(pNom, 1), 0.1);
          break;
        }

        case 'load': {
          if (comp.resistance && comp.resistance > 0) {
            R = comp.resistance;
          } else {
            const vNom = comp.ratedVoltage ?? 120;
            const pNom = comp.ratedPower ?? 500;
            R = Math.max((vNom * vNom) / Math.max(pNom, 1), 0.1);
          }
          break;
        }

        case 'motor': {
          // Motor electrical model: Series R + L
          const vNom = comp.ratedVoltage ?? 220;
          const pNom = comp.ratedPower ?? 1500;
          // Equivalent resistive part:
          R = Math.max((vNom * vNom * 0.85) / Math.max(pNom, 1), 0.5);
          // Inductive reactance in AC
          L = comp.inductance ?? 0.05; // 50 mH default
          break;
        }

        case 'ammeter':
          // Ideal ammeter: very small resistance
          R = 0.00005;
          break;

        case 'voltmeter':
          // Ideal voltmeter: very high impedance
          R = 1e7;
          break;

        case 'fault_short':
          // Fault injection: short circuit
          R = comp.isFaultActive !== false ? 0.002 : 1e9;
          break;

        case 'fault_leakage': {
          // Insulation leakage to Ground
          const rLeak = comp.insulationResistance ?? 500;
          // One terminal is connected to node1, the other leaks to ground (node 0)
          const gLeak = 1 / Math.max(rLeak, 1);
          stampAdmittance(node1, 0, gLeak, 0);
          R = 1e9;
          break;
        }

        default:
          R = 100;
          break;
      }

      // Compute impedance Z = R + j(omega*L - 1/(omega*C))
      let g = 0;
      let b = 0;

      if (!hasAC || (L === 0 && C === 0)) {
        g = 1 / R;
        b = 0;
      } else {
        const xL = omega * L;
        const xC = C > 0 ? 1 / (omega * C) : 0;
        const X = xL - xC;
        const zMagSq = R * R + X * X;
        if (zMagSq > 1e-12) {
          g = R / zMagSq;
          b = -X / zMagSq;
        } else {
          g = 1e6;
          b = 0;
        }
      }

      stampAdmittance(node1, node2, g, b);
    }

    // 5. Stamp Voltage Sources (B and C matrices in MNA)
    for (let k = 0; k < M; k++) {
      const src = vSources[k];
      const rowIdx = unknownNodesCount + k;

      const nPlus = src.nodePlus - 1;
      const nMinus = src.nodeMinus - 1;

      // Positive node connection (+1)
      if (nPlus >= 0) {
        G_mat[nPlus][rowIdx] += 1;
        G_mat[rowIdx][nPlus] += 1;
      }

      // Negative node connection (-1)
      if (nMinus >= 0) {
        G_mat[nMinus][rowIdx] -= 1;
        G_mat[rowIdx][nMinus] -= 1;
      }

      // RHS Voltage Value
      if (hasAC) {
        const phaseRad = (src.phase * Math.PI) / 180;
        I_r[rowIdx] = src.voltage * Math.cos(phaseRad);
        I_i[rowIdx] = src.voltage * Math.sin(phaseRad);
      } else {
        I_r[rowIdx] = src.voltage;
        I_i[rowIdx] = 0;
      }
    }

    // 6. Solve the system
    let nodeVoltagesReal: number[] = [];
    let nodeVoltagesImag: number[] = [];
    let vSourceCurrentsReal: number[] = [];
    let vSourceCurrentsImag: number[] = [];

    if (hasAC) {
      const complexSol = MathSolver.solveComplexSystem(G_mat, B_mat, I_r, I_i);
      if (!complexSol.success) {
        return this.createEmptyResult(timestamp, complexSol.error || 'Error al resolver sistema AC.');
      }
      nodeVoltagesReal = complexSol.realPart.slice(0, unknownNodesCount);
      nodeVoltagesImag = complexSol.imagPart.slice(0, unknownNodesCount);
      vSourceCurrentsReal = complexSol.realPart.slice(unknownNodesCount);
      vSourceCurrentsImag = complexSol.imagPart.slice(unknownNodesCount);
    } else {
      // Pure real system
      const realSol = MathSolver.solveLinearSystem(G_mat, I_r);
      if (!realSol.success) {
        return this.createEmptyResult(timestamp, realSol.error || 'Error al resolver matriz nodal.');
      }
      nodeVoltagesReal = realSol.solution.slice(0, unknownNodesCount);
      nodeVoltagesImag = new Array(unknownNodesCount).fill(0);
      vSourceCurrentsReal = realSol.solution.slice(unknownNodesCount);
      vSourceCurrentsImag = new Array(M).fill(0);
    }

    // 7. Format Node Results (Node 0 is always 0V reference)
    const nodeResultsMap = new Map<number, NodeResult>();
    nodeResultsMap.set(0, {
      nodeId: 0,
      voltage: 0,
      phaseAngle: 0,
      connectedComponents: [],
    });

    for (let i = 0; i < unknownNodesCount; i++) {
      const originalNodeId = i + 1;
      const vR = nodeVoltagesReal[i] ?? 0;
      const vI = nodeVoltagesImag[i] ?? 0;
      const magnitude = Math.sqrt(vR * vR + vI * vI);
      const phaseDeg = (Math.atan2(vI, vR) * 180) / Math.PI;

      nodeResultsMap.set(originalNodeId, {
        nodeId: originalNodeId,
        voltage: magnitude,
        phaseAngle: phaseDeg,
        connectedComponents: [],
      });
    }

    // Associate components with nodes
    for (const [compId, pair] of compNodePairs.entries()) {
      nodeResultsMap.get(pair.node1)?.connectedComponents.push(compId);
      nodeResultsMap.get(pair.node2)?.connectedComponents.push(compId);
    }

    // 8. Compute Branch Currents, Power & Drops
    const branchResultsMap = new Map<string, BranchResult>();
    let totalP = 0;
    let totalQ = 0;
    let totalSourceCurrent = 0;
    let primarySourceVoltage = 0;

    // Voltage source branches
    for (let k = 0; k < M; k++) {
      const src = vSources[k];
      const iR = vSourceCurrentsReal[k] ?? 0;
      const iI = vSourceCurrentsImag[k] ?? 0;
      const iMag = Math.sqrt(iR * iR + iI * iI);
      const iPhase = (Math.atan2(iI, iR) * 180) / Math.PI;

      const pActive = Math.abs(src.voltage * iMag * Math.cos(((src.phase - iPhase) * Math.PI) / 180));
      const qReactive = Math.abs(src.voltage * iMag * Math.sin(((src.phase - iPhase) * Math.PI) / 180));

      if (k === 0) {
        primarySourceVoltage = src.voltage;
        totalSourceCurrent = iMag;
      }

      branchResultsMap.set(src.component.id, {
        componentId: src.component.id,
        type: src.component.type,
        name: src.component.name,
        fromNode: src.nodePlus,
        toNode: src.nodeMinus,
        voltageDrop: src.voltage,
        voltageAngle: src.phase,
        current: iMag,
        currentAngle: iPhase,
        powerActive: pActive,
        powerReactive: qReactive,
        powerApparent: src.voltage * iMag,
        powerFactor: src.voltage * iMag > 1e-4 ? pActive / (src.voltage * iMag) : 1,
        resistance: 0.001,
        isOverloaded: false,
        status: 'normal',
      });
    }

    // Passive and load branches
    for (const comp of components) {
      if (comp.type === 'ground' || comp.type === 'dc_source' || comp.type === 'ac_source') {
        continue;
      }

      const pair = compNodePairs.get(comp.id);
      if (!pair) continue;
      const { node1, node2 } = pair;

      const v1Res = nodeResultsMap.get(node1);
      const v2Res = nodeResultsMap.get(node2);

      const v1R = node1 === 0 ? 0 : nodeVoltagesReal[node1 - 1];
      const v1I = node1 === 0 ? 0 : nodeVoltagesImag[node1 - 1];
      const v2R = node2 === 0 ? 0 : nodeVoltagesReal[node2 - 1];
      const v2I = node2 === 0 ? 0 : nodeVoltagesImag[node2 - 1];

      const vDropR = v1R - v2R;
      const vDropI = v1I - v2I;
      const vDropMag = Math.sqrt(vDropR * vDropR + vDropI * vDropI);
      const vDropPhase = (Math.atan2(vDropI, vDropR) * 180) / Math.PI;

      // Component impedance
      let R = 100;
      let X = 0;
      if (comp.type === 'resistor') R = Math.max(comp.resistance ?? 100, 0.001);
      else if (comp.type === 'conductor') {
        R = comp.resistance ?? ((comp.resistivity ?? 0.0175) * (comp.length ?? 10)) / (comp.crossSection ?? 2.5);
      } else if (comp.type === 'switch') R = comp.isOpen ? 1e9 : 0.0001;
      else if (comp.type === 'fuse') R = comp.isBlown ? 1e9 : 0.002;
      else if (comp.type === 'lamp') R = Math.max((Math.pow(comp.ratedVoltage ?? 120, 2)) / Math.max(comp.ratedPower ?? 60, 1), 0.1);
      else if (comp.type === 'load') R = Math.max((Math.pow(comp.ratedVoltage ?? 120, 2)) / Math.max(comp.ratedPower ?? 500, 1), 0.1);
      else if (comp.type === 'motor') {
        R = Math.max((Math.pow(comp.ratedVoltage ?? 220, 2) * 0.85) / Math.max(comp.ratedPower ?? 1500, 1), 0.5);
        X = omega * (comp.inductance ?? 0.05);
      } else if (comp.type === 'ammeter') R = 0.00005;
      else if (comp.type === 'voltmeter') R = 1e7;
      else if (comp.type === 'fault_short') R = comp.isFaultActive !== false ? 0.002 : 1e9;
      else if (comp.type === 'fault_leakage') R = comp.insulationResistance ?? 500;

      const zMag = Math.sqrt(R * R + X * X);
      const currentMag = zMag > 1e-9 ? vDropMag / zMag : 0;
      const phiZ = (Math.atan2(X, R) * 180) / Math.PI;
      const currentPhase = vDropPhase - phiZ;

      const pActive = currentMag * currentMag * R;
      const qReactive = currentMag * currentMag * X;
      const sApparent = vDropMag * currentMag;
      const pf = sApparent > 1e-4 ? pActive / sApparent : 1;

      if (comp.type !== 'switch' || !comp.isOpen) {
        totalP += pActive;
        totalQ += qReactive;
      }

      // Check rated current / overload
      const ratedI = comp.ratedCurrent ?? (comp.type === 'conductor' ? 16 : comp.type === 'fuse' ? 10 : 25);
      const isOverloaded = currentMag > ratedI * 1.05;
      const overloadPercent = isOverloaded ? ((currentMag - ratedI) / ratedI) * 100 : 0;

      branchResultsMap.set(comp.id, {
        componentId: comp.id,
        type: comp.type,
        name: comp.name,
        fromNode: node1,
        toNode: node2,
        voltageDrop: vDropMag,
        voltageAngle: vDropPhase,
        current: currentMag,
        currentAngle: currentPhase,
        powerActive: pActive,
        powerReactive: qReactive,
        powerApparent: sApparent,
        powerFactor: pf,
        resistance: R,
        isOverloaded,
        overloadPercent,
        status: isOverloaded ? 'overload' : comp.isOpen || comp.isBlown ? 'off' : 'normal',
      });
    }

    // 9. Kirchhoff's Current Law (KCL) verification at each node
    const kirchhoffSums: { nodeId: number; currentSum: number }[] = [];
    for (let node = 1; node <= unknownNodesCount; node++) {
      let sumCurrent = 0;
      for (const branch of branchResultsMap.values()) {
        if (branch.fromNode === node) {
          sumCurrent -= branch.current;
        } else if (branch.toNode === node) {
          sumCurrent += branch.current;
        }
      }
      kirchhoffSums.push({ nodeId: node, currentSum: Math.abs(sumCurrent) });
    }

    // 10. Global metrics
    const totalS = Math.sqrt(totalP * totalP + totalQ * totalQ);
    const overallPF = totalS > 1e-4 ? totalP / totalS : 1;
    const req = totalSourceCurrent > 1e-6 ? primarySourceVoltage / totalSourceCurrent : 0;

    return {
      success: true,
      timestamp,
      circuitState: 'NORMAL',
      totalVoltage: primarySourceVoltage,
      totalCurrent: totalSourceCurrent,
      totalPower: totalP,
      totalReactivePower: totalQ,
      totalApparentPower: totalS,
      powerFactor: overallPF,
      equivalentResistance: req,
      frequency: systemFrequency,
      isAC: hasAC,
      totalComponents: components.length,
      normalComponentsCount: components.length,
      faultyComponentsCount: 0,
      nodeVoltages: nodeResultsMap,
      branchResults: branchResultsMap,
      faults: [],
      kirchhoffSumAtNodes: kirchhoffSums,
    };
  }

  /**
   * Identifies electrical nodes by merging interconnected pins using Union-Find.
   */
  private static extractNodes(
    components: CircuitComponent[],
    wires: Wire[]
  ): { pinToNode: Map<string, number>; nodeCount: number; groundNodeId?: number } {
    // Collect all pins
    const allPins: string[] = [];
    let groundPinKey: string | undefined;

    for (const comp of components) {
      for (const pin of comp.pins) {
        const key = `${comp.id}_${pin.id}`;
        allPins.push(key);
        if (comp.type === 'ground') {
          groundPinKey = key;
        }
      }
    }

    // Parent mapping for union-find
    const parent = new Map<string, string>();
    for (const p of allPins) {
      parent.set(p, p);
    }

    const find = (i: string): string => {
      const p = parent.get(i);
      if (!p) return i;
      if (p === i) return i;
      const root = find(p);
      parent.set(i, root);
      return root;
    };

    const union = (i: string, j: string) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent.set(rootI, rootJ);
      }
    };

    // Union pins connected by wires
    for (const wire of wires) {
      const p1 = `${wire.fromComponentId}_${wire.fromPinId}`;
      const p2 = `${wire.toComponentId}_${wire.toPinId}`;
      if (parent.has(p1) && parent.has(p2)) {
        union(p1, p2);
      }
    }

    // Map distinct roots to sequential node IDs
    const rootToNodeId = new Map<string, number>();
    let counter = 0;

    // If explicit ground exists, assign it Node 0 first
    let designatedGroundNodeId: number | undefined;
    if (groundPinKey && parent.has(groundPinKey)) {
      const gRoot = find(groundPinKey);
      rootToNodeId.set(gRoot, counter++);
      designatedGroundNodeId = 0;
    }

    for (const p of allPins) {
      const r = find(p);
      if (!rootToNodeId.has(r)) {
        rootToNodeId.set(r, counter++);
      }
    }

    // If no explicit ground, check the negative pin of the primary voltage source
    if (designatedGroundNodeId === undefined) {
      const primarySource = components.find(
        (c) => c.type === 'dc_source' || c.type === 'ac_source'
      );
      if (primarySource && primarySource.pins.length >= 2) {
        const negPinKey = `${primarySource.id}_${primarySource.pins[1].id}`;
        const negRoot = find(negPinKey);
        designatedGroundNodeId = rootToNodeId.get(negRoot);
      }
    }

    const pinToNode = new Map<string, number>();
    for (const p of allPins) {
      const r = find(p);
      pinToNode.set(p, rootToNodeId.get(r) ?? 0);
    }

    return {
      pinToNode,
      nodeCount: counter,
      groundNodeId: designatedGroundNodeId,
    };
  }

  private static createEmptyResult(timestamp: number, errorMessage: string): SimulationResult {
    return {
      success: false,
      timestamp,
      error: errorMessage,
      circuitState: 'SIMULACION DETENIDA',
      totalVoltage: 0,
      totalCurrent: 0,
      totalPower: 0,
      totalReactivePower: 0,
      totalApparentPower: 0,
      powerFactor: 1,
      equivalentResistance: 0,
      frequency: 0,
      isAC: false,
      totalComponents: 0,
      normalComponentsCount: 0,
      faultyComponentsCount: 0,
      nodeVoltages: new Map(),
      branchResults: new Map(),
      faults: [],
      kirchhoffSumAtNodes: [],
    };
  }
}
