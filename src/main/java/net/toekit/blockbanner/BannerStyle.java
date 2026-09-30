package net.toekit.blockbanner;

public enum BannerStyle {
    SHADOW("Shadow  (█ + ╗║╝═)"),
    THREE_D("3D  (█ + ▒ extrude)"),
    SHADE("Shade  (.:-=+*#%@)");

    private final String label;

    BannerStyle(String label) {
        this.label = label;
    }

    @Override
    public String toString() {
        return label;
    }
}
