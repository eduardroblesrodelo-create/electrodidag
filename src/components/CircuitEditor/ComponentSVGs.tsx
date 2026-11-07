/**
 * ELECTRODIAG - Standard Electrical Schematic Symbols (SVG)
 * Provides crisp, vector-based symbols for DC/AC sources, passives, protection, loads, and instruments.
 */

import React from 'react';
import { CircuitComponent, BranchResult } from '../../types/circuit';

interface ComponentSVGProps {
  component: CircuitComponent;
  isSelected: boolean;
  branchResult?: BranchResult;
  isSimulating: boolean;
}

export const ComponentSVG: React.FC<ComponentSVGProps> = ({
  component,
  isSelected,
  branchResult,
  isSimulating,
}) => {
  const isEnergized = isSimulating && (branchResult?.voltageDrop ?? 0) > 0.1;
  const isFaulty = branchResult?.isOverloaded || (component.type === 'fault_short' && component.isFaultActive);
  const isBlown = component.type === 'fuse' && component.isBlown;

  // Base stroke colors
  const strokeColor = isFaulty
    ? '#ef4444' // red-500
    : isSelected
    ? '#06b6d4' // cyan-500
    : isEnergized
    ? '#38bdf8' // sky-400
    : '#94a3b8'; // slate-400

  switch (component.type) {
    case 'dc_source':
      return (
        <g>
          {/* Outer circle */}
          <circle cx="0" cy="0" r="26" fill="#0f172a" stroke={strokeColor} strokeWidth="2.5" />
          {/* Top lead */}
          <line x1="0" y1="-26" x2="0" y2="-40" stroke={strokeColor} strokeWidth="2.5" />
          {/* Bottom lead */}
          <line x1="0" y1="26" x2="0" y2="40" stroke={strokeColor} strokeWidth="2.5" />
          {/* Battery plates inside */}
          <line x1="-14" y1="-8" x2="14" y2="-8" stroke="#ef4444" strokeWidth="3" />
          <line x1="-8" y1="8" x2="8" y2="8" stroke="#3b82f6" strokeWidth="3.5" />
          {/* Polarity signs */}
          <text x="7" y="-12" fill="#ef4444" fontSize="11" fontWeight="bold" textAnchor="middle">+</text>
          <text x="7" y="19" fill="#3b82f6" fontSize="13" fontWeight="bold" textAnchor="middle">-</text>
        </g>
      );

    case 'ac_source':
      return (
        <g>
          <circle cx="0" cy="0" r="26" fill="#0f172a" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="0" y1="-26" x2="0" y2="-40" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="0" y1="26" x2="0" y2="40" stroke={strokeColor} strokeWidth="2.5" />
          {/* Sine wave inside */}
          <path
            d="M -14 0 Q -7 -14 0 0 T 14 0"
            fill="none"
            stroke={isEnergized ? '#38bdf8' : '#cbd5e1'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text x="0" y="16" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
            {component.frequency ?? 60}Hz
          </text>
        </g>
      );

    case 'resistor':
      return (
        <g>
          {/* Connecting leads */}
          <line x1="-40" y1="0" x2="-22" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="22" y1="0" x2="40" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          {/* Zig-zag path */}
          <path
            d="M -22 0 L -16 -12 L -8 12 L 0 -12 L 8 12 L 16 -12 L 22 0"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      );

    case 'conductor':
      return (
        <g>
          {/* Conductor bar */}
          <line x1="-40" y1="0" x2="40" y2="0" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
          {/* Core metallic marker */}
          <line x1="-30" y1="0" x2="30" y2="0" stroke={isFaulty ? '#fca5a5' : '#38bdf8'} strokeWidth="1.8" />
        </g>
      );

    case 'switch':
      return (
        <g>
          <line x1="-40" y1="0" x2="-16" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="16" y1="0" x2="40" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          {/* Contact terminals */}
          <circle cx="-16" cy="0" r="3.5" fill="#0f172a" stroke={strokeColor} strokeWidth="2" />
          <circle cx="16" cy="0" r="3.5" fill="#0f172a" stroke={strokeColor} strokeWidth="2" />
          {/* Lever blade */}
          {component.isOpen ? (
            // Open lever tilted up
            <line x1="-16" y1="0" x2="12" y2="-18" stroke="#f59e0b" strokeWidth="2.8" strokeLinecap="round" />
          ) : (
            // Closed lever
            <line x1="-16" y1="0" x2="16" y2="0" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" />
          )}
        </g>
      );

    case 'fuse':
      return (
        <g>
          <line x1="-40" y1="0" x2="-20" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="20" y1="0" x2="40" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          {/* Fuse cartridge rectangle */}
          <rect
            x="-20"
            y="-10"
            width="40"
            height="20"
            rx="2"
            fill="#0f172a"
            stroke={isBlown ? '#ef4444' : strokeColor}
            strokeWidth="2"
          />
          {/* Internal fuse wire */}
          {isBlown ? (
            // Blown wire with gap
            <g>
              <line x1="-20" y1="0" x2="-6" y2="0" stroke="#ef4444" strokeWidth="2" />
              <line x1="6" y1="0" x2="20" y2="0" stroke="#ef4444" strokeWidth="2" />
              <text x="0" y="4" fill="#ef4444" fontSize="10" textAnchor="middle" fontWeight="bold">✕</text>
            </g>
          ) : (
            <line x1="-20" y1="0" x2="20" y2="0" stroke="#38bdf8" strokeWidth="2" />
          )}
        </g>
      );

    case 'lamp':
      return (
        <g>
          <line x1="0" y1="-40" x2="0" y2="-22" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="0" y1="22" x2="0" y2="40" stroke={strokeColor} strokeWidth="2.5" />
          {/* Glowing halo if energized */}
          {isEnergized && (
            <circle cx="0" cy="0" r="28" fill="#fef08a" opacity="0.25" className="animate-pulse" />
          )}
          {/* Lamp bulb */}
          <circle
            cx="0"
            cy="0"
            r="22"
            fill={isEnergized ? '#fef08a' : '#0f172a'}
            fillOpacity={isEnergized ? 0.9 : 1}
            stroke={strokeColor}
            strokeWidth="2.5"
          />
          {/* Internal cross 'X' */}
          <line
            x1="-12"
            y1="-12"
            x2="12"
            y2="12"
            stroke={isEnergized ? '#ca8a04' : strokeColor}
            strokeWidth="2"
          />
          <line
            x1="12"
            y1="-12"
            x2="-12"
            y2="12"
            stroke={isEnergized ? '#ca8a04' : strokeColor}
            strokeWidth="2"
          />
        </g>
      );

    case 'motor':
      return (
        <g>
          <line x1="0" y1="-40" x2="0" y2="-24" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="0" y1="24" x2="0" y2="40" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="0" cy="0" r="24" fill="#0f172a" stroke={strokeColor} strokeWidth="2.5" />
          <text
            x="0"
            y="7"
            fill={isEnergized ? '#38bdf8' : '#f8fafc'}
            fontSize="18"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            M
          </text>
          {isEnergized && (
            <path
              d="M -12 -12 A 16 16 0 0 1 12 -12"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
          )}
        </g>
      );

    case 'load':
      return (
        <g>
          <line x1="0" y1="-40" x2="0" y2="-20" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="0" y1="20" x2="0" y2="40" stroke={strokeColor} strokeWidth="2.5" />
          <rect
            x="-20"
            y="-20"
            width="40"
            height="40"
            rx="4"
            fill="#0f172a"
            stroke={strokeColor}
            strokeWidth="2"
          />
          <path d="M -14 12 L 14 -12" stroke={strokeColor} strokeWidth="2" />
          <text x="0" y="5" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">
            LOAD
          </text>
        </g>
      );

    case 'ammeter':
      return (
        <g>
          <line x1="-40" y1="0" x2="-22" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="22" y1="0" x2="40" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="0" cy="0" r="22" fill="#0f172a" stroke={strokeColor} strokeWidth="2.5" />
          <text x="0" y="6" fill="#38bdf8" fontSize="15" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            A
          </text>
        </g>
      );

    case 'voltmeter':
      return (
        <g>
          <line x1="0" y1="-40" x2="0" y2="-22" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="0" y1="22" x2="0" y2="40" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="0" cy="0" r="22" fill="#0f172a" stroke={strokeColor} strokeWidth="2.5" />
          <text x="0" y="6" fill="#10b981" fontSize="15" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            V
          </text>
        </g>
      );

    case 'ground':
      return (
        <g>
          <line x1="0" y1="-20" x2="0" y2="0" stroke={strokeColor} strokeWidth="2.5" />
          {/* Ground plates */}
          <line x1="-18" y1="0" x2="18" y2="0" stroke={strokeColor} strokeWidth="3" />
          <line x1="-12" y1="6" x2="12" y2="6" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="-6" y1="12" x2="6" y2="12" stroke={strokeColor} strokeWidth="2" />
        </g>
      );

    case 'fault_short':
      return (
        <g>
          <line x1="0" y1="-40" x2="0" y2="-16" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="0" y1="16" x2="0" y2="40" stroke="#ef4444" strokeWidth="2.5" />
          {/* Short circuit warning box */}
          <rect x="-18" y="-16" width="36" height="32" rx="4" fill="#450a0a" stroke="#ef4444" strokeWidth="2.5" />
          {/* Spark symbol */}
          <path d="M 0 -10 L -6 1 L 2 1 L -2 10 L 8 -1 L 0 -1 Z" fill="#facc15" stroke="#ef4444" strokeWidth="1" />
        </g>
      );

    case 'fault_leakage':
      return (
        <g>
          <line x1="0" y1="-40" x2="0" y2="-12" stroke="#f59e0b" strokeWidth="2.5" />
          <line x1="0" y1="12" x2="0" y2="40" stroke="#f59e0b" strokeWidth="2.5" />
          <rect x="-16" y="-12" width="32" height="24" rx="3" fill="#451a03" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
          <text x="0" y="4" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">
            R_ais
          </text>
        </g>
      );

    default:
      return (
        <rect x="-20" y="-20" width="40" height="40" fill="#1e293b" stroke={strokeColor} strokeWidth="2" />
      );
  }
};
