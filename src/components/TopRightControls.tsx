// @jsxImportSource react
import React from 'react';
import { VisualizationMode, IndexMode } from '../types';
import { VisualizationModeToggle } from './VisualizationModeToggle';
import { ZoomControls } from './ZoomControls';

interface TopRightControlsProps {
  visualizationMode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
  indexMode: IndexMode;
  onIndexModeChange: (mode: IndexMode) => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
}

export const TopRightControls: React.FC<TopRightControlsProps> = ({
  visualizationMode,
  onModeChange,
  indexMode,
  onIndexModeChange,
  zoomLevel,
  onZoomChange,
}) => {
  return (
    <div className="flex flex-row gap-2">
      {/* 拡大率コントロール */}
      <div className="bg-gray-800 bg-opacity-80 rounded-lg p-2 border border-gray-600">
        <ZoomControls zoomLevel={zoomLevel} onZoomChange={onZoomChange} />
      </div>

      {/* Display Mode */}
      <div className="bg-gray-800 bg-opacity-80 rounded-lg p-2 border border-gray-600">
        <VisualizationModeToggle mode={visualizationMode} onModeChange={onModeChange} />
      </div>

      {/* Index Mode */}
      <div className="bg-gray-800 bg-opacity-80 rounded-lg p-2 border border-gray-600">
        <div className="flex gap-1">
          <button
            onClick={() => onIndexModeChange('0-indexed')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              indexMode === '0-indexed'
                ? 'bg-gray-600 text-gray-200'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            0-indexed
          </button>
          <button
            onClick={() => onIndexModeChange('1-indexed')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              indexMode === '1-indexed'
                ? 'bg-gray-600 text-gray-200'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            1-indexed
          </button>
        </div>
      </div>
    </div>
  );
};
