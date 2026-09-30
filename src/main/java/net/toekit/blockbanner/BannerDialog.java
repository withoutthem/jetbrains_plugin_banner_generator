package net.toekit.blockbanner;

import com.intellij.openapi.editor.colors.EditorColorsManager;
import com.intellij.openapi.editor.colors.EditorFontType;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.ui.ComboBox;
import com.intellij.openapi.ui.DialogWrapper;
import com.intellij.openapi.ui.ValidationInfo;
import com.intellij.ui.DocumentAdapter;
import com.intellij.ui.JBIntSpinner;
import com.intellij.ui.components.JBScrollPane;
import com.intellij.ui.components.JBTextArea;
import com.intellij.ui.components.JBTextField;
import com.intellij.util.ui.FormBuilder;
import com.intellij.util.ui.JBUI;
import org.jetbrains.annotations.Nullable;

import javax.swing.JComponent;
import javax.swing.JTextArea;
import javax.swing.event.DocumentEvent;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GraphicsEnvironment;
import java.util.List;

public class BannerDialog extends DialogWrapper {

    private final CommentFormat format;

    private final JBTextArea textArea = new JBTextArea(2, 40);
    private final ComboBox<String> fontCombo = new ComboBox<>(fontFamilies());
    private final JBIntSpinner rowsSpinner = new JBIntSpinner(BannerSettings.DEFAULT.rows(), 2, 40);
    private final ComboBox<BannerStyle> styleCombo = new ComboBox<>(BannerStyle.values());
    private final JBIntSpinner depthSpinner = new JBIntSpinner(BannerSettings.DEFAULT.depth(), 1, 5);
    private final JBTextField prefixField = new JBTextField();
    private final JTextArea preview = new JTextArea();

    public BannerDialog(@Nullable Project project, CommentFormat format, String initialText) {
        super(project);
        this.format = format;
        setTitle("Block Banner");
        applySettings(BannerSettings.load());
        textArea.setText(initialText);
        prefixField.setText(format.linePrefix());
        setupPreview();
        listenForChanges();
        init();
    }

    public BannerSettings settings() {
        return new BannerSettings(
                (String) fontCombo.getSelectedItem(), rowsSpinner.getNumber(),
                (BannerStyle) styleCombo.getSelectedItem(), depthSpinner.getNumber());
    }

    public List<String> linesToInsert(String indent) {
        List<String> art = BannerRenderer.renderMultiline(textArea.getText(), settings());
        return format.wrap(art, prefixField.getText(), indent);
    }

    @Override
    protected @Nullable JComponent createCenterPanel() {
        textArea.setLineWrap(true);
        JBScrollPane previewPane = new JBScrollPane(preview);
        previewPane.setPreferredSize(new Dimension(JBUI.scale(760), JBUI.scale(260)));

        return FormBuilder.createFormBuilder()
                .addLabeledComponent("Text:", new JBScrollPane(textArea))
                .addLabeledComponent("Font:", fontCombo)
                .addLabeledComponent("Rows:", rowsSpinner)
                .addLabeledComponent("Style:", styleCombo)
                .addLabeledComponent("3D depth:", depthSpinner)
                .addLabeledComponent("Comment prefix:", prefixField)
                .addSeparator()
                .addComponentFillVertically(previewPane, 0)
                .getPanel();
    }

    @Override
    public @Nullable JComponent getPreferredFocusedComponent() {
        return textArea;
    }

    @Override
    protected @Nullable ValidationInfo doValidate() {
        if (textArea.getText().isBlank()) {
            return new ValidationInfo("Enter the text to draw", textArea);
        }
        return null;
    }

    @Override
    protected void doOKAction() {
        settings().save();
        super.doOKAction();
    }

    private void applySettings(BannerSettings s) {
        fontCombo.setSelectedItem(s.fontFamily());
        rowsSpinner.setNumber(s.rows());
        styleCombo.setSelectedItem(s.style());
        depthSpinner.setNumber(s.depth());
    }

    private void setupPreview() {
        preview.setEditable(false);
        preview.setFont(editorFont());
        preview.setLineWrap(false);
        updatePreview();
    }

    private void listenForChanges() {
        DocumentAdapter onTextChange = new DocumentAdapter() {
            @Override
            protected void textChanged(DocumentEvent e) {
                updatePreview();
            }
        };
        textArea.getDocument().addDocumentListener(onTextChange);
        prefixField.getDocument().addDocumentListener(onTextChange);
        fontCombo.addActionListener(e -> updatePreview());
        styleCombo.addActionListener(e -> {
            depthSpinner.setEnabled(styleCombo.getSelectedItem() == BannerStyle.THREE_D);
            updatePreview();
        });
        rowsSpinner.addChangeListener(e -> updatePreview());
        depthSpinner.addChangeListener(e -> updatePreview());
        depthSpinner.setEnabled(styleCombo.getSelectedItem() == BannerStyle.THREE_D);
    }

    private void updatePreview() {
        preview.setText(String.join("\n", linesToInsert("")));
        preview.setCaretPosition(0);
    }

    // 에디터 폰트로 그려야 삽입 결과와 같은 모양이 나온다
    private static Font editorFont() {
        return EditorColorsManager.getInstance().getGlobalScheme().getFont(EditorFontType.PLAIN);
    }

    private static String[] fontFamilies() {
        String[] installed = GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames();
        String[] all = new String[installed.length + 1];
        all[0] = BannerSettings.SYSTEM_FONT;
        System.arraycopy(installed, 0, all, 1, installed.length);
        return all;
    }
}
