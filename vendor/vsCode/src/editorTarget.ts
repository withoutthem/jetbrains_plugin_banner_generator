import * as vscode from 'vscode';
import { CommentFormat, stripCommentPrefix } from './comments';

/**
 * 배너가 들어갈 자리. 선택이 있으면 그 줄들을 통째로 바꾸고, 없으면 커서 줄 위에 넣는다.
 * 다이얼로그가 떠 있는 동안 에디터가 가려질 수 있어서 에디터 객체 대신 문서 URI 로 편집한다.
 */
export class EditorTarget {
  private constructor(
    private readonly document: vscode.TextDocument,
    private readonly column: vscode.ViewColumn | undefined,
    private readonly startLine: number,
    private readonly endLine: number,
    readonly selectedText: string,
  ) {}

  static of(editor: vscode.TextEditor, format: CommentFormat): EditorTarget {
    const sel = editor.selection;
    if (sel.isEmpty) {
      return new EditorTarget(editor.document, editor.viewColumn, sel.active.line, sel.active.line, '');
    }
    let endLine = sel.end.line;
    // 줄 끝까지 드래그하면 선택 끝이 다음 줄 첫 칸에 걸린다
    if (endLine > sel.start.line && sel.end.character === 0) {
      endLine--;
    }
    const text = stripCommentPrefix(editor.document.getText(sel), format.linePrefix);
    return new EditorTarget(editor.document, editor.viewColumn, sel.start.line, endLine, text);
  }

  get hasSelection(): boolean {
    return this.selectedText.trim().length > 0;
  }

  indent(): string {
    const line = this.document.lineAt(this.clamp(this.startLine)).text;
    return line.slice(0, line.length - line.trimStart().length);
  }

  async write(lines: string[]): Promise<void> {
    const doc = this.document;
    const eol = doc.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
    const start = new vscode.Position(this.clamp(this.startLine), 0);
    const edit = new vscode.WorkspaceEdit();
    if (this.hasSelection) {
      const end = doc.lineAt(this.clamp(this.endLine)).range.end;
      edit.replace(doc.uri, new vscode.Range(start, end), lines.join(eol));
    } else {
      edit.insert(doc.uri, start, lines.join(eol) + eol);
    }
    if (!(await vscode.workspace.applyEdit(edit))) {
      throw new Error('The document could not be edited.');
    }
    const editor = await vscode.window.showTextDocument(doc, { viewColumn: this.column });
    editor.selection = new vscode.Selection(start, start);
    editor.revealRange(new vscode.Range(start, start));
  }

  // 다이얼로그가 떠 있는 동안 문서가 줄어들었을 수 있다
  private clamp(line: number): number {
    return Math.min(line, this.document.lineCount - 1);
  }
}
