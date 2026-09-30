package net.toekit.blockbanner;

import com.intellij.ide.util.PropertiesComponent;

/** 폰트, 행수, 스타일, 압출 두께. 마지막 값을 IDE 전역에 저장한다. */
public record BannerSettings(String fontFamily, int rows, BannerStyle style, int depth) {

    /** 논리 폰트. OS 기본 CJK 폰트로 폴백되므로 어떤 문자든 그려진다. */
    public static final String SYSTEM_FONT = "Dialog";

    public static final BannerSettings DEFAULT = new BannerSettings(SYSTEM_FONT, 10, BannerStyle.SHADOW, 2);

    private static final String KEY_FONT = "blockbanner.font";
    private static final String KEY_ROWS = "blockbanner.rows";
    private static final String KEY_STYLE = "blockbanner.style";
    private static final String KEY_DEPTH = "blockbanner.depth";

    public static BannerSettings load() {
        PropertiesComponent props = PropertiesComponent.getInstance();
        BannerStyle style;
        try {
            style = BannerStyle.valueOf(props.getValue(KEY_STYLE, DEFAULT.style().name()));
        } catch (IllegalArgumentException e) {
            style = DEFAULT.style();
        }
        return new BannerSettings(
                props.getValue(KEY_FONT, DEFAULT.fontFamily()),
                props.getInt(KEY_ROWS, DEFAULT.rows()),
                style,
                props.getInt(KEY_DEPTH, DEFAULT.depth()));
    }

    public void save() {
        PropertiesComponent props = PropertiesComponent.getInstance();
        props.setValue(KEY_FONT, fontFamily);
        props.setValue(KEY_ROWS, rows, DEFAULT.rows());
        props.setValue(KEY_STYLE, style.name());
        props.setValue(KEY_DEPTH, depth, DEFAULT.depth());
    }
}
