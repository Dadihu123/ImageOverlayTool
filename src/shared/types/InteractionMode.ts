export type InteractionMode =
    | "default"
    | "dimension_add"
    | "dimension_select"
    | "guide_rect_draw"
    | "guide_rect_select"
    | "guide_line_select";

export const isDimensionInteractionMode = (mode: InteractionMode): boolean =>
    mode === "dimension_add" || mode === "dimension_select";

export const isGuideRectInteractionMode = (mode: InteractionMode): boolean =>
    mode === "guide_rect_draw" || mode === "guide_rect_select";

export const isGuideLineInteractionMode = (mode: InteractionMode): boolean =>
    mode === "guide_line_select";

export const isGuideInteractionMode = (mode: InteractionMode): boolean =>
    isGuideRectInteractionMode(mode) || isGuideLineInteractionMode(mode);

/** 既定以外のツールモードかどうか（ポインタ挙動の切り替えに使う） */
export const isToolInteractionMode = (mode: InteractionMode): boolean =>
    isDimensionInteractionMode(mode) || isGuideInteractionMode(mode);
