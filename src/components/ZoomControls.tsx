// @jsxImportSource react
import React from 'react';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomChange: (zoomLevel: number) => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ zoomLevel, onZoomChange }) => {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoomLevel + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoomLevel - 0.1, 0.3));
  };

  const handleReset = () => {
    onZoomChange(1.0);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleZoomOut}
        className="px-2 py-1 rounded text-xs font-medium transition-colors bg-gray-700 text-gray-400 hover:bg-gray-600 flex items-center justify-center"
        title="Zoom Out"
      >
        −
      </button>
      <span className="text-gray-400 text-xs min-w-10 text-center px-1">
        {Math.round(zoomLevel * 100)}%
      </span>
      <button
        onClick={handleZoomIn}
        className="px-2 py-1 rounded text-xs font-medium transition-colors bg-gray-700 text-gray-400 hover:bg-gray-600 flex items-center justify-center"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={handleReset}
        className="px-2 py-1 rounded text-xs font-medium transition-colors bg-gray-700 text-gray-400 hover:bg-gray-600 flex items-center justify-center ml-1"
        title="Reset Zoom"
      >
        100%
      </button>
    </div>
  );
};