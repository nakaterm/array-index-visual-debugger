// @jsxImportSource react
import React from 'react';
import { PointerInfo, PointerType, VsCodeApi } from '../types';

interface PointersListProps {
  pointers: PointerInfo[];
  vscode: VsCodeApi;
}

export function PointersList({ pointers, vscode }: PointersListProps) {
  const getTypeDisplay = (type: PointerType) => {
    switch (type) {
      case 'index':
        return 'Index';
      case 'row':
        return 'Row (i)';
      case 'col':
        return 'Col (j)';
      default:
        return type;
    }
  };

  if (pointers.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-white">Active Pointers</h4>
        <p className="text-xs text-gray-400 italic">No pointers added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-white">Active Pointers</h4>
      <div className="space-y-2">
        {pointers.map((pointer) => (
          <div
            key={pointer.name}
            className="flex items-center justify-between bg-gray-700 rounded px-3 py-2"
          >
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm text-blue-300">{pointer.name}</span>
              <span className="text-xs text-gray-400">{getTypeDisplay(pointer.type)}</span>
              <span className="text-xs text-gray-300 font-mono">
                = {pointer.value >= 0 ? pointer.value : '?'}
              </span>
            </div>
            <button
              onClick={() => {
                vscode.postMessage({
                  type: 'deletePointer',
                  name: pointer.name,
                });
              }}
              className="vscode-button text-xs px-2 py-1 hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
