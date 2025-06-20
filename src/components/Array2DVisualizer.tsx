// @jsxImportSource react
import React from 'react';
import { ArrayVisualizerProps, CellHighlight } from '../types';
import { GRID_HEADER_WIDTH, GRID_HEADER_HEIGHT, GRID_MIN_CELL_WIDTH, ROW_NUMBER_WIDTH, COL_NUMBER_HEIGHT } from '../constants';

// 2次元配列表示用のコンポーネント
export const Array2DVisualizer: React.FC<
  ArrayVisualizerProps & {
    cellHighlights?: CellHighlight[];
  }
> = ({
  arrayName,
  arrayValue,
  pointers,
  pointerColorMap,
  visualizationMode,
  indexMode,
  cellHighlights = [],
  showTitle = true,
}) => {
  if (!Array.isArray(arrayValue) || !Array.isArray(arrayValue[0])) {
    return <div>Invalid 2D array data</div>;
  }

  const array2D = arrayValue as (number | string)[][];
  const rows = array2D.length;
  const cols = array2D[0]?.length || 0;

  const rowPointers = pointers.filter((p) => p.type === 'row');
  const colPointers = pointers.filter((p) => p.type === 'col');

  // インデックス番号を計算する関数
  const getDisplayIndex = (index: number): number => {
    return indexMode === '1-indexed' ? index + 1 : index;
  };

  return (
    <div className="font-mono text-xl w-full">
      {showTitle && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{arrayName}</h2>
          <p className="text-lg text-gray-300">
            2D Array: {rows}×{cols}
          </p>
        </div>
      )}

      <div className="relative w-full">
        {/* 行・列全体のハイライト用オーバーレイ（CSS Gridベース） */}
        {visualizationMode === 'highlight' && (
          <div
            className="highlight-overlay absolute inset-0 pointer-events-none z-10 grid items-stretch justify-items-stretch gap-1"
            style={{
              gridTemplateColumns: `${GRID_HEADER_WIDTH}px ${ROW_NUMBER_WIDTH}px repeat(${cols}, minmax(4em, 1fr))`,
              gridTemplateRows: `${GRID_HEADER_HEIGHT}px ${COL_NUMBER_HEIGHT}px repeat(${rows}, minmax(3em, auto))`,
            }}
          >
            {/* グリッド構造を完全に再現するためのプレースホルダー */}
            {/* 左上の空のコーナーセル */}
            <div className="w-32 h-20"></div>
            
            {/* 行番号ヘッダー用の空セル */}
            <div className="w-10 h-20"></div>

            {/* 列ヘッダー部分 */}
            {Array.from({ length: cols }, (_, colIdx) => (
              <div key={`col-header-overlay-${colIdx}`} className="min-h-20"></div>
            ))}

            {/* 列番号ヘッダー行 */}
            <div className="w-32 h-8"></div>
            <div className="w-10 h-8"></div>
            {Array.from({ length: cols }, (_, colIdx) => (
              <div key={`col-number-overlay-${colIdx}`} className="min-h-8"></div>
            ))}

            {/* データ行の各セル */}
            {Array.from({ length: rows }, (_, rowIdx) => (
              <React.Fragment key={`row-overlay-${rowIdx}`}>
                {/* 行ヘッダー部分 */}
                <div className="min-w-32 min-h-12"></div>
                
                {/* 行番号部分 */}
                <div className="min-w-10 min-h-12"></div>

                {/* データセル */}
                {Array.from({ length: cols }, (_, colIdx) => (
                  <div key={`overlay-cell-${rowIdx}-${colIdx}`} className="min-w-16 min-h-12"></div>
                ))}
              </React.Fragment>
            ))}

            {/* 行ハイライト */}
            {rowPointers.map((pointer) => {
              if (pointer.value >= 0 && pointer.value < rows) {
                const color = pointerColorMap[pointer.name];
                return (
                  <div
                    key={`row-highlight-${pointer.name}`}
                    className="pointer-highlight self-stretch justify-self-stretch m-0.5 rounded-md"
                    style={{
                      gridColumn: `3 / ${cols + 3}`,
                      gridRow: pointer.value + 3,
                      borderColor: color,
                    }}
                  />
                );
              }
              return null;
            })}

            {/* 列ハイライト */}
            {colPointers.map((pointer) => {
              if (pointer.value >= 0 && pointer.value < cols) {
                const color = pointerColorMap[pointer.name];
                return (
                  <div
                    key={`col-highlight-${pointer.name}`}
                    className="pointer-highlight self-stretch justify-self-stretch m-0.5 rounded-md"
                    style={{
                      gridColumn: pointer.value + 3,
                      gridRow: `3 / ${rows + 3}`,
                      borderColor: color,
                    }}
                  />
                );
              }
              return null;
            })}
          </div>
        )}

        <div
          className="array-2d-layout grid items-center justify-items-center gap-1"
          style={{
            gridTemplateColumns: `${GRID_HEADER_WIDTH}px ${ROW_NUMBER_WIDTH}px repeat(${cols}, minmax(4em, 1fr))`,
            gridTemplateRows: `${GRID_HEADER_HEIGHT}px ${COL_NUMBER_HEIGHT}px repeat(${rows}, minmax(3em, auto))`,
            minWidth: `${GRID_HEADER_WIDTH + ROW_NUMBER_WIDTH + cols * GRID_MIN_CELL_WIDTH}px`, // 最小幅を確保してスクロール可能に
          }}
        >
          {/* 左上の空のコーナーセル */}
          <div className="w-32 h-20"></div>
          
          {/* 行番号ヘッダー用の空セル */}
          <div className="w-10 h-20"></div>

          {/* 列ポインタ領域 */}
          {Array.from({ length: cols }, (_, colIdx) => (
            <div
              key={`col-header-${colIdx}`}
              className="w-full h-full min-h-20 flex flex-col items-center justify-end gap-1 box-border"
            >
              {colPointers
                .filter((p) => p.value === colIdx)
                .map((pointer) => (
                  <div
                    key={pointer.name}
                    className="flex flex-col items-center text-sm"
                    style={{
                      color: pointerColorMap[pointer.name],
                    }}
                  >
                    <span>{pointer.name}</span>
                    <span className="text-lg">↓</span>
                  </div>
                ))}
            </div>
          ))}

          {/* 列番号ヘッダー行 */}
          <div className="w-32 h-8"></div>
          <div className="w-10 h-8"></div>
          {Array.from({ length: cols }, (_, colIdx) => (
            <div
              key={`col-number-${colIdx}`}
              className="w-full h-full min-h-8 flex items-center justify-center text-xs text-gray-200 bg-gray-600 font-sans"
              style={{
                borderRadius: '0',
              }}
            >
              {getDisplayIndex(colIdx)}
            </div>
          ))}

          {/* 配列の各行 */}
          {array2D.map((row, rowIdx) => (
            <React.Fragment key={`row-${rowIdx}`}>
              {/* 行ポインタ領域 */}
              <div className="w-full h-full min-w-32 flex flex-col items-end justify-center gap-1 box-border">
                {rowPointers
                  .filter((p) => p.value === rowIdx)
                  .map((pointer) => (
                    <div
                      key={pointer.name}
                      className="flex items-center text-sm"
                      style={{
                        color: pointerColorMap[pointer.name],
                      }}
                    >
                      <span className="mr-1">{pointer.name}</span>
                      <span className="text-lg">→</span>
                    </div>
                  ))}
              </div>

              {/* 行番号 */}
              <div 
                className="w-full h-full min-w-10 flex items-center justify-center text-xs text-gray-200 bg-gray-600 font-sans"
                style={{
                  borderRadius: '0',
                }}
              >
                {getDisplayIndex(rowIdx)}
              </div>

              {/* データセル */}
              {row.map((cell, colIdx) => {
                // セルハイライトの確認
                const cellHighlight = cellHighlights.find((highlight) => {
                  const rowPointer = pointers.find(
                    (p) => p.name === highlight.rowPointer && p.type === 'row'
                  );
                  const colPointer = pointers.find(
                    (p) => p.name === highlight.colPointer && p.type === 'col'
                  );
                  return rowPointer?.value === rowIdx && colPointer?.value === colIdx;
                });

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className="array-cell relative w-full h-full"
                    style={{
                      backgroundColor: cellHighlight ? cellHighlight.color : 'transparent',
                    }}
                  >
                    {cell}

                    {/* セルハイライトでの特別な表示 */}
                    {cellHighlight && (
                      <div
                        className="absolute -inset-0.5 rounded-md pointer-events-none z-30"
                        style={{
                          border: `3px solid ${cellHighlight.color}`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
