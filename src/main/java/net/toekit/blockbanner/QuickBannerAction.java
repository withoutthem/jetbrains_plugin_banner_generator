package net.toekit.blockbanner;

import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.project.Project;

import java.util.List;

/** Alt+Shift+B. 선택한 텍스트를 마지막 설정으로 바로 바꾼다. 선택이 없으면 다이얼로그. */
public class QuickBannerAction extends BannerAction {

    @Override
    protected void perform(Project project, Editor editor, CommentFormat format) {
        EditorTarget target = EditorTarget.of(editor, format);
        if (!target.hasSelection()) {
            openDialog(project, editor, format);
            return;
        }
        List<String> art = BannerRenderer.renderMultiline(target.selectedText(), BannerSettings.load());
        target.write(project, format.wrap(art, format.linePrefix(), target.indent()));
    }
}
