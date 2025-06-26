export interface VsCodeApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage: (message: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setState: (state: any) => void;
}

declare global {
  interface Window {
    acquireVsCodeApi: () => VsCodeApi;
  }
}

export type VisualizationMode = 'arrow' | 'highlight';

export type IndexMode = '0-indexed' | '1-indexed';

export type PointerType = 'index' | 'row' | 'col';

export type PointerInfo = {
  name: string;
  type: PointerType;
  value: number;
};

export type ArrayVisualizerProps = {
  arrayName: string;
  arrayValue: (number | string)[][] | (number | string)[];
  pointers: PointerInfo[];
  pointerColorMap: { [name: string]: string };
  is2D: boolean;
  visualizationMode: VisualizationMode;
  indexMode: IndexMode;
  zoomLevel?: number;
  showTitle?: boolean;
};

export type CellHighlight = {
  rowPointer: string;
  colPointer: string;
  color: string;
};

export interface DebugVariable {
  name: string;
  value: string;
  type?: string;
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
}

export interface DebugScope {
  name: string;
  variablesReference: number;
  expensive?: boolean;
}

export interface DebugThread {
  id: number;
  name: string;
}

export interface DebugStackFrame {
  id: number;
  name: string;
  source?: {
    name?: string;
    path?: string;
  };
  line: number;
  column: number;
}

export interface AddPointerMessage {
  type: 'addPointer';
  name: string;
  pointerType?: PointerType;
}

export interface DeletePointerMessage {
  type: 'deletePointer';
  name: string;
}

export interface SetArrayNameMessage {
  type: 'setArrayName';
  arrayName: string;
  is2D?: boolean;
}

export interface ValidateExpressionMessage {
  type: 'validateExpression';
  expression: string;
}

export type ExtensionMessage =
  | AddPointerMessage
  | DeletePointerMessage
  | SetArrayNameMessage
  | ValidateExpressionMessage;
