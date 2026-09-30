package net.toekit.blockbanner;

import com.intellij.openapi.command.WriteCommandAction;
import com.intellij.openapi.editor.Document;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.SelectionModel;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.util.TextRange;

import java.util.List;

/** 배너가 들어갈 자리. 선택이 있으면 그 줄들을 통째로 바꾸고, 없으면 커서 줄 위에 넣는다. */
final class EditorTarget {

    private final Editor editor;
    private final int startLine;
    private final int endLine;
    private final String selectedText;

    private EditorTarget(Editor editor, int startLine, int endLine, String selectedText) {
        this.editor = editor;
        this.startLine = startLine;
        this.endLine = endLine;
        this.selectedText = selectedText;
    }

    static EditorTarget of(Editor editor, CommentFormat format) {
        Document document = editor.getDocument();
        SelectionModel selection = editor.getSelectionModel();
        if (!selection.hasSelection()) {
            int line = document.getLineNumber(editor.getCaretModel().getOffset());
            return new EditorTarget(editor, line, line, "");
        }
        int startLine = document.getLineNumber(selection.getSelectionStart());
        int endLine = document.getLineNumber(selection.getSelectionEnd());
        // 줄 끝까지 드래그하면 선택 끝이 다음 줄 첫 칸에 걸린다
        if (endLine > startLine && selection.getSelectionEnd() == document.getLineStartOffset(endLine)) {
            endLine--;
        }
        String text = stripCommentPrefix(selection.getSelectedText(), format.linePrefix());
        return new EditorTarget(editor, startLine, endLine, text);
    }

    boolean hasSelection() {
        return !selectedText.isBlank();
    }

    String selectedText() {
        return selectedText;
    }

    String indent() {
        Document document = editor.getDocument();
        String line = document.getText(new TextRange(
                document.getLineStartOffset(startLine), document.getLineEndOffset(startLine)));
        int i = 0;
        while (i < line.length() && (line.charAt(i) == ' ' || line.charAt(i) == '\t')) {
            i++;
        }
        return line.substring(0, i);
    }

    void write(Project project, List<String> lines) {
        Document document = editor.getDocument();
        int start = document.getLineStartOffset(startLine);
        int end = hasSelection() ? document.getLineEndOffset(endLine) : start;
        String block = String.join("\n", lines) + (hasSelection() ? "" : "\n");
        WriteCommandAction.runWriteCommandAction(project, "Insert Block Banner", null, () -> {
            document.replaceString(start, end, block);
            editor.getSelectionModel().removeSelection();
        });
    }

    /** 선택한 줄이 이미 주석이면 주석 기호는 글자에서 뺀다. */
    static String stripCommentPrefix(String text, String linePrefix) {
        String marker = linePrefix.strip();
        StringBuilder sb = new StringBuilder();
        for (String line : text.split("\n", -1)) {
            String s = line.strip();
            if (!marker.isEmpty() && s.startsWith(marker)) {
                s = s.substring(marker.length()).strip();
            }
            if (sb.length() > 0) {
                sb.append('\n');
            }
            sb.append(s);
        }
        return sb.toString();
    }
}
