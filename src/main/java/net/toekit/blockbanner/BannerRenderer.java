package net.toekit.blockbanner;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.font.FontRenderContext;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.awt.image.Raster;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 텍스트를 폰트로 크게 그린 뒤 셀 단위로 축소하고, 셀 밝기를 문자로 바꾼다.
 * Java2D 만 쓰고 IntelliJ 에 의존하지 않는다.
 */
public final class BannerRenderer {

    static final int SUPERSAMPLE = 8;       // 출력 1행당 원본 px
    static final double CELL_ASPECT = 2.0;  // 에디터 글자 셀의 세로/가로 비
    static final int MASK_THRESHOLD = 96;   // 이 밝기 이상이면 채워진 셀로 본다
    static final String SHADE_RAMP = " .:-=+*#%@";

    private BannerRenderer() {
    }

    public static List<String> render(String text, String fontFamily, int rows, BannerStyle style, int depth) {
        if (text == null || text.isBlank() || rows < 2) {
            return List.of();
        }
        int[][] cells = rasterize(text, fontFamily, rows);
        if (cells.length == 0) {
            return List.of();
        }
        List<String> lines = switch (style) {
            case SHADE -> shade(cells);
            case THREE_D -> threeD(toMask(cells), depth);
            case SHADOW -> shadow(toMask(cells));
        };
        return trim(lines);
    }

    /** 줄마다 배너를 만들고 사이에 빈 줄을 하나 둔다. */
    public static List<String> renderMultiline(String text, BannerSettings settings) {
        List<String> out = new ArrayList<>();
        for (String line : text.split("\n")) {
            if (line.isBlank()) {
                continue;
            }
            if (!out.isEmpty()) {
                out.add("");
            }
            out.addAll(render(line.strip(), settings.fontFamily(), settings.rows(), settings.style(), settings.depth()));
        }
        return out;
    }

    static int[][] rasterize(String text, String fontFamily, int rows) {
        Font font = new Font(fontFamily, Font.BOLD, rows * SUPERSAMPLE);
        BufferedImage big = crop(drawText(text, font));
        if (big == null) {
            return new int[0][0];
        }
        int cols = (int) Math.round((double) big.getWidth() / big.getHeight() * rows * CELL_ASPECT);
        return downsample(big, Math.max(cols, 1), rows);
    }

    private static BufferedImage drawText(String text, Font font) {
        FontRenderContext frc = new FontRenderContext(null, true, true);
        Rectangle2D bounds = font.getStringBounds(text, frc);
        // 논리 폰트(Dialog)의 CJK 폴백 글리프가 논리 경계를 넘을 수 있어 여유를 둔다
        int pad = font.getSize();
        int width = (int) Math.ceil(bounds.getWidth()) + pad * 2;
        int height = (int) Math.ceil(bounds.getHeight()) + pad * 2;

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = image.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
        g.setFont(font);
        g.setColor(Color.WHITE);
        g.drawString(text, pad, pad + (float) -bounds.getY());
        g.dispose();
        return image;
    }

    private static BufferedImage crop(BufferedImage image) {
        Raster raster = image.getRaster();
        int minX = image.getWidth(), minY = image.getHeight(), maxX = -1, maxY = -1;
        for (int y = 0; y < image.getHeight(); y++) {
            for (int x = 0; x < image.getWidth(); x++) {
                if (raster.getSample(x, y, 0) > 0) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        if (maxX < 0) {
            return null;
        }
        return image.getSubimage(minX, minY, maxX - minX + 1, maxY - minY + 1);
    }

    private static int[][] downsample(BufferedImage image, int cols, int rows) {
        Raster raster = image.getRaster();
        int width = image.getWidth(), height = image.getHeight();
        int[][] cells = new int[rows][cols];
        for (int y = 0; y < rows; y++) {
            int y0 = y * height / rows;
            int y1 = Math.max(y0 + 1, (y + 1) * height / rows);
            for (int x = 0; x < cols; x++) {
                int x0 = x * width / cols;
                int x1 = Math.max(x0 + 1, (x + 1) * width / cols);
                long sum = 0;
                for (int yy = y0; yy < y1; yy++) {
                    for (int xx = x0; xx < x1; xx++) {
                        sum += raster.getSample(xx, yy, 0);
                    }
                }
                cells[y][x] = (int) (sum / ((long) (y1 - y0) * (x1 - x0)));
            }
        }
        return cells;
    }

    /** 오른쪽·아래로 한 칸 넓게 잡는다. 그림자와 압출이 그 자리에 들어간다. */
    static boolean[][] toMask(int[][] cells) {
        int rows = cells.length, cols = cells[0].length;
        boolean[][] mask = new boolean[rows + 1][cols + 1];
        for (int y = 0; y < rows; y++) {
            for (int x = 0; x < cols; x++) {
                mask[y][x] = cells[y][x] >= MASK_THRESHOLD;
            }
        }
        return mask;
    }

    static List<String> shade(int[][] cells) {
        int last = SHADE_RAMP.length() - 1;
        List<String> lines = new ArrayList<>(cells.length);
        for (int[] row : cells) {
            StringBuilder sb = new StringBuilder(row.length);
            for (int value : row) {
                sb.append(SHADE_RAMP.charAt((int) Math.round(value / 255.0 * last)));
            }
            lines.add(sb.toString());
        }
        return lines;
    }

    static List<String> shadow(boolean[][] mask) {
        List<String> lines = new ArrayList<>(mask.length);
        for (int y = 0; y < mask.length; y++) {
            StringBuilder sb = new StringBuilder(mask[y].length);
            for (int x = 0; x < mask[y].length; x++) {
                sb.append(mask[y][x] ? '█' : shadowChar(mask, x, y));
            }
            lines.add(sb.toString());
        }
        return lines;
    }

    // 빈 셀의 왼쪽(L), 위(U), 왼쪽 위(UL) 가 채워졌는지로 그림자 문자를 정한다.
    private static char shadowChar(boolean[][] mask, int x, int y) {
        boolean left = filled(mask, x - 1, y);
        boolean up = filled(mask, x, y - 1);
        boolean upLeft = filled(mask, x - 1, y - 1);
        if (left && up) {
            return '╔';
        }
        if (left) {
            return upLeft ? '║' : '╗';
        }
        if (up) {
            return upLeft ? '═' : '╚';
        }
        return upLeft ? '╝' : ' ';
    }

    private static boolean filled(boolean[][] mask, int x, int y) {
        return x >= 0 && y >= 0 && mask[y][x];
    }

    // 한 단계당 아래 1행, 오른쪽 2열. 셀이 세로로 길어서 이게 45도로 보인다.
    static List<String> threeD(boolean[][] mask, int depth) {
        int rows = mask.length, cols = mask[0].length;
        char[][] grid = new char[rows + depth][cols + 2 * depth];
        for (char[] row : grid) {
            Arrays.fill(row, ' ');
        }
        for (int y = 0; y < rows; y++) {
            for (int x = 0; x < cols; x++) {
                if (!mask[y][x]) {
                    continue;
                }
                for (int i = 1; i <= depth; i++) {
                    grid[y + i][x + 2 * i - 1] = '▒';
                    grid[y + i][x + 2 * i] = '▒';
                }
            }
        }
        for (int y = 0; y < rows; y++) {
            for (int x = 0; x < cols; x++) {
                if (mask[y][x]) {
                    grid[y][x] = '█';
                }
            }
        }
        List<String> lines = new ArrayList<>(grid.length);
        for (char[] row : grid) {
            lines.add(new String(row));
        }
        return lines;
    }

    private static List<String> trim(List<String> lines) {
        List<String> out = new ArrayList<>(lines.size());
        for (String line : lines) {
            out.add(line.stripTrailing());
        }
        while (!out.isEmpty() && out.get(out.size() - 1).isEmpty()) {
            out.remove(out.size() - 1);
        }
        return out;
    }
}
