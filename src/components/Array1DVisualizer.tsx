// @jsxImportSource react
import React from 'react';
import { ArrayVisualizerProps } from '../types';
import {
  CELL_WIDTH,
  POINTER_ROW_HEIGHT,
  POINTER_LABEL_MARGIN,
  POINTER_LABEL_HEIGHT,
} from '../constants';

// 1次元配列表示用のコンポーネント（既存のロジックを維持）
export const Array1DVisualizer: React.FC<ArrayVisualizerProps> = ({
  arrayName,
  arrayValue,
  pointers,
  pointerColorMap,
  visualizationMode,
  indexMode,
  showTitle = true,
}) => {
  if (!Array.isArray(arrayValue) || Array.isArray(arrayValue[0])) {
    return <div>Invalid 1D array data</div>;
  }

  const array1D = arrayValue as (number | string)[];
  const indexPointers = pointers.filter((p) => p.type === 'index');

  // インデックス番号を計算する関数
  const getDisplayIndex = (index: number): number => {
    return indexMode === '1-indexed' ? index + 1 : index;
  };

  // 各ポインタを配置する位置を計算
  const pointerPositions: { [name: string]: { row: number; index: number } } = {};

  // ポインタを各行に振り分ける（各ポインタが1行を専有する）
  indexPointers.forEach((pointer, idx) => {
    pointerPositions[pointer.name] = {
      row: idx, // 各ポインタに専用の行を割り当て
      index: pointer.value !== undefined ? pointer.value : -1,
    };
  });

  const maxRow = indexPointers.length;

  // ポインタとセルの位置を合わせるための計算用関数
  // インデックスからX座標を計算（webviewのサイズ変化に対応）
  const getXPositionForIndex = (index: number) => {
    // セルの中央位置を正確に計算
    // 各セルは4emの幅で、セルの中央は index * 4em + 2em の位置
    return `calc(${index * CELL_WIDTH}em + ${CELL_WIDTH / 2}em)`;
  };

  return (
    <div className="font-mono text-xl w-full">
      {showTitle && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{arrayName}</h2>
          <p className="text-lg text-gray-300">1D Array: {array1D.length} elements</p>
        </div>
      )}

      {/* ポインタラベル + 矢印行 (矢印モードの場合のみ) */}
      {visualizationMode === 'arrow' && (
        <div className="w-full mb-5">
          <div
            className="flex flex-col relative"
            style={{
              height: maxRow * POINTER_ROW_HEIGHT + 30,
              minWidth: `${array1D.length * CELL_WIDTH}em`, // 配列幅に合わせる
            }}
          >
            {/* 各ポインタの行 */}
            {indexPointers.map((pointer, rowIdx) => {
              const position = pointerPositions[pointer.name];
              if (position.index < 0) return null;

              const color = pointerColorMap[pointer.name];

              // 同じインデックスを指すポインタをカウント（この行より前の行）
              const sameIndexPointers = indexPointers
                .slice(0, rowIdx)
                .filter((p) => pointerPositions[p.name].index === position.index).length;

              // 各セルの中央位置を計算、同じインデックスを指すポインタがある場合は少しずらす
              const baseX = getXPositionForIndex(position.index); // 基本位置
              const offsetX = sameIndexPointers * 6; // 重なり防止のオフセット（6px単位）
              const samePosCount = indexPointers.filter(
                (p) => pointerPositions[p.name].index === position.index
              ).length;
              const finalOffsetX = offsetX - (samePosCount - 1) * 3;
              const posX = baseX; // 基本位置のみ使用
              const posY = rowIdx * POINTER_ROW_HEIGHT + POINTER_LABEL_MARGIN; // 行位置の計算（各行60px、上部に5pxのマージン）

              return (
                <React.Fragment key={pointer.name}>
                  {/* ポインタラベル */}
                  <div
                    className="absolute transform -translate-x-1/2"
                    style={{
                      left: `calc(${posX} + ${finalOffsetX}px)`,
                      top: posY,
                    }}
                  >
                    <div
                      className="rounded-lg text-base px-2 py-0.5 z-20 whitespace-nowrap"
                      style={{
                        color,
                        borderColor: color,
                        background: '#23272e',
                        border: `2px solid ${color}`,
                      }}
                    >
                      {pointer.name}
                    </div>
                  </div>

                  {/* ポインタから配列要素への矢印 */}
                  <div
                    className="absolute w-0.5 transform -translate-x-1/2"
                    style={{
                      left: `calc(${posX} + ${finalOffsetX}px)`,
                      top: posY + POINTER_LABEL_HEIGHT,
                      height: maxRow * POINTER_ROW_HEIGHT - posY - POINTER_LABEL_HEIGHT + 44, // インデックス番号分の高さ（24px）を追加
                      backgroundColor: color,
                    }}
                  >
                    {/* 矢印の先端 */}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      className="absolute -bottom-1.5 -left-1.5"
                      style={{
                        fill: color,
                      }}
                    >
                      <polygon points="7,14 0,0 14,0" />
                    </svg>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ポインタ表示のためのスペース（border modeのみ） */}
      {visualizationMode === 'highlight' && indexPointers.length > 0 && (
        <div
          className="w-full"
          style={{
            height: `${50 + indexPointers.length * 25}px`, // ポインタラベル分のスペース（50px基本 + 25px×ポインタ数）
          }}
        />
      )}

      {/* インデックス番号行 */}
      <div className="w-full mb-2">
        <div
          className="flex items-center"
          style={{
            minWidth: `${array1D.length * CELL_WIDTH}em`, // 配列幅に合わせる
          }}
        >
          {array1D.map((_, i) => (
            <div
              key={`index-${i}`}
              className="relative"
              style={{
                width: `${CELL_WIDTH}em`,
                minWidth: `${CELL_WIDTH}em`,
                maxWidth: `${CELL_WIDTH}em`,
              }}
            >
              {/* インデックス番号セル本体 */}
              <div
                className="relative flex flex-col items-center p-1 bg-gray-600"
                style={{
                  width: `${CELL_WIDTH}em`,
                  minWidth: `${CELL_WIDTH}em`,
                  maxWidth: `${CELL_WIDTH}em`,
                  borderRadius: '0',
                }}
              >
                <span
                  className="font-sans text-xs text-center px-0.5 box-border text-gray-200"
                  style={{
                    width: `${CELL_WIDTH}em`,
                    minWidth: `${CELL_WIDTH}em`,
                    maxWidth: `${CELL_WIDTH}em`,
                  }}
                >
                  {getDisplayIndex(i)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 配列値行 */}
      <div className="w-full">
        <div
          className="flex items-end"
          style={{
            minWidth: `${array1D.length * CELL_WIDTH}em`, // 最小幅を確保してスクロール可能に
          }}
        >
          {array1D.map((v, i) => {
            const pointersForCell = indexPointers.filter((p) => p.value === i);

            return (
              <div
                key={i}
                className="relative"
                style={{
                  width: `${CELL_WIDTH}em`,
                  minWidth: `${CELL_WIDTH}em`,
                  maxWidth: `${CELL_WIDTH}em`,
                }}
              >
                {/* セル本体 */}
                <div
                  className="array-cell relative flex flex-col items-center p-1"
                  style={{
                    width: `${CELL_WIDTH}em`,
                    minWidth: `${CELL_WIDTH}em`,
                    maxWidth: `${CELL_WIDTH}em`,
                  }}
                >
                  <span
                    className="elem-value font-mono text-lg text-center px-0.5 box-border text-gray-300"
                    style={{
                      width: `${CELL_WIDTH}em`,
                      minWidth: `${CELL_WIDTH}em`,
                      maxWidth: `${CELL_WIDTH}em`,
                    }}
                  >
                    {v}
                  </span>
                </div>

                {/* ハイライトモードの場合のみ枠線表示 */}
                {visualizationMode === 'highlight' &&
                  pointersForCell.map((pointer, idx) => (
                    <React.Fragment key={`highlight-${pointer.name}`}>
                      <div
                        className="absolute rounded pointer-events-none z-10"
                        style={{
                          top: idx * 2,
                          left: idx * 2,
                          right: -(idx * 2),
                          bottom: -(idx * 2),
                          border: `2px solid ${pointerColorMap[pointer.name]}`,
                        }}
                      />
                      {/* ポインタ変数名表示 */}
                      <div
                        className="absolute pointer-events-none z-20 transform -translate-x-1/2"
                        style={{
                          top: `-${50 + idx * 25}px`, // インデックス行より上に配置（50px上 + 重複時のオフセット25px）
                          left: '50%',
                        }}
                      >
                        <div
                          className="rounded px-1 py-0.5 text-xs whitespace-nowrap"
                          style={{
                            color: pointerColorMap[pointer.name],
                            backgroundColor: '#23272e',
                            border: `1px solid ${pointerColorMap[pointer.name]}`,
                          }}
                        >
                          {pointer.name}
                        </div>
                        {/* 小さな矢印 */}
                        <div
                          className="absolute left-1/2 transform -translate-x-1/2"
                          style={{
                            top: '100%',
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: `4px solid ${pointerColorMap[pointer.name]}`,
                          }}
                        />
                      </div>
                    </React.Fragment>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
