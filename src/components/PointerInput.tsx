// @jsxImportSource react
import React from 'react';
import { PointerType, VsCodeApi } from '../types';

interface PointerInputProps {
  is2D: boolean;
  vscode: VsCodeApi;
}

export function PointerInput({ is2D, vscode }: PointerInputProps) {
  const [name, setName] = React.useState('');
  const [pointerType, setPointerType] = React.useState<PointerType>('index');
  const [isAdding, setIsAdding] = React.useState(false);
  const isAddingRef = React.useRef(false);

  React.useEffect(() => {
    // 2次元配列の場合、デフォルトを'row'に設定
    if (is2D && pointerType === 'index') {
      setPointerType('row');
    }
    // 1次元配列の場合、'index'以外は無効
    if (!is2D && pointerType !== 'index') {
      setPointerType('index');
    }
  }, [is2D, pointerType]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-white">Add New Pointer</h4>
      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Expression (e.g., i, i-1, i+j, row*2+1)..."
          className="vscode-input w-full text-sm"
        />
        {is2D && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPointerType('row')}
              className={`vscode-button text-sm ${
                pointerType === 'row' ? 'active bg-blue-600 text-white' : 'text-gray-300'
              }`}
            >
              Row Pointer
            </button>
            <button
              type="button"
              onClick={() => setPointerType('col')}
              className={`vscode-button text-sm ${
                pointerType === 'col' ? 'active bg-blue-600 text-white' : 'text-gray-300'
              }`}
            >
              Column Pointer
            </button>
          </div>
        )}
        <button
          onClick={async () => {
            if (name.trim() && !isAdding && !isAddingRef.current) {
              setIsAdding(true);
              isAddingRef.current = true;
              vscode.postMessage({
                type: 'addPointer',
                name: name.trim(),
                pointerType,
              });
              setName('');
              // 確実な二重クリック防止
              setTimeout(() => {
                setIsAdding(false);
                isAddingRef.current = false;
              }, 1000);
            }
          }}
          disabled={isAdding || !name.trim()}
          className="vscode-button w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isAdding ? 'Adding...' : 'Add Pointer'}
        </button>
      </div>
    </div>
  );
}
