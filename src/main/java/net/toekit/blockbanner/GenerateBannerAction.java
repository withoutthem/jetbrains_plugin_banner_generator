package net.toekit.blockbanner;

import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.project.Project;

/** Code → Generate, 에디터 우클릭. 항상 다이얼로그를 연다. */
public class GenerateBannerAction extends BannerAction {

    @Override
    protected void perform(Project project, Editor editor, CommentFormat format) {
        openDialog(project, editor, format);
    }
}
