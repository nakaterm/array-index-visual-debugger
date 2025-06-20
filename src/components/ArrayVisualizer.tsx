// @jsxImportSource react
import React from 'react';
import { ArrayVisualizerProps, CellHighlight, VisualizationMode, IndexMode } from '../types';
import { Array1DVisualizer } from './Array1DVisualizer';
import { Array2DVisualizer } from './Array2DVisualizer';

export const ArrayVisualizer: React.FC<
  ArrayVisualizerProps & {
    cellHighlights?: CellHighlight[];
    onVisualizationModeChange?: (mode: VisualizationMode) => void;
    onIndexModeChange?: (mode: IndexMode) => void;
    zoomLevel?: number;
  }
> = (props) => {
  const zoomLevel = props.zoomLevel || 1.0;

  const propsWithZoom = {
    ...props,
    zoomLevel,
  };

  return (
    <div className="w-full">
      {/* 配列描画部分（ズーム対象） */}
      <div className="w-full" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease-in-out',
            width: props.is2D 
              ? `${120 + 40 + (Array.isArray(props.arrayValue) && Array.isArray(props.arrayValue[0]) ? props.arrayValue[0].length : 0) * 64 + 64}px`
              : `${Array.isArray(props.arrayValue) ? props.arrayValue.length * 4 : 0}em`,
            height: props.is2D
              ? `${80 + 30 + (Array.isArray(props.arrayValue) ? props.arrayValue.length : 0) * 64 + 64}px`
              : `${props.pointers.filter(p => p.type === 'index').length * 60 + 200}px`,
          }}
        >
          {props.is2D ? (
            <Array2DVisualizer {...propsWithZoom} showTitle={false} />
          ) : (
            <Array1DVisualizer {...propsWithZoom} showTitle={false} />
          )}
        </div>
      </div>
    </div>
  );
};
