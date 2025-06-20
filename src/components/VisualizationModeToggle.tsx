// @jsxImportSource react
import React from 'react';
import { VisualizationMode } from '../types';

interface VisualizationModeToggleProps {
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
}

export function VisualizationModeToggle({ mode, onModeChange }: VisualizationModeToggleProps) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onModeChange('highlight')}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          mode === 'highlight'
            ? 'bg-gray-600 text-gray-200'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
        }`}
      >
        Border
      </button>
      <button
        onClick={() => onModeChange('arrow')}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          mode === 'arrow'
            ? 'bg-gray-600 text-gray-200'
            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
        }`}
      >
        Arrow
      </button>
    </div>
  );
}
