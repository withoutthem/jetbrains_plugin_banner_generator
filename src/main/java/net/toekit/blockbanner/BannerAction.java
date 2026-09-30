package net.toekit.blockbanner;

import com.intellij.openapi.actionSystem.ActionUpdateThread;
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.actionSystem.CommonDataKeys;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.project.Project;
import org.jetbrains.annotations.NotNull;

abstract class BannerAction extends AnAction {

    @Override
    public @NotNull ActionUpdateThread getActionUpdateThread() {
        return ActionUpdateThread.BGT;
    }

    @Override
    public void update(@NotNull AnActionEvent e) {
        Editor editor = e.getData(CommonDataKeys.EDITOR);
        boolean writable = editor != null && editor.getDocument().isWritable();
        e.getPresentation().setEnabledAndVisible(e.getProject() != null && writable);
    }

    @Override
    public void actionPerformed(@NotNull AnActionEvent e) {
        Project project = e.getProject();
        Editor editor = e.getData(CommonDataKeys.EDITOR);
        if (project == null || editor == null) {
            return;
        }
        perform(project, editor, CommentFormat.detect(e.getData(CommonDataKeys.PSI_FILE)));
    }

    protected abstract void perform(Project project, Editor editor, CommentFormat format);

    static void openDialog(Project project, Editor editor, CommentFormat format) {
        EditorTarget target = EditorTarget.of(editor, format);
        BannerDialog dialog = new BannerDialog(project, format, target.selectedText());
        if (dialog.showAndGet()) {
            target.write(project, dialog.linesToInsert(target.indent()));
        }
    }
}
