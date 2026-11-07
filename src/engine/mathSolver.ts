/**
 * ELECTRODIAG - Mathematical Matrix Solver for Linear & Complex Electrical Systems
 * Implements Gaussian elimination with partial pivoting and Modified Nodal Analysis (MNA).
 */

export class MathSolver {
  private static readonly EPSILON = 1e-11;

  /**
   * Solves A * x = b for real linear system using Gaussian Elimination with Partial Pivoting.
   * @param A Square matrix (n x n)
   * @param b Right-hand side vector (n)
   * @returns Solution vector x (n)
   */
  public static solveLinearSystem(A: number[][], b: number[]): { success: boolean; solution: number[]; error?: string } {
    const n = A.length;
    if (n === 0 || b.length !== n) {
      return { success: false, solution: [], error: 'Dimensiones de matriz inválidas o inconsistentes.' };
    }

    // Create deep copy of augmented matrix [A | b]
    const M: number[][] = [];
    for (let i = 0; i < n; i++) {
      if (A[i].length !== n) {
        return { success: false, solution: [], error: 'La matriz A debe ser cuadrada.' };
      }
      M[i] = [...A[i], b[i]];
    }

    // Forward Elimination with Partial Pivoting
    for (let col = 0; col < n; col++) {
      // Find pivot row
      let maxRow = col;
      let maxVal = Math.abs(M[col][col]);
      for (let row = col + 1; row < n; row++) {
        const val = Math.abs(M[row][col]);
        if (val > maxVal) {
          maxVal = val;
          maxRow = row;
        }
      }

      // Check for singularity
      if (maxVal < this.EPSILON) {
        return {
          success: false,
          solution: [],
          error: `Matriz singular o casi singular detectada en columna ${col}. Puede deberse a un nodo flotante, bucle de fuentes de tensión sin resistencia o circuito desconectado.`,
        };
      }

      // Swap rows if necessary
      if (maxRow !== col) {
        const temp = M[col];
        M[col] = M[maxRow];
        M[maxRow] = temp;
      }

      // Eliminate rows below
      const pivot = M[col][col];
      for (let row = col + 1; row < n; row++) {
        const factor = M[row][col] / pivot;
        if (Math.abs(factor) > 1e-15) {
          M[row][col] = 0;
          for (let j = col + 1; j <= n; j++) {
            M[row][j] -= factor * M[col][j];
          }
        }
      }
    }

    // Back Substitution
    const x = new Array<number>(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = M[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * x[j];
      }
      if (Math.abs(M[i][i]) < this.EPSILON) {
        return { success: false, solution: [], error: 'Indeterminación numérica durante sustitución regresiva.' };
      }
      x[i] = sum / M[i][i];
      // Clean up microscopic float artifacts
      if (Math.abs(x[i]) < 1e-12) {
        x[i] = 0;
      }
    }

    return { success: true, solution: x };
  }

  /**
   * Solves complex linear system for AC phasor analysis:
   * (G + jB) * (vr + j vi) = (ir + j ii)
   * Represented as a 2N x 2N real matrix:
   * [ G  -B ] [ vr ] = [ ir ]
   * [ B   G ] [ vi ] = [ ii ]
   */
  public static solveComplexSystem(
    G: number[][],
    B: number[][],
    ir: number[],
    ii: number[]
  ): { success: boolean; realPart: number[]; imagPart: number[]; error?: string } {
    const n = G.length;
    const size = 2 * n;

    const A: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
    const b: number[] = new Array(size).fill(0);

    for (let r = 0; r < n; r++) {
      b[r] = ir[r];
      b[r + n] = ii[r];

      for (let c = 0; c < n; c++) {
        // Upper left: G
        A[r][c] = G[r][c];
        // Upper right: -B
        A[r][c + n] = -B[r][c];
        // Lower left: B
        A[r + n][c] = B[r][c];
        // Lower right: G
        A[r + n][c + n] = G[r][c];
      }
    }

    const res = this.solveLinearSystem(A, b);
    if (!res.success) {
      return { success: false, realPart: [], imagPart: [], error: res.error };
    }

    const realPart = res.solution.slice(0, n);
    const imagPart = res.solution.slice(n, size);

    return { success: true, realPart, imagPart };
  }
}
