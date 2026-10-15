import type {
    DimensionConstraint,
    DimensionGuideConfig,
    GridConfig,
    GridSnapConfig,
    GuideConfig,
    GuideLayerPlacement,
    GuideLinesConfig,
    GuideRect,
    GuideRectShape,
} from "../types/Guide";

// === グリッド ===

export const GUIDE_GRID_SPACING_DEFAULT = 50;
export const GUIDE_GRID_SPACING_MIN = 0.01;
export const GUIDE_GRID_SPACING_MAX = 1000000;

export const GUIDE_GRID_SUBDIVISIONS_DEFAULT = 1;
export const GUIDE_GRID_SUBDIVISIONS_MIN = 1;
export const GUIDE_GRID_SUBDIVISIONS_MAX = 20;

export const GUIDE_GRID_COLOR_DEFAULT = "#64748b";
export const GUIDE_GRID_MINOR_COLOR_DEFAULT = "#94a3b8";
export const GUIDE_GRID_OPACITY_DEFAULT = 0.5;

export const GUIDE_LINE_WIDTH_DEFAULT = 1;
export const GUIDE_LINE_WIDTH_MIN = 0.1;
export const GUIDE_LINE_WIDTH_MAX = 20;

export const GUIDE_RECT_COLOR_DEFAULT = "#22c55e";
export const GUIDE_LINE_COLOR_DEFAULT = "#f59e0b";
export const GUIDE_LINE_OPACITY_DEFAULT = 0.8;

/** 吸着半径（画面 px）。実際のワールド半径は scale で割って求める */
export const GUIDE_SNAP_SCREEN_RADIUS = 8;

/** 細線を描画し続ける最小の画面間隔（px）。下回ると細線を隠す */
export const GUIDE_GRID_MIN_SCREEN_SPACING = 6;

/** グリッド自体を隠す最小の画面間隔（px） */
export const GUIDE_GRID_HIDE_SCREEN_SPACING = 2;

/** 描画時に視口外へ広げる倍率。移動中に未描画領域が出るのを防ぐ */
export const GUIDE_GRID_DRAW_MARGIN_FACTOR = 2;

/** enumerateGridLines が一度に生成する線の上限（防御用） */
export const GUIDE_GRID_MAX_LINES = 4000;

/** 参考枠の最小サイズ（ワールド px）。これ未満は破棄する */
export const GUIDE_RECT_MIN_SIZE = 1;

/** 参考枠の複製時にずらす量（ワールド px） */
export const GUIDE_RECT_DUPLICATE_OFFSET = 20;

const HEX_COLOR_PATTERN = /^#[\da-fA-F]{6}$/;
const HEX_COLOR_WITH_ALPHA_PATTERN = /^#[\da-fA-F]{8}$/;

const sanitizeHexColor = (value: unknown, fallback: string): string => {
    if (typeof value !== "string") {
        return fallback;
    }

    const trimmed = value.trim();
    if (HEX_COLOR_PATTERN.test(trimmed)) {
        return trimmed.toLowerCase();
    }

    if (HEX_COLOR_WITH_ALPHA_PATTERN.test(trimmed)) {
        return trimmed.slice(0, 7).toLowerCase();
    }

    return fallback;
};

export const sanitizeHexColorOrDefault = (
    value: unknown,
    fallback: string
): string => sanitizeHexColor(value, fallback);

const clampNumber = (
    value: unknown,
    fallback: number,
    min: number,
    max: number
): number => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, value));
};

const sanitizeBoolean = (value: unknown, fallback: boolean): boolean =>
    typeof value === "boolean" ? value : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeLayerPlacement = (
    value: unknown,
    fallback: GuideLayerPlacement
): GuideLayerPlacement => {
    if (
        value === "belowImages" ||
        value === "aboveImages" ||
        value === "screenLocked"
    ) {
        return value;
    }
    return fallback;
};

const sanitizeImageLayerPlacement = (
    value: unknown,
    fallback: Exclude<GuideLayerPlacement, "screenLocked">
): Exclude<GuideLayerPlacement, "screenLocked"> => {
    if (value === "belowImages" || value === "aboveImages") {
        return value;
    }
    return fallback;
};

const sanitizePoint = (
    value: unknown,
    fallback: { x: number; y: number }
): { x: number; y: number } => {
    if (!isRecord(value)) {
        return fallback;
    }
    return {
        x: Number.isFinite(value.x) ? (value.x as number) : fallback.x,
        y: Number.isFinite(value.y) ? (value.y as number) : fallback.y,
    };
};

const sanitizeNumberArray = (value: unknown): number[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter(
        (entry): entry is number =>
            typeof entry === "number" && Number.isFinite(entry)
    );
};

export const createDefaultGridSnapConfig = (): GridSnapConfig => ({
    gridIntersection: true,
    guideLines: true,
    guideRectEdges: true,
    dimensionEndpoints: false,
});

export const createDefaultGridConfig = (): GridConfig => ({
    enabled: false,
    spacingX: GUIDE_GRID_SPACING_DEFAULT,
    spacingY: GUIDE_GRID_SPACING_DEFAULT,
    subdivisions: GUIDE_GRID_SUBDIVISIONS_DEFAULT,
    origin: { x: 0, y: 0 },
    linkSpacing: true,
    color: GUIDE_GRID_COLOR_DEFAULT,
    minorColor: GUIDE_GRID_MINOR_COLOR_DEFAULT,
    opacity: GUIDE_GRID_OPACITY_DEFAULT,
    lineWidth: GUIDE_LINE_WIDTH_DEFAULT,
    layer: "belowImages",
    snap: createDefaultGridSnapConfig(),
});

export const createDefaultGuideLinesConfig = (): GuideLinesConfig => ({
    enabled: true,
    xs: [],
    ys: [],
    color: GUIDE_LINE_COLOR_DEFAULT,
    opacity: GUIDE_LINE_OPACITY_DEFAULT,
    lineWidth: GUIDE_LINE_WIDTH_DEFAULT,
    layer: "aboveImages",
});

export const createDefaultDimensionGuideConfig =
    (): DimensionGuideConfig => ({
        defaultConstraint: "free",
        showCellCount: true,
    });

export const createDefaultGuideConfig = (): GuideConfig => ({
    grid: createDefaultGridConfig(),
    lines: createDefaultGuideLinesConfig(),
    rects: [],
    dimension: createDefaultDimensionGuideConfig(),
    baselineRectId: null,
});

/**
 * 寸法線の拘束を検証する。
 * 未指定・不正値は undefined を返し、呼び出し側で既定値を決める
 * （保存時に不要なフィールドを書き出さないため）。
 */
export const sanitizeDimensionConstraint = (
    value: unknown
): DimensionConstraint | undefined => {
    if (value === "free" || value === "horizontal" || value === "vertical") {
        return value;
    }
    return undefined;
};

export const sanitizeDimensionGuideConfig = (
    value: unknown
): DimensionGuideConfig => {
    const defaults = createDefaultDimensionGuideConfig();
    if (!isRecord(value)) {
        return defaults;
    }
    return {
        defaultConstraint:
            sanitizeDimensionConstraint(value.defaultConstraint) ??
            defaults.defaultConstraint,
        showCellCount: sanitizeBoolean(
            value.showCellCount,
            defaults.showCellCount
        ),
    };
};

export const sanitizeGridSnapConfig = (value: unknown): GridSnapConfig => {
    const defaults = createDefaultGridSnapConfig();
    if (!isRecord(value)) {
        return defaults;
    }
    return {
        gridIntersection: sanitizeBoolean(
            value.gridIntersection,
            defaults.gridIntersection
        ),
        guideLines: sanitizeBoolean(value.guideLines, defaults.guideLines),
        guideRectEdges: sanitizeBoolean(
            value.guideRectEdges,
            defaults.guideRectEdges
        ),
        dimensionEndpoints: sanitizeBoolean(
            value.dimensionEndpoints,
            defaults.dimensionEndpoints
        ),
    };
};

export const sanitizeGridConfig = (value: unknown): GridConfig => {
    const defaults = createDefaultGridConfig();
    if (!isRecord(value)) {
        return defaults;
    }

    return {
        enabled: sanitizeBoolean(value.enabled, defaults.enabled),
        spacingX: clampNumber(
            value.spacingX,
            defaults.spacingX,
            GUIDE_GRID_SPACING_MIN,
            GUIDE_GRID_SPACING_MAX
        ),
        spacingY: clampNumber(
            value.spacingY,
            defaults.spacingY,
            GUIDE_GRID_SPACING_MIN,
            GUIDE_GRID_SPACING_MAX
        ),
        subdivisions: Math.round(
            clampNumber(
                value.subdivisions,
                defaults.subdivisions,
                GUIDE_GRID_SUBDIVISIONS_MIN,
                GUIDE_GRID_SUBDIVISIONS_MAX
            )
        ),
        origin: sanitizePoint(value.origin, defaults.origin),
        linkSpacing: sanitizeBoolean(value.linkSpacing, defaults.linkSpacing),
        color: sanitizeHexColor(value.color, defaults.color),
        minorColor: sanitizeHexColor(value.minorColor, defaults.minorColor),
        opacity: clampNumber(value.opacity, defaults.opacity, 0, 1),
        lineWidth: clampNumber(
            value.lineWidth,
            defaults.lineWidth,
            GUIDE_LINE_WIDTH_MIN,
            GUIDE_LINE_WIDTH_MAX
        ),
        layer: sanitizeLayerPlacement(value.layer, defaults.layer),
        snap: sanitizeGridSnapConfig(value.snap),
    };
};

export const sanitizeGuideLinesConfig = (value: unknown): GuideLinesConfig => {
    const defaults = createDefaultGuideLinesConfig();
    if (!isRecord(value)) {
        return defaults;
    }

    return {
        enabled: sanitizeBoolean(value.enabled, defaults.enabled),
        xs: sanitizeNumberArray(value.xs),
        ys: sanitizeNumberArray(value.ys),
        color: sanitizeHexColor(value.color, defaults.color),
        opacity: clampNumber(value.opacity, defaults.opacity, 0, 1),
        lineWidth: clampNumber(
            value.lineWidth,
            defaults.lineWidth,
            GUIDE_LINE_WIDTH_MIN,
            GUIDE_LINE_WIDTH_MAX
        ),
        layer: sanitizeImageLayerPlacement(value.layer, defaults.layer),
    };
};

const sanitizeGuideRectShape = (value: unknown): GuideRectShape | null => {
    if (!isRecord(value)) {
        return null;
    }

    if (value.kind === "linked") {
        if (typeof value.imageSetId !== "string" || !value.imageSetId) {
            return null;
        }
        const clamp01 = (input: unknown, fallback: number): number =>
            clampNumber(input, fallback, 0, 1);
        return {
            kind: "linked",
            imageSetId: value.imageSetId,
            u0: clamp01(value.u0, 0),
            v0: clamp01(value.v0, 0),
            u1: clamp01(value.u1, 1),
            v1: clamp01(value.v1, 1),
        };
    }

    if (value.kind === "world" || value.kind === undefined) {
        const x = Number.isFinite(value.x) ? (value.x as number) : null;
        const y = Number.isFinite(value.y) ? (value.y as number) : null;
        const width = Number.isFinite(value.width)
            ? (value.width as number)
            : null;
        const height = Number.isFinite(value.height)
            ? (value.height as number)
            : null;
        if (x === null || y === null || width === null || height === null) {
            return null;
        }
        if (width < GUIDE_RECT_MIN_SIZE || height < GUIDE_RECT_MIN_SIZE) {
            return null;
        }
        return { kind: "world", x, y, width, height };
    }

    return null;
};

export const sanitizeGuideRect = (value: unknown): GuideRect | null => {
    if (!isRecord(value)) {
        return null;
    }
    if (typeof value.id !== "string" || value.id.length === 0) {
        return null;
    }

    const shape = sanitizeGuideRectShape(value.shape);
    if (!shape) {
        return null;
    }

    const rect: GuideRect = { id: value.id, shape };

    if (typeof value.label === "string" && value.label.trim().length > 0) {
        rect.label = value.label.trim();
    }
    if (typeof value.color === "string") {
        rect.color = sanitizeHexColor(value.color, GUIDE_RECT_COLOR_DEFAULT);
    }
    if (typeof value.showSizeLabel === "boolean") {
        rect.showSizeLabel = value.showSizeLabel;
    }
    if (typeof value.locked === "boolean") {
        rect.locked = value.locked;
    }

    return rect;
};

export const sanitizeGuideRects = (value: unknown): GuideRect[] => {
    if (!Array.isArray(value)) {
        return [];
    }
    const seen = new Set<string>();
    const rects: GuideRect[] = [];
    for (const entry of value) {
        const rect = sanitizeGuideRect(entry);
        if (!rect || seen.has(rect.id)) {
            continue;
        }
        seen.add(rect.id);
        rects.push(rect);
    }
    return rects;
};

/**
 * 参考物設定を寛容に正規化する。
 * 構造が壊れている項目は既定値へ落とし、例外は投げない
 * （表示補助機能のためにシーン読み込み全体を失敗させないため）。
 */
export const sanitizeGuideConfig = (value: unknown): GuideConfig => {
    const defaults = createDefaultGuideConfig();
    if (!isRecord(value)) {
        return defaults;
    }

    const rects = sanitizeGuideRects(value.rects);
    const baselineRectId =
        typeof value.baselineRectId === "string" &&
        rects.some((rect) => rect.id === value.baselineRectId)
            ? value.baselineRectId
            : null;

    return {
        grid: sanitizeGridConfig(value.grid),
        lines: sanitizeGuideLinesConfig(value.lines),
        rects,
        dimension: sanitizeDimensionGuideConfig(value.dimension),
        baselineRectId,
    };
};
