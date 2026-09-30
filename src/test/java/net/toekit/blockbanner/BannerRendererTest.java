package net.toekit.blockbanner;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BannerRendererTest {

    @Test
    void shadowDrawsBoxOutlineOnRightAndBottom() {
        boolean[][] mask = {
                {true, true, false},
                {true, true, false},
                {false, false, false},
        };
        assertEquals(List.of("██╗", "██║", "╚═╝"), BannerRenderer.shadow(mask));
    }

    @Test
    void shadowDrawsInnerCornerWhereBlocksMeet() {
        boolean[][] mask = {
                {true, true, false},
                {true, false, false},
                {false, false, false},
        };
        assertEquals("█╔╝", BannerRenderer.shadow(mask).get(1));
    }

    @Test
    void threeDExtrudesTwoColumnsPerRow() {
        boolean[][] mask = {
                {true, false},
                {false, false},
        };
        List<String> lines = BannerRenderer.threeD(mask, 1);
        assertEquals("█", lines.get(0).stripTrailing());
        assertEquals(" ▒▒", lines.get(1).stripTrailing());
    }

    @Test
    void rendersKoreanWithSystemFont() {
        List<String> lines = BannerRenderer.render("가나", "Dialog", 10, BannerStyle.SHADOW, 2);
        assertTrue(lines.size() >= 8, "rows: " + lines.size());
        assertTrue(lines.stream().anyMatch(l -> l.contains("█")));
        assertFalse(lines.get(lines.size() - 1).isEmpty());
    }

    @Test
    void blankTextRendersNothing() {
        assertTrue(BannerRenderer.render("   ", "Dialog", 10, BannerStyle.SHADOW, 2).isEmpty());
    }

    @Test
    void multilineStacksBannersWithBlankSeparator() {
        List<String> lines = BannerRenderer.renderMultiline("가\n\n나", BannerSettings.DEFAULT);
        int separator = lines.indexOf("");
        assertTrue(separator > 0 && separator < lines.size() - 1);
        assertEquals(1, lines.stream().filter(String::isEmpty).count());
    }

    @Test
    void stripsCommentMarkerFromSelectedLines() {
        assertEquals("결제\n서비스", EditorTarget.stripCommentPrefix("  // 결제\n//서비스", "// "));
        assertEquals("plain", EditorTarget.stripCommentPrefix("plain", ""));
    }
}
