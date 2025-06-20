// @jsxImportSource react
import React from 'react';
import { VsCodeApi } from '../types';

interface ArrayNameInputProps {
  vscode: VsCodeApi;
}

export function ArrayNameInput({ vscode }: ArrayNameInputProps) {
  const [value, setValue] = React.useState('');
  const [is2D, setIs2D] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter array variable name"
          className="vscode-input w-full"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={is2D}
              onChange={(e) => setIs2D(e.target.checked)}
              className="rounded"
            />
            2D Array
          </label>
          <button
            onClick={() => {
              if (value.trim()) {
                vscode.postMessage({
                  type: 'setArrayName',
                  arrayName: value.trim(),
                  is2D,
                });
                setValue('');
              }
            }}
            disabled={!value.trim()}
            className="vscode-button disabled:opacity-60"
          >
            Set Array
          </button>
        </div>
      </div>
    </div>
  );
}
