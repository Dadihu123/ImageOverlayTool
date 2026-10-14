import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { ImageSet } from "../../shared/types/ImageSet";
import { sanitizeUnitFactor } from "../../shared/constants/unitFactor";
import { sanitizeDimensionLineColor } from "../../shared/constants/dimensionLine";
import {
    sanitizeDimensionConstraint,
    sanitizeGuideConfig,
} from "../../shared/constants/guide";

const CURRENT_PROJECT_VERSION = "1.0.0";
const DEFAULT_WINDOW = {
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    color: "#00000000",
};

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
    typeof value === "object" && value !== null;

const toFiniteNumber = (value: unknown, fallback: number): number => {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback;
};

const toOptionalBoolean = (value: unknown): boolean | undefined => {
    return typeof value === "boolean" ? value : undefined;
};

const normalizePoint = (
    value: unknown,
    path: string
): { x: number; y: number } => {
    if (!isRecord(value)) {
        throw new Error(`Invalid project file: ${path} must be an object.`);
    }

    const x = value.x;
    const y = value.y;
    if (typeof x !== "number" || !Number.isFinite(x)) {
        throw new Error(`Invalid project file: ${path}.x must be a number.`);
    }
    if (typeof y !== "number" || !Number.isFinite(y)) {
        throw new Error(`Invalid project file: ${path}.y must be a number.`);
    }

    return { x, y };
};

const normalizeAnchorPos = (
    value: unknown,
    path: string
): ImageSet["initAnchorPos"] => {
    if (value === null || value === undefined) {
        return null;
    }
    if (!isRecord(value)) {
        throw new Error(`Invalid project file: ${path} must be an object.`);
    }

    return {
        lt: normalizePoint(value.lt, `${path}.lt`),
        lb: normalizePoint(value.lb, `${path}.lb`),
        rt: normalizePoint(value.rt, `${path}.rt`),
        rb: normalizePoint(value.rb, `${path}.rb`),
    };
};

const normalizeImageFilters = (value: unknown): ImageSet["filters"] => {
    if (!isRecord(value)) {
        return undefined;
    }

    const filters: NonNullable<ImageSet["filters"]> = {};
    const bin = value.binarization;
    if (isRecord(bin)) {
        filters.binarization = {
            enabled: Boolean(bin.enabled),
            threshold: toFiniteNumber(bin.threshold, 0),
        };
    }

    const hsv = value.hsv;
    if (isRecord(hsv)) {
        filters.hsv = {
            enabled: Boolean(hsv.enabled),
            h: toFiniteNumber(hsv.h, 0),
            s: toFiniteNumber(hsv.s, 0),
            v: toFiniteNumber(hsv.v, 0),
        };
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
};

const normalizeImage = (value: unknown, index: number): ImageSet => {
    const pathPrefix = `images[${index}]`;
    if (!isRecord(value)) {
        throw new Error(
            `Invalid project file: ${pathPrefix} must be an object.`
        );
    }

    const path = value.path;
    if (typeof path !== "string" || path.length === 0) {
        throw new Error(
            `Invalid project file: ${pathPrefix}.path is required.`
        );
    }

    const id =
        typeof value.id === "string" && value.id.length > 0
            ? value.id
            : `migrated-image-${index}`;

    const initAnchorRaw = value.initAnchorPos ?? value.init_anchor_pos ?? null;
    const currentAnchorRaw =
        value.currentAnchorPos ?? value.current_anchor_pos ?? null;

    return {
        id,
        path,
        sourceType: value.sourceType === "cache" ? "cache" : "file",
        transparency: Math.max(
            0,
            Math.min(100, toFiniteNumber(value.transparency, 0))
        ),
        rotation: toFiniteNumber(value.rotation, 0),
        initAnchorPos: normalizeAnchorPos(
            initAnchorRaw,
            `${pathPrefix}.initAnchorPos`
        ),
        currentAnchorPos: normalizeAnchorPos(
            currentAnchorRaw,
            `${pathPrefix}.currentAnchorPos`
        ),
        locked: toOptionalBoolean(value.locked),
        visible: toOptionalBoolean(value.visible),
        filters: normalizeImageFilters(value.filters),
    };
};

const normalizeWindow = (value: unknown): ProjectFile["window"] => {
    if (!isRecord(value)) {
        return DEFAULT_WINDOW;
    }

    return {
        width: toFiniteNumber(value.width, DEFAULT_WINDOW.width),
        height: toFiniteNumber(value.height, DEFAULT_WINDOW.height),
        x: toFiniteNumber(value.x, DEFAULT_WINDOW.x),
        y: toFiniteNumber(value.y, DEFAULT_WINDOW.y),
        color:
            typeof value.color === "string" && value.color.length > 0
                ? value.color
                : DEFAULT_WINDOW.color,
    };
};

const normalizeSettings = (value: unknown): ProjectFile["settings"] => {
    if (!isRecord(value)) {
        return { unitFactor: sanitizeUnitFactor(undefined), unit: "um" };
    }

    const unitRaw = value.unit;
    const unit =
        unitRaw === "nm" || unitRaw === "um" || unitRaw === "mm"
            ? unitRaw
            : "um";

    return {
        unitFactor: sanitizeUnitFactor(value.unitFactor),
        unit,
    };
};

const normalizeCanvas = (value: unknown): ProjectFile["canvas"] | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (!isRecord(value)) {
        throw new Error("Invalid project file: canvas must be an object.");
    }

    return {
        x: toFiniteNumber(value.x, 0),
        y: toFiniteNumber(value.y, 0),
        scale: toFiniteNumber(value.scale, 1),
    };
};

const normalizeDimensionLines = (
    value: unknown
): ProjectFile["dimensionLines"] => {
    if (value === undefined) {
        return undefined;
    }
    if (!Array.isArray(value)) {
        throw new Error(
            "Invalid project file: dimensionLines must be an array."
        );
    }

    return value.map((line, index) => {
        if (!isRecord(line)) {
            throw new Error(
                `Invalid project file: dimensionLines[${index}] must be an object.`
            );
        }

        const id =
            typeof line.id === "string" && line.id.length > 0
                ? line.id
                : `migrated-line-${index}`;

        const color =
            typeof line.color === "string"
                ? sanitizeDimensionLineColor(line.color)
                : undefined;
        const showUnitLabel =
            typeof line.showUnitLabel === "boolean"
                ? line.showUnitLabel
                : undefined;
        const constraint = sanitizeDimensionConstraint(line.constraint);
        const showCellCount =
            typeof line.showCellCount === "boolean"
                ? line.showCellCount
                : undefined;

        const normalizedLine = {
            id,
            start: normalizePoint(line.start, `dimensionLines[${index}].start`),
            end: normalizePoint(line.end, `dimensionLines[${index}].end`),
        };

        return {
            ...normalizedLine,
            ...(color ? { color } : {}),
            ...(showUnitLabel !== undefined ? { showUnitLabel } : {}),
            ...(constraint !== undefined ? { constraint } : {}),
            ...(showCellCount !== undefined ? { showCellCount } : {}),
        };
    });
};

/**
 * 参考物設定を正規化する。
 *
 * 参考物は表示補助のための機能なので、値が不正でも読み込み全体を
 * 失敗させず、既定値へ落として続行する（sanitizeGuideConfig が担う）。
 */
const normalizeGuides = (value: unknown): ProjectFile["guides"] => {
    if (value === undefined) {
        return undefined;
    }
    return sanitizeGuideConfig(value);
};

const assertSupportedVersion = (value: unknown): void => {    if (value === undefined || value === null) {
        return;
    }

    if (typeof value !== "string" || value.length === 0) {
        throw new Error("Invalid project file: version must be a string.");
    }

    if (value !== CURRENT_PROJECT_VERSION) {
        throw new Error(
            `Unsupported project file version: ${value}. This app supports ${CURRENT_PROJECT_VERSION} and legacy files without a version field.`
        );
    }
};

export const parseAndMigrateProjectFile = (
    value: unknown
): ProjectFile<ImageSet> => {
    if (!isRecord(value)) {
        throw new Error("Invalid project file: root must be an object.");
    }

    assertSupportedVersion(value.version);

    const imagesRaw = value.images;
    if (!Array.isArray(imagesRaw)) {
        throw new Error("Invalid project file: images must be an array.");
    }

    const canvas = normalizeCanvas(value.canvas);
    const dimensionLines = normalizeDimensionLines(value.dimensionLines);
    const guides = normalizeGuides(value.guides);

    const migrated: ProjectFile<ImageSet> = {
        version: CURRENT_PROJECT_VERSION,
        window: normalizeWindow(value.window),
        settings: normalizeSettings(value.settings),
        images: imagesRaw.map((image, index) => normalizeImage(image, index)),
    };

    if (canvas !== undefined) {
        migrated.canvas = canvas;
    }
    if (dimensionLines !== undefined) {
        migrated.dimensionLines = dimensionLines;
    }
    if (guides !== undefined) {
        migrated.guides = guides;
    }

    return migrated;
};
