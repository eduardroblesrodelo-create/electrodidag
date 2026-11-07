/**
 * ELECTRODIAG - Interactive Circuit Canvas (SVG)
 * Provides schematic rendering, pin-to-pin wiring, dragging, zoom/pan, and dynamic current flow animation.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CircuitComponent, Wire, SimulationResult, Pin, AppSettings } from '../../types/circuit';
import { ComponentSVG } from './ComponentSVGs';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface EditorCanvasProps {
  components: CircuitComponent[];
  wires: Wire[];
  selectedComponentId: string | null;
  selectedWireId: string | null;
  simulationResult: SimulationResult | null;
  isSimulating: boolean;
  settings: AppSettings;
  onSelectComponent: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onUpdateComponentPosition: (id: string, x: number, y: number) => void;
  onAddWire: (fromCompId: string, fromPinId: string, toCompId: string, toPinId: string) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  components,
  wires,
  selectedComponentId,
  selectedWireId,
  simulationResult,
  isSimulating,
  settings,
  onSelectComponent,
  onSelectWire,
  onUpdateComponentPosition,
  onAddWire,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging Component
  const [draggedCompId, setDraggedCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Wiring state: starting pin
  const [wiringStart, setWiringStart] = useState<{
    componentId: string;
    pin: Pin;
    worldPos: { x: number; y: number };
  } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Helper: calculate absolute canvas coordinates for a pin
  const getPinWorldPos = useCallback(
    (comp: CircuitComponent, pin: Pin) => {
      // Rotation transform
      const rad = (comp.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = pin.x * cos - pin.y * sin;
      const ry = pin.x * sin + pin.y * cos;
      return {
        x: comp.x + rx,
        y: comp.y + ry,
      };
    },
    []
  );

  // Convert mouse screen coordinates to SVG world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - pan.x) / zoom;
      const y = (screenY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Handle Zoom with Mouse Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.3), 3.0);

    // Zoom towards mouse pointer
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
      });
    }
    setZoom(newZoom);
  };

  // Canvas Mouse Down (Start Pan or Deselect)
  const handleMouseDown = (e: React.MouseEvent) => {
    // If middle click or space key or clicking blank canvas
    if (e.button === 1 || e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      if (wiringStart) {
        setWiringStart(null); // Cancel wiring
      }
      onSelectComponent(null);
      onSelectWire(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldCoord = screenToWorld(e.clientX, e.clientY);
    setMousePos(worldCoord);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggedCompId) {
      let nextX = worldCoord.x - dragOffset.x;
      let nextY = worldCoord.y - dragOffset.y;

      if (settings.gridSnap) {
        const grid = settings.gridSize;
        nextX = Math.round(nextX / grid) * grid;
        nextY = Math.round(nextY / grid) * grid;
      }

      onUpdateComponentPosition(draggedCompId, nextX, nextY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedCompId(null);
  };

  // Start dragging a component
  const handleComponentMouseDown = (e: React.MouseEvent, comp: CircuitComponent) => {
    e.stopPropagation();
    onSelectComponent(comp.id);
    onSelectWire(null);

    const worldCoord = screenToWorld(e.clientX, e.clientY);
    setDraggedCompId(comp.id);
    setDragOffset({
      x: worldCoord.x - comp.x,
      y: worldCoord.y - comp.y,
    });
  };

  // Pin interaction: Start or Complete wire
  const handlePinClick = (e: React.MouseEvent, comp: CircuitComponent, pin: Pin) => {
    e.stopPropagation();
    const pinPos = getPinWorldPos(comp, pin);

    if (!wiringStart) {
      // Start wiring
      setWiringStart({
        componentId: comp.id,
        pin,
        worldPos: pinPos,
      });
    } else {
      // Finish wiring if not the same pin
      if (wiringStart.componentId !== comp.id || wiringStart.pin.id !== pin.id) {
        onAddWire(wiringStart.componentId, wiringStart.pin.id, comp.id, pin.id);
      }
      setWiringStart(null);
    }
  };

  // Reset View
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fit to screen
  const handleFitView = () => {
    if (components.length === 0) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    components.forEach((c) => {
      minX = Math.min(minX, c.x - 50);
      minY = Math.min(minY, c.y - 50);
      maxX = Math.max(maxX, c.x + 50);
      maxY = Math.max(maxY, c.y + 50);
    });

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const contentWidth = Math.max(maxX - minX, 200);
      const contentHeight = Math.max(maxY - minY, 200);
      const scaleX = (rect.width - 100) / contentWidth;
      const scaleY = (rect.height - 100) / contentHeight;
      const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.6);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setZoom(newScale);
      setPan({
        x: rect.width / 2 - centerX * newScale,
        y: rect.height / 2 - centerY * newScale,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="flex-1 h-full bg-slate-950 relative overflow-hidden select-none cursor-crosshair"
    >
      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-1 shadow-lg gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Acercar (Zoom In)"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z / 1.2, 0.4))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-1.5 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleFitView}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Ajustar al Contenido"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Restablecer Vista (100%)"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Wiring Instruction Banner if actively wiring */}
      {wiringStart && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-cyan-950/90 border border-cyan-700 text-cyan-200 text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
          <span>Haga clic en un segundo borne para trazar el conductor</span>
          <button
            onClick={() => setWiringStart(null)}
            className="text-slate-400 hover:text-white underline ml-2 text-[11px]"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Main SVG Render Surface */}
      <svg
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          {/* Engineering grid pattern */}
          <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="#334155" opacity="0.6" />
          </pattern>
          <pattern id="grid-lines" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#grid-dots)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1e293b" strokeWidth="0.8" />
          </pattern>
        </defs>

        {/* Endless Grid Background */}
        <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid-lines)" />

        {/* 1. WIRES LAYER */}
        <g id="wires-layer">
          {wires.map((wire) => {
            const comp1 = components.find((c) => c.id === wire.fromComponentId);
            const comp2 = components.find((c) => c.id === wire.toComponentId);
            if (!comp1 || !comp2) return null;

            const pin1 = comp1.pins.find((p) => p.id === wire.fromPinId);
            const pin2 = comp2.pins.find((p) => p.id === wire.toPinId);
            if (!pin1 || !pin2) return null;

            const p1 = getPinWorldPos(comp1, pin1);
            const p2 = getPinWorldPos(comp2, pin2);

            const isSelected = selectedWireId === wire.id;

            // Check if current is flowing
            const b1 = simulationResult?.branchResults.get(comp1.id);
            const b2 = simulationResult?.branchResults.get(comp2.id);
            const currentMag = Math.max(b1?.current ?? 0, b2?.current ?? 0);
            const hasCurrent = isSimulating && currentMag > 0.005;

            // Orthogonal manhattan routing for neat schematics
            const midX = (p1.x + p2.x) / 2;
            const pathData = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;

            return (
              <g
                key={wire.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWire(wire.id);
                  onSelectComponent(null);
                }}
                className="cursor-pointer group"
              >
                {/* Hitbox for easy clicking */}
                <path d={pathData} fill="none" stroke="transparent" strokeWidth="16" />

                {/* Base Wire */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? '#38bdf8' : '#64748b'}
                  strokeWidth={isSelected ? '3.5' : '2.5'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors group-hover:stroke-cyan-400"
                />

                {/* Animated Current Flow (Conventional current) */}
                {hasCurrent && settings.showCurrentParticles && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="6 8"
                    strokeLinecap="round"
                    className="wire-current-forward"
                    style={{
                      animationDuration: `${Math.max(0.3, 1.8 / Math.min(Math.max(currentMag, 0.5), 10))}s`,
                    }}
                  />
                )}

                {/* Current magnitude label along wire */}
                {hasCurrent && (
                  <g transform={`translate(${midX}, ${(p1.y + p2.y) / 2 - 8})`}>
                    <rect
                      x="-24"
                      y="-9"
                      width="48"
                      height="16"
                      rx="3"
                      fill="#0f172a"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3"
                      fill="#38bdf8"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {currentMag.toFixed(2)}A
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Active wire being drawn */}
          {wiringStart && (
            <line
              x1={wiringStart.worldPos.x}
              y1={wiringStart.worldPos.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
          )}
        </g>

        {/* 2. COMPONENTS LAYER */}
        <g id="components-layer">
          {components.map((comp) => {
            const isSelected = selectedComponentId === comp.id;
            const branch = simulationResult?.branchResults.get(comp.id);

            return (
              <g
                key={comp.id}
                transform={`translate(${comp.x}, ${comp.y})`}
                onMouseDown={(e) => handleComponentMouseDown(e, comp)}
                className="cursor-move group"
              >
                {/* Selection Ring */}
                {isSelected && (
                  <rect
                    x="-48"
                    y="-48"
                    width="96"
                    height="96"
                    rx="6"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                    className="animate-pulse"
                  />
                )}

                {/* Component Symbol with Rotation */}
                <g transform={`rotate(${comp.rotation})`}>
                  <ComponentSVG
                    component={comp}
                    isSelected={isSelected}
                    branchResult={branch}
                    isSimulating={isSimulating}
                  />

                  {/* Pins (Terminals) */}
                  {comp.pins.map((pin) => (
                    <g
                      key={pin.id}
                      transform={`translate(${pin.x}, ${pin.y})`}
                      onClick={(e) => handlePinClick(e, comp, pin)}
                      className="cursor-pointer"
                    >
                      {/* Generous Terminal Click Target */}
                      <circle cx="0" cy="0" r="10" fill="transparent" />
                      {/* Visible terminal pin */}
                      <circle
                        cx="0"
                        cy="0"
                        r="4.5"
                        fill="#0f172a"
                        stroke={isSelected ? '#38bdf8' : '#e2e8f0'}
                        strokeWidth="2"
                        className="hover:scale-150 transition-transform"
                      />
                    </g>
                  ))}
                </g>

                {/* Component Tag / Label */}
                <text
                  x="0"
                  y="52"
                  fill="#cbd5e1"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {comp.name}
                </text>

                {/* Primary Electrical Value Tag */}
                <text
                  x="0"
                  y="65"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {comp.type === 'dc_source'
                    ? `${comp.voltage ?? 24}V DC`
                    : comp.type === 'ac_source'
                    ? `${comp.voltage ?? 120}V AC`
                    : comp.type === 'resistor'
                    ? `${comp.resistance ?? 50}Ω`
                    : comp.type === 'conductor'
                    ? `${((comp.resistance ?? 0.05)).toFixed(3)}Ω`
                    : comp.type === 'fuse'
                    ? `${comp.ratedCurrent ?? 10}A`
                    : comp.type === 'lamp'
                    ? `${comp.ratedPower ?? 60}W`
                    : comp.type === 'motor'
                    ? `${comp.ratedPower ?? 1500}W`
                    : ''}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
