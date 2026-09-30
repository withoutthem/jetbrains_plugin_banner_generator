import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { CommentFormat, wrapComment } from './comments';
import { EditorTarget } from './editorTarget';
import { installedFamilies } from './fonts';
import { BannerSettings, renderMultiline } from './renderer';
import { loadSettings, saveSettings } from './settings';

interface FormState extends BannerSettings {
  text: string;
  prefix: string;
}

/** 옵션과 실시간 미리보기가 있는 웹뷰. OK 면 target 에 삽입하고 설정을 저장한다. */
export function openDialog(target: EditorTarget, format: CommentFormat): void {
  // 옆 칸에 띄워서 코드를 보면서 고를 수 있게 한다
  const panel = vscode.window.createWebviewPanel('blockBanner', 'Block Banner', vscode.ViewColumn.Beside, {
    enableScripts: true,
    retainContextWhenHidden: true,
    localResourceRoots: [],
  });

  const editorConfig = vscode.workspace.getConfiguration('editor');
  const initial: FormState = {
    ...loadSettings(),
    text: target.selectedText,
    prefix: format.linePrefix,
  };

  panel.webview.html = html(panel.webview, {
    initial,
    fonts: installedFamilies(),
    previewFont: editorConfig.get<string>('fontFamily', 'monospace'),
    previewSize: editorConfig.get<number>('fontSize', 14),
  });

  let disposed = false;
  let inserting = false;
  panel.onDidDispose(() => (disposed = true));

  panel.webview.onDidReceiveMessage(async (msg: { type: string; state: FormState }) => {
    try {
      if (msg.type === 'preview') {
        const lines = wrapComment(renderMultiline(msg.state.text, msg.state), msg.state.prefix, '', format);
        if (!disposed) {
          await panel.webview.postMessage({ type: 'preview', text: lines.join('\n') });
        }
      } else if (msg.type === 'insert') {
        if (inserting || !msg.state.text.trim()) {
          return;
        }
        inserting = true;
        const art = renderMultiline(msg.state.text, msg.state);
        panel.dispose();
        await target.write(wrapComment(art, msg.state.prefix, target.indent(), format));
        await saveSettings(msg.state);
      } else if (msg.type === 'cancel') {
        panel.dispose();
      }
    } catch (e) {
      inserting = false;
      void vscode.window.showErrorMessage(`Block Banner: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
}

interface HtmlInput {
  initial: FormState;
  fonts: string[];
  previewFont: string;
  previewSize: number;
}

function html(webview: vscode.Webview, input: HtmlInput): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const options = ['<option value="">(auto by script)</option>']
    .concat(input.fonts.map((f) => `<option value="${escape(f)}">${escape(f)}</option>`))
    .join('');
  const styles = ['shadow', '3d', 'shade'].map((s) => `<option value="${s}">${s}</option>`).join('');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Block Banner</title>
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px 16px; }
  .row { display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 8px; margin-bottom: 8px; }
  input, select, textarea {
    background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border, transparent); padding: 4px 6px; font-family: inherit; font-size: inherit;
  }
  textarea { resize: vertical; }
  pre {
    font-family: ${escape(input.previewFont)}, monospace; font-size: ${input.previewSize}px; line-height: 1.2;
    background: var(--vscode-editor-background); color: var(--vscode-editor-foreground);
    border: 1px solid var(--vscode-panel-border); padding: 8px; overflow: auto; min-height: 200px; margin: 12px 0;
  }
  button {
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
    border: none; padding: 6px 14px; margin-right: 8px; cursor: pointer;
  }
  button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
</style>
</head>
<body>
  <div class="row"><label for="text">Text</label><textarea id="text" rows="2"></textarea></div>
  <div class="row"><label for="font">Font</label><select id="font">${options}</select></div>
  <div class="row"><label for="rows">Rows</label><input id="rows" type="number" min="2" max="40"></div>
  <div class="row"><label for="style">Style</label><select id="style">${styles}</select></div>
  <div class="row"><label for="depth">3D depth</label><input id="depth" type="number" min="1" max="5"></div>
  <div class="row"><label for="prefix">Comment prefix</label><input id="prefix" type="text"></div>
  <pre id="preview"></pre>
  <button id="insert">Insert</button>
  <button id="cancel" class="secondary">Cancel</button>

<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const initial = ${JSON.stringify(input.initial).replace(/</g, '\\u003c')};
  const el = (id) => document.getElementById(id);

  el('text').value = initial.text;
  el('font').value = initial.font;
  el('rows').value = initial.rows;
  el('style').value = initial.style;
  el('depth').value = initial.depth;
  el('prefix').value = initial.prefix;

  function state() {
    return {
      text: el('text').value,
      font: el('font').value,
      rows: Number(el('rows').value) || 10,
      style: el('style').value,
      depth: Number(el('depth').value) || 2,
      prefix: el('prefix').value,
    };
  }
  function refresh() {
    el('depth').disabled = el('style').value !== '3d';
    vscode.postMessage({ type: 'preview', state: state() });
  }
  for (const id of ['text', 'font', 'rows', 'style', 'depth', 'prefix']) {
    el(id).addEventListener('input', refresh);
  }
  el('insert').addEventListener('click', () => vscode.postMessage({ type: 'insert', state: state() }));
  el('cancel').addEventListener('click', () => vscode.postMessage({ type: 'cancel', state: state() }));
  window.addEventListener('message', (e) => {
    if (e.data.type === 'preview') el('preview').textContent = e.data.text;
  });
  el('text').focus();
  refresh();
</script>
</body>
</html>`;
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
