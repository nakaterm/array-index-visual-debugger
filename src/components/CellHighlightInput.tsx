// @jsxImportSource react
import React from 'react';
import { PointerInfo, CellHighlight } from '../types';

interface CellHighlightInputProps {
  pointers: PointerInfo[];
  onAddHighlight: (rowPointer: string, colPointer: string) => void;
  onRemoveHighlight: (index: number) => void;
  cellHighlights: CellHighlight[];
  arrayName: string;
}

export function CellHighlightInput({
  pointers,
  onAddHighlight,
  onRemoveHighlight,
  cellHighlights,
  arrayName,
}: CellHighlightInputProps) {
  const [selectedRowPointer, setSelectedRowPointer] = React.useState('');
  const [selectedColPointer, setSelectedColPointer] = React.useState('');

  const rowPointers = pointers.filter((p) => p.type === 'row');
  const colPointers = pointers.filter((p) => p.type === 'col');

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-white">Cell Highlight</h3>

      <div className="space-y-3">
        <div className="space-y-2">
          <select
            value={selectedRowPointer}
            onChange={(e) => setSelectedRowPointer(e.target.value)}
            className="vscode-input w-full text-sm"
          >
            <option value="">Select Row Pointer</option>
            {rowPointers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} (= {p.value})
              </option>
            ))}
          </select>

          <div className="flex items-center justify-center">
            <span className="text-gray-300 text-sm">×</span>
          </div>

          <select
            value={selectedColPointer}
            onChange={(e) => setSelectedColPointer(e.target.value)}
            className="vscode-input w-full text-sm"
          >
            <option value="">Select Column Pointer</option>
            {colPointers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} (= {p.value})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            if (selectedRowPointer && selectedColPointer) {
              onAddHighlight(selectedRowPointer, selectedColPointer);
              setSelectedRowPointer('');
              setSelectedColPointer('');
            }
          }}
          disabled={!selectedRowPointer || !selectedColPointer}
          className="vscode-button w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Add Cell Highlight
        </button>
      </div>

      {cellHighlights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-white">Active Highlights</h4>
          <div className="space-y-2">
            {cellHighlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-700 rounded px-3 py-2"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 border border-gray-300 rounded"
                    style={{
                      backgroundColor: highlight.color,
                    }}
                  ></div>
                  <span className="text-sm text-gray-300 font-mono">
                    {arrayName || ''}[{highlight.rowPointer}][{highlight.colPointer}]
                  </span>
                </div>
                <button
                  onClick={() => onRemoveHighlight(index)}
                  className="vscode-button text-xs px-2 py-1 hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
