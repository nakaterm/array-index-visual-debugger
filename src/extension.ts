import * as vscode from 'vscode';
import { DebugVariable, DebugScope, DebugThread, DebugStackFrame, ExtensionMessage } from './types';
import { POINTER_COLORS } from './constants';

type PointerInfo = {
  name: string;
  type: 'index' | 'row' | 'col';
};

type ArrayBlock = {
  is2D: boolean;
  pointers: PointerInfo[];
};

type PointerData = {
  name: string;
  type: 'index' | 'row' | 'col';
  value: number;
};

class StateManager {
  private blocks: Map<string, ArrayBlock> = new Map();
  private currentArrayName: string = '';
  private isProcessingOperation: boolean = false;
  private errorShownForArray: Set<string> = new Set();
  private errorShownForPointer: Set<string> = new Set();

  getBlocks(): Map<string, ArrayBlock> {
    return this.blocks;
  }

  getBlock(varName: string): ArrayBlock | undefined {
    return this.blocks.get(varName);
  }

  setBlock(varName: string, block: ArrayBlock): void {
    this.blocks.set(varName, block);
  }

  hasBlock(varName: string): boolean {
    return this.blocks.has(varName);
  }

  getCurrentArrayName(): string {
    return this.currentArrayName;
  }

  setCurrentArrayName(arrayName: string): void {
    this.currentArrayName = arrayName;
  }

  isProcessing(): boolean {
    return this.isProcessingOperation;
  }

  setProcessing(processing: boolean): void {
    this.isProcessingOperation = processing;
  }

  shouldShowArrayError(arrayName: string): boolean {
    return !this.errorShownForArray.has(arrayName);
  }

  markArrayErrorShown(arrayName: string): void {
    this.errorShownForArray.add(arrayName);
  }

  clearArrayError(arrayName: string): void {
    this.errorShownForArray.delete(arrayName);
  }

  shouldShowPointerError(key: string): boolean {
    return !this.errorShownForPointer.has(key);
  }

  markPointerErrorShown(key: string): void {
    this.errorShownForPointer.add(key);
  }

  clearPointerErrorsForArray(arrayName: string): void {
    for (const key of this.errorShownForPointer) {
      if (key.startsWith(`${arrayName}:`)) {
        this.errorShownForPointer.delete(key);
      }
    }
  }

  clear(): void {
    this.blocks.clear();
    this.currentArrayName = '';
    this.isProcessingOperation = false;
    this.errorShownForArray.clear();
    this.errorShownForPointer.clear();
  }
}

class DebugService {
  private variablesCache: Map<number, DebugVariable[]> = new Map();

  private async getVariables(
    session: vscode.DebugSession,
    variablesReference: number
  ): Promise<DebugVariable[]> {
    if (this.variablesCache.has(variablesReference)) {
      return this.variablesCache.get(variablesReference)!;
    }

    const varsResp = await session.customRequest('variables', {
      variablesReference,
    });
    const variables: DebugVariable[] = varsResp.variables || [];
    this.variablesCache.set(variablesReference, variables);
    return variables;
  }

  async resolveVariable(
    session: vscode.DebugSession,
    scopes: DebugScope[],
    varPath: string[]
  ): Promise<DebugVariable | undefined> {
    // Clear cache for each resolve operation to ensure fresh data
    this.variablesCache.clear();

    let currentVarsRefs = scopes.map((scope) => scope.variablesReference);
    let variable: DebugVariable | undefined = undefined;
    for (let i = 0; i < varPath.length; i++) {
      let found = false;
      for (const varsRef of currentVarsRefs) {
        const variables = await this.getVariables(session, varsRef);
        variable = variables.find((v: DebugVariable) => v.name === varPath[i]);
        if (variable) {
          found = true;
          if (i < varPath.length - 1 && variable.variablesReference) {
            currentVarsRefs = [variable.variablesReference];
          }
          break;
        }
      }
      if (!found) {
        return undefined;
      }
    }
    return variable;
  }

  async getDebugContext(session: vscode.DebugSession) {
    const threadsResp = await session.customRequest('threads');
    const threads: DebugThread[] = threadsResp.threads || [];
    if (threads.length === 0) {
      throw new Error('No threads found in debug session.');
    }
    const threadId = threads[0].id;

    const stackResp = await session.customRequest('stackTrace', {
      threadId,
      startFrame: 0,
      levels: 1,
    });
    const stackFrames: DebugStackFrame[] = stackResp.stackFrames || [];
    const frameId = stackFrames[0]?.id;
    if (!frameId) {
      throw new Error('Could not get current stack frame.');
    }

    const variablesResp = await session.customRequest('scopes', { frameId });
    const scopes: DebugScope[] = variablesResp.scopes || [];

    return { threadId, frameId, scopes };
  }

  async getArrayValue(
    session: vscode.DebugSession,
    arrayName: string,
    is2D: boolean
  ): Promise<(number | string)[] | (number | string)[][] | undefined> {
    const { scopes } = await this.getDebugContext(session);

    for (const scope of scopes) {
      const variable = await this.resolveVariable(
        session,
        [scope],
        arrayName
          .split('.')
          .map((s) => s.trim())
          .filter(Boolean)
      );

      if (variable && variable.variablesReference) {
        const variables = await this.getVariables(session, variable.variablesReference);

        if (is2D) {
          return await this.parse2DArray(session, variables);
        } else {
          return this.parse1DArray(variables);
        }
      }
    }
    return undefined;
  }

  private async parse2DArray(
    session: vscode.DebugSession,
    variables: DebugVariable[]
  ): Promise<(number | string)[][]> {
    const rowVariables = variables
      .filter((v: DebugVariable) => /^\d+$/.test(v.name))
      .sort((a: DebugVariable, b: DebugVariable) => Number(a.name) - Number(b.name));

    const array2D: (number | string)[][] = [];
    for (const rowVar of rowVariables) {
      if (rowVar.variablesReference) {
        const rowVariables = await this.getVariables(session, rowVar.variablesReference);
        const row = this.parse1DArray(rowVariables);
        array2D.push(row as (number | string)[]);
      }
    }
    return array2D;
  }

  private parse1DArray(variables: DebugVariable[]): (number | string)[] {
    return variables
      .filter((v: DebugVariable) => /^\d+$/.test(v.name))
      .sort((a: DebugVariable, b: DebugVariable) => Number(a.name) - Number(b.name))
      .map((v: DebugVariable) => {
        const num = Number(v.value);
        return isNaN(num) ? v.value : num;
      });
  }

  async evaluateExpression(
    session: vscode.DebugSession,
    expression: string
  ): Promise<number | undefined> {
    try {
      const { frameId } = await this.getDebugContext(session);

      const evalResp = await session.customRequest('evaluate', {
        expression: expression.trim(),
        frameId,
        context: 'watch',
      });

      if (evalResp && evalResp.result !== undefined) {
        const value = Number(evalResp.result);
        return Number.isInteger(value) ? value : undefined;
      }
    } catch {
      // Silently handle evaluation errors - they're expected for invalid expressions
    }
    return undefined;
  }

  async validateExpression(
    session: vscode.DebugSession,
    expression: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const { frameId } = await this.getDebugContext(session);

      const evalResp = await session.customRequest('evaluate', {
        expression: expression.trim(),
        frameId,
        context: 'watch',
      });

      if (evalResp && evalResp.result !== undefined) {
        const value = Number(evalResp.result);
        if (Number.isInteger(value)) {
          return { isValid: true };
        } else {
          return { isValid: false, error: 'Expression must evaluate to an integer' };
        }
      } else {
        return { isValid: false, error: 'Expression could not be evaluated' };
      }
    } catch (error) {
      // Check if it's a "not available" error (variable undefined)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('not available') || errorMessage.includes('undefined')) {
        return { isValid: false, error: 'Variable is not available in current scope' };
      } else {
        return { isValid: false, error: 'Invalid expression syntax' };
      }
    }
  }

  async getPointerValues(
    session: vscode.DebugSession,
    pointerInfos: PointerInfo[]
  ): Promise<PointerData[]> {
    const pointers: PointerData[] = [];
    const seenPointers = new Set<string>();

    for (const pointerInfo of pointerInfos) {
      if (seenPointers.has(pointerInfo.name)) {
        continue;
      }

      // Try to evaluate the expression directly
      const value = await this.evaluateExpression(session, pointerInfo.name);

      if (value !== undefined) {
        pointers.push({
          name: pointerInfo.name,
          type: pointerInfo.type,
          value,
        });
        seenPointers.add(pointerInfo.name);
      }
    }

    return pointers;
  }
}

class PollingService {
  private pollingIntervals: { [varName: string]: NodeJS.Timeout } = {};
  private readonly POLLING_INTERVAL = 1000;

  startPolling(
    session: vscode.DebugSession,
    varName: string,
    panel: vscode.WebviewPanel,
    updateCallback: () => Promise<void>
  ): void {
    if (!varName) {
      return;
    }

    if (this.pollingIntervals[varName]) {
      clearInterval(this.pollingIntervals[varName]);
    }

    const interval = setInterval(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!panel || (panel as any).isDisposed) {
        clearInterval(interval);
        delete this.pollingIntervals[varName];
        return;
      }
      await updateCallback();
    }, this.POLLING_INTERVAL);

    this.pollingIntervals[varName] = interval;

    panel.onDidDispose(() => {
      clearInterval(interval);
      delete this.pollingIntervals[varName];
    });
  }

  stopPolling(varName: string): void {
    if (this.pollingIntervals[varName]) {
      clearInterval(this.pollingIntervals[varName]);
      delete this.pollingIntervals[varName];
    }
  }

  clearAll(): void {
    Object.values(this.pollingIntervals).forEach(clearInterval);
    this.pollingIntervals = {};
  }
}

class WebviewManager {
  private context: vscode.ExtensionContext;
  private pointerColorMap: { [name: string]: string } = {};

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  createPanel(): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
      'arrayVisualizer',
      'Array',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
      }
    );
    panel.webview.html = this.generateHtml(panel.webview);
    return panel;
  }

  private generateHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.css')
    );
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; script-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Array Visualizer</title>
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }

  sendInitialMessage(panel: vscode.WebviewPanel): void {
    panel.webview.postMessage({
      type: 'update',
      props: {
        arrayName: '',
        arrayValue: [],
        pointers: [],
        pointerColorMap: {},
        is2D: false,
        visualizationMode: 'arrow',
      },
    });
  }

  sendUpdateMessage(
    panel: vscode.WebviewPanel,
    arrayName: string,
    arrayValue: (number | string)[] | (number | string)[][],
    pointers: PointerData[],
    is2D: boolean
  ): void {
    // Clean up colors for deleted pointers
    const currentPointerNames = new Set(pointers.map((p) => p.name));
    Object.keys(this.pointerColorMap).forEach((name) => {
      if (!currentPointerNames.has(name)) {
        delete this.pointerColorMap[name];
      }
    });

    // Assign colors to new pointers only
    pointers.forEach((pointer) => {
      if (!this.pointerColorMap[pointer.name]) {
        // Generate a random color for new pointers only
        const randomIndex = Math.floor(Math.random() * POINTER_COLORS.length);
        this.pointerColorMap[pointer.name] = POINTER_COLORS[randomIndex];
      }
    });

    panel.webview.postMessage({
      type: 'update',
      props: {
        arrayName,
        arrayValue,
        pointers,
        pointerColorMap: this.pointerColorMap,
        is2D,
        visualizationMode: 'arrow',
      },
    });
  }
}

class MessageHandlers {
  constructor(
    private stateManager: StateManager,
    private debugService: DebugService,
    private pollingService: PollingService,
    private webviewManager: WebviewManager
  ) {}

  async handleAddPointer(
    msg: ExtensionMessage & { type: 'addPointer' },
    panel: vscode.WebviewPanel
  ): Promise<void> {
    if (this.stateManager.isProcessing()) {
      return;
    }

    this.stateManager.setProcessing(true);
    const name = msg.name.trim();
    const pointerType = msg.pointerType || 'index';

    try {
      const currentArrayName = this.stateManager.getCurrentArrayName();
      if (!name || !currentArrayName) {
        return;
      }

      const session = vscode.debug.activeDebugSession;
      if (!session) {
        vscode.window.showErrorMessage('No active debug session');
        return;
      }

      // Validate expression before adding
      const validation = await this.debugService.validateExpression(session, name);
      if (!validation.isValid) {
        vscode.window.showErrorMessage(`Invalid pointer expression "${name}": ${validation.error}`);
        return;
      }

      if (!this.stateManager.hasBlock(currentArrayName)) {
        this.stateManager.setBlock(currentArrayName, {
          is2D: false,
          pointers: [],
        });
      }
      const block = this.stateManager.getBlock(currentArrayName)!;

      const existingPointer = block.pointers.find((p) => p.name === name);
      if (existingPointer) {
        return;
      }

      block.pointers.push({ name, type: pointerType });

      await this.updateWebview(session, currentArrayName, panel, block);
      this.pollingService.startPolling(session, currentArrayName, panel, () =>
        this.updateWebview(session, currentArrayName, panel, block)
      );
    } finally {
      this.stateManager.setProcessing(false);
    }
  }

  async handleDeletePointer(
    msg: ExtensionMessage & { type: 'deletePointer' },
    panel: vscode.WebviewPanel
  ): Promise<void> {
    if (this.stateManager.isProcessing()) {
      return;
    }

    this.stateManager.setProcessing(true);
    const name = msg.name.trim();

    try {
      const currentArrayName = this.stateManager.getCurrentArrayName();
      const block = this.stateManager.getBlock(currentArrayName);
      if (!name || !currentArrayName || !block) {
        return;
      }

      const originalLength = block.pointers.length;
      block.pointers = block.pointers.filter((p) => p.name !== name);
      const deletedCount = originalLength - block.pointers.length;

      if (deletedCount > 0) {
        const session = vscode.debug.activeDebugSession;
        if (session) {
          await this.updateWebview(session, currentArrayName, panel, block);
        }
      }
    } finally {
      this.stateManager.setProcessing(false);
    }
  }

  async handleValidateExpression(
    msg: ExtensionMessage & { type: 'validateExpression' },
    panel: vscode.WebviewPanel
  ): Promise<void> {
    const session = vscode.debug.activeDebugSession;
    if (!session) {
      panel.webview.postMessage({
        type: 'validationResult',
        expression: msg.expression,
        isValid: false,
        error: 'No active debug session',
      });
      return;
    }

    const validation = await this.debugService.validateExpression(session, msg.expression);
    panel.webview.postMessage({
      type: 'validationResult',
      expression: msg.expression,
      isValid: validation.isValid,
      error: validation.error,
    });
  }

  async handleSetArrayName(
    msg: ExtensionMessage & { type: 'setArrayName' },
    panel: vscode.WebviewPanel
  ): Promise<void> {
    const newArrayName = msg.arrayName.trim();
    const is2D = msg.is2D || false;
    if (!newArrayName) {
      return;
    }

    const session = vscode.debug.activeDebugSession;
    if (!session) {
      return;
    }

    try {
      const { scopes } = await this.debugService.getDebugContext(session);
      const variable = await this.debugService.resolveVariable(
        session,
        scopes,
        newArrayName
          .split('.')
          .map((s: string) => s.trim())
          .filter(Boolean)
      );

      if (variable && variable.variablesReference) {
        this.stateManager.setCurrentArrayName(newArrayName);
        this.stateManager.clearArrayError(newArrayName);
        this.stateManager.clearPointerErrorsForArray(newArrayName);

        if (!this.stateManager.hasBlock(newArrayName)) {
          this.stateManager.setBlock(newArrayName, { is2D, pointers: [] });
        }

        const block = this.stateManager.getBlock(newArrayName);
        if (block) {
          block.is2D = is2D;
        }
        await this.updateWebview(session, newArrayName, panel, block);
        this.pollingService.startPolling(session, newArrayName, panel, () =>
          this.updateWebview(session, newArrayName, panel, block)
        );
      } else {
        vscode.window.showErrorMessage(
          `Array variable "${newArrayName}" not found or not an array.`
        );
      }
    } catch {
      vscode.window.showErrorMessage(`Failed to check variable "${newArrayName}".`);
    }
  }

  private async updateWebview(
    session: vscode.DebugSession,
    arrayName: string,
    panel: vscode.WebviewPanel,
    arrayBlock?: ArrayBlock
  ): Promise<void> {
    const is2D = arrayBlock?.is2D || false;
    const pointerInfos = arrayBlock?.pointers || [];

    const arrayValue = await this.debugService.getArrayValue(session, arrayName, is2D);
    if (!arrayValue) {
      if (this.stateManager.shouldShowArrayError(arrayName)) {
        vscode.window.showErrorMessage(`Array variable "${arrayName}" not found or not an array.`);
        this.stateManager.markArrayErrorShown(arrayName);
      }
      return;
    }

    const pointers = await this.debugService.getPointerValues(session, pointerInfos);

    // Handle pointer errors
    for (const pointerInfo of pointerInfos) {
      const found = pointers.some((p) => p.name === pointerInfo.name);
      if (!found) {
        const pointerKey = `${arrayName}:${pointerInfo.name}`;
        if (this.stateManager.shouldShowPointerError(pointerKey)) {
          vscode.window.showErrorMessage(`Pointer variable "${pointerInfo.name}" not found.`);
          this.stateManager.markPointerErrorShown(pointerKey);
        }
      }
    }

    this.webviewManager.sendUpdateMessage(panel, arrayName, arrayValue, pointers, is2D);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const stateManager = new StateManager();
  const debugService = new DebugService();
  const pollingService = new PollingService();
  const webviewManager = new WebviewManager(context);
  const messageHandlers = new MessageHandlers(
    stateManager,
    debugService,
    pollingService,
    webviewManager
  );

  let panel: vscode.WebviewPanel | undefined;
  let messageHandlerDisposable: vscode.Disposable | undefined;

  function registerMessageHandler(targetPanel: vscode.WebviewPanel): void {
    if (messageHandlerDisposable) {
      messageHandlerDisposable.dispose();
      messageHandlerDisposable = undefined;
    }

    messageHandlerDisposable = targetPanel.webview.onDidReceiveMessage(async (msg) => {
      if (msg && msg.type === 'addPointer' && typeof msg.name === 'string') {
        await messageHandlers.handleAddPointer(msg, targetPanel);
      }
      if (msg && msg.type === 'deletePointer' && typeof msg.name === 'string') {
        await messageHandlers.handleDeletePointer(msg, targetPanel);
      }
      if (msg && msg.type === 'setArrayName' && typeof msg.arrayName === 'string') {
        await messageHandlers.handleSetArrayName(msg, targetPanel);
      }
      if (msg && msg.type === 'validateExpression' && typeof msg.expression === 'string') {
        await messageHandlers.handleValidateExpression(msg, targetPanel);
      }
    });
  }

  function cleanupState(): void {
    panel = undefined;
    stateManager.clear();
    pollingService.clearAll();
    if (messageHandlerDisposable) {
      messageHandlerDisposable.dispose();
      messageHandlerDisposable = undefined;
    }
  }

  const openPanelDisposable = vscode.commands.registerCommand(
    'array-index-visual-debugger.openPanel',
    async () => {
      const session = vscode.debug.activeDebugSession;
      if (!session) {
        vscode.window.showErrorMessage('No active debug session!');
        return;
      }

      // 既存のパネルがある場合は再利用
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (panel && !(panel as any).isDisposed) {
        panel.reveal(vscode.ViewColumn.Beside);
        return;
      }

      panel = webviewManager.createPanel();

      panel.onDidDispose(
        () => {
          cleanupState();
        },
        null,
        context.subscriptions
      );

      registerMessageHandler(panel);
      webviewManager.sendInitialMessage(panel);
    }
  );

  vscode.debug.onDidTerminateDebugSession(() => {
    panel?.dispose();
    cleanupState();
  });

  context.subscriptions.push(openPanelDisposable);
}

export function deactivate() {}
