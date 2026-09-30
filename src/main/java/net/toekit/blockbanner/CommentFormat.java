package net.toekit.blockbanner;

import com.intellij.lang.Commenter;
import com.intellij.lang.LanguageCommenters;
import com.intellij.psi.PsiFile;

import java.util.ArrayList;
import java.util.List;

/**
 * 파일 언어의 주석 기호. 줄 주석이 있으면 줄마다 붙이고, 블록 주석만 있는 언어(CSS, HTML)는 위아래를 감싼다.
 * blockOpen / blockClose 는 줄 주석이 있는 언어에서는 null.
 */
public record CommentFormat(String linePrefix, String blockOpen, String blockClose) {

    public static final CommentFormat NONE = new CommentFormat("", null, null);

    public static CommentFormat detect(PsiFile file) {
        if (file == null) {
            return NONE;
        }
        Commenter commenter = LanguageCommenters.INSTANCE.forLanguage(file.getLanguage());
        if (commenter == null) {
            return NONE;
        }
        if (commenter.getLineCommentPrefix() != null) {
            return new CommentFormat(commenter.getLineCommentPrefix() + " ", null, null);
        }
        if (commenter.getBlockCommentPrefix() != null) {
            return new CommentFormat("", commenter.getBlockCommentPrefix(), commenter.getBlockCommentSuffix());
        }
        return NONE;
    }

    public List<String> wrap(List<String> art, String prefix, String indent) {
        List<String> out = new ArrayList<>(art.size() + 2);
        if (blockOpen != null) {
            out.add(indent + blockOpen);
        }
        for (String line : art) {
            out.add((indent + prefix + line).stripTrailing());
        }
        if (blockClose != null) {
            out.add(indent + blockClose);
        }
        return out;
    }
}
