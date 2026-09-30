import * as vscode from 'vscode';
import { detectCommentFormat, wrapComment } from './comments';
import { openDialog } from './dialog';
import { EditorTarget } from './editorTarget';
import { loadExtraFonts } from './fonts';
import { renderMultiline } from './renderer';
import { loadSettings } from './settings';

export function activate(context: vscode.ExtensionContext): void {
  loadExtraFonts();
  context.subscriptions.push(
    vscode.commands.registerCommand('blockBanner.quick', () => run(quick)),
    vscode.commands.registerCommand('blockBanner.dialog', () => run(dialog)),
  );
}

export function deactivate(): void {}

async function run(command: (editor: vscode.TextEditor) => Promise<void> | void): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  try {
    await command(editor);
  } catch (e) {
    void vscode.window.showErrorMessage(`Block Banner: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** 선택한 텍스트를 마지막 설정으로 바로 바꾼다. 선택이 없으면 다이얼로그. */
async function quick(editor: vscode.TextEditor): Promise<void> {
  const format = detectCommentFormat(editor.document.languageId);
  const target = EditorTarget.of(editor, format);
  if (!target.hasSelection) {
    openDialog(target, format);
    return;
  }
  const art = renderMultiline(target.selectedText, loadSettings());
  await target.write(wrapComment(art, format.linePrefix, target.indent(), format));
}

/** 우클릭 메뉴. 항상 다이얼로그를 연다. */
function dialog(editor: vscode.TextEditor): void {
  const format = detectCommentFormat(editor.document.languageId);
  openDialog(EditorTarget.of(editor, format), format);
}
