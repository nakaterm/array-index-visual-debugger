// @jsxImportSource react
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArrayVisualizerProps, VisualizationMode, IndexMode, CellHighlight } from './types';
import { HIGHLIGHT_COLORS } from './constants';
import { ArrayVisualizer } from './components/ArrayVisualizer';
import { PointersList } from './components/PointersList';
import { CellHighlightInput } from './components/CellHighlightInput';
import { PointerInput } from './components/PointerInput';
import { ArrayNameInput } from './components/ArrayNameInput';
import { TopRightControls } from './components/TopRightControls';

const vscode = window.acquireVsCodeApi();

// 新しいアプリコンポーネント
const VisualizerApp: React.FC = () => {
  const [props, setProps] = React.useState<ArrayVisualizerProps>({
    arrayName: '',
    arrayValue: [],
    pointers: [],
    pointerColorMap: {},
    is2D: false,
    visualizationMode: 'highlight',
    indexMode: '0-indexed',
  });

  const [visualizationMode, setVisualizationMode] = React.useState<VisualizationMode>('highlight');
  const visualizationModeRef = React.useRef<VisualizationMode>('highlight');
  
  const [indexMode, setIndexMode] = React.useState<IndexMode>('0-indexed');

  const [cellHighlights, setCellHighlights] = React.useState<CellHighlight[]>([]);
  const [zoomLevel, setZoomLevel] = React.useState(1.0);
  const [highlightColorMap, setHighlightColorMap] = React.useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    visualizationModeRef.current = visualizationMode;
  }, [visualizationMode]);

  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event || !event.data) {
        return;
      }

      const data = event.data;
      if (data && typeof data === 'object' && data.type === 'update' && data.props) {
        setProps((prevProps) => {
          // ポインタが削除された場合、関連するセルハイライトを削除
          if (prevProps.pointers.length > data.props.pointers.length) {
            const currentPointerNames = new Set(data.props.pointers.map((p: { name: string }) => p.name));
            setCellHighlights((prevHighlights) => {
              const filteredHighlights = prevHighlights.filter(
                (highlight) =>
                  currentPointerNames.has(highlight.rowPointer) &&
                  currentPointerNames.has(highlight.colPointer)
              );
              
              // Clean up color map for removed highlights
              const validHighlightKeys = new Set(
                filteredHighlights.map(h => `${h.rowPointer}:${h.colPointer}`)
              );
              setHighlightColorMap(prev => {
                const newColorMap: { [key: string]: string } = {};
                Object.entries(prev).forEach(([key, color]) => {
                  if (validHighlightKeys.has(key)) {
                    newColorMap[key] = color;
                  }
                });
                return newColorMap;
              });
              
              return filteredHighlights;
            });
          }

          return {
            ...data.props,
            visualizationMode: visualizationModeRef.current,
            indexMode: indexMode,
          };
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [indexMode]);

  const handleModeChange = (mode: VisualizationMode) => {
    setVisualizationMode(mode);
    setProps((prev) => ({ ...prev, visualizationMode: mode }));
  };

  const handleIndexModeChange = (mode: IndexMode) => {
    setIndexMode(mode);
    setProps((prev) => ({ ...prev, indexMode: mode }));
  };

  const handleAddHighlight = (rowPointer: string, colPointer: string) => {
    const highlightKey = `${rowPointer}:${colPointer}`;
    
    // Get colors already used by pointers and other highlights
    const usedColors = new Set([
      ...Object.values(props.pointerColorMap),
      ...Object.values(highlightColorMap)
    ]);
    
    // Find an available color that's not used by pointers or other highlights
    let availableColor = '';
    const availableColors = HIGHLIGHT_COLORS.filter(color => !usedColors.has(color));
    
    if (availableColors.length > 0) {
      // Pick a random color from available colors
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      availableColor = availableColors[randomIndex];
    } else {
      // Fallback to random if all colors are used
      const randomIndex = Math.floor(Math.random() * HIGHLIGHT_COLORS.length);
      availableColor = HIGHLIGHT_COLORS[randomIndex];
    }
    
    setHighlightColorMap(prev => ({
      ...prev,
      [highlightKey]: availableColor
    }));
    
    setCellHighlights((prev) => [...prev, { rowPointer, colPointer, color: availableColor }]);
  };

  const handleRemoveHighlight = (index: number) => {
    setCellHighlights((prev) => {
      const highlightToRemove = prev[index];
      if (highlightToRemove) {
        const highlightKey = `${highlightToRemove.rowPointer}:${highlightToRemove.colPointer}`;
        setHighlightColorMap(colorMap => {
          const newColorMap = { ...colorMap };
          delete newColorMap[highlightKey];
          return newColorMap;
        });
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="flex h-screen">
      {/* 左側の操作パネル */}
      <div className="w-80 p-4 border-r border-gray-600 overflow-y-auto bg-gray-800">
        <div className="space-y-4">
          <div className="border-b border-gray-600 pb-4">
            <h2 className="text-lg font-bold mb-3 text-white">Array</h2>
            <ArrayNameInput vscode={vscode} />
          </div>


          <div className="border-b border-gray-600 pb-4">
            <h2 className="text-lg font-bold mb-3 text-white">Pointers</h2>
            <div className="space-y-3">
              <PointerInput is2D={props.is2D} vscode={vscode} />
              <PointersList pointers={props.pointers} vscode={vscode} />
            </div>
          </div>

          {props.is2D && (
            <div>
              <CellHighlightInput
                pointers={props.pointers}
                onAddHighlight={handleAddHighlight}
                onRemoveHighlight={handleRemoveHighlight}
                cellHighlights={cellHighlights}
                arrayName={props.arrayName}
              />
            </div>
          )}
        </div>
      </div>

      {/* 右側の視覚化エリア */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* 上部のコントロールエリア */}
        <div className="flex justify-end p-4 pb-0">
          {props.arrayName && (
            <TopRightControls
              visualizationMode={visualizationMode}
              onModeChange={handleModeChange}
              indexMode={indexMode}
              onIndexModeChange={handleIndexModeChange}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
            />
          )}
        </div>
        
        {/* 配列名表示エリア（スクロール領域外） */}
        {props.arrayName && (
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-white mb-2">{props.arrayName}</h2>
            <p className="text-lg text-gray-300">
              {props.is2D 
                ? `2D Array: ${Array.isArray(props.arrayValue) ? props.arrayValue.length : 0}×${Array.isArray(props.arrayValue) && Array.isArray(props.arrayValue[0]) ? props.arrayValue[0].length : 0}`
                : `1D Array: ${Array.isArray(props.arrayValue) ? props.arrayValue.length : 0} elements`
              }
            </p>
          </div>
        )}
        
        {/* 描画エリア */}
        <div className="flex-1 overflow-auto p-6">
          <div className="min-h-full flex items-center justify-center">
            {props.arrayName ? (
              <div className="w-full max-w-full">
                <ArrayVisualizer 
                  {...props} 
                  cellHighlights={cellHighlights} 
                  onVisualizationModeChange={handleModeChange}
                  onIndexModeChange={handleIndexModeChange}
                  zoomLevel={zoomLevel}
                />
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <h3 className="text-xl font-semibold mb-2">Array Visualizer</h3>
                <p className="text-base">Enter an array variable name to start visualizing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 初回のみマウント
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<VisualizerApp />);
}
