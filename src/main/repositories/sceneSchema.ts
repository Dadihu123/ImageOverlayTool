import type { DimensionLine } from "../../shared/types/DimensionLine";
import type { ImageSet } from "../../shared/types/ImageSet";
import type { AnchorPos } from "../../shared/types/AnchorPos";
import {
    SCENE_FILE_VERSION,
    type SceneFile,
    type SceneImageInput,
    type SceneWindowSettings,
} from "../../shared/types/SceneFile";
import { isValidWindowColor } from "../../shared/types/AppConfig";
import {
    sanitizeDimensionConstraint,
    sanitizeGuideConfig,
} from "../../shared/constants/guide";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
    typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

const parseBoolean = (
    value: unknown,
    path: string,
    optional = false
): boolean | undefined => {
    if (value === undefined && optional) {
        return undefined;
    }
    if (typeof value !== "boolean") {
        throw new Error(`Invalid scene file: ${path} must be a boolean.`);
    }
    return value;
};

const parseFiniteNumber = (
    value: unknown,
    path: string,
    optional = false
): number | undefined => {
    if (value === undefined && optional) {
        return undefined;
    }
    if (!isFiniteNumber(value)) {
        throw new Error(`Invalid scene file: ${path} must be a number.`);
    }
    return value;
};

const parseUnit = (value: unknown): SceneFile["unit"] => {
    if (value === undefined) {
        return undefined;
    }
    if (value === "nm" || value === "um" || value === "mm") {
        return value;
    }
    throw new Error("Invalid scene file: unit must be one of nm/um/mm.");
};

const parseCanvas = (value: unknown): SceneFile["canvas"] => {
    if (value === undefined) {
        return undefined;
    }
    if (!isRecord(value)) {
        throw new Error("Invalid scene file: canvas must be an object.");
    }
    return {
        x: parseFiniteNumber(value.x, "canvas.x") as number,
        y: parseFiniteNumber(value.y, "canvas.y") as number,
        scale: parseFiniteNumber(value.scale, "canvas.scale") as number,
    };
};

const parseImageFilters = (
    value: unknown,
    path: string
): ImageSet["filters"] => {
    if (value === undefined) {
        return undefined;
    }
    if (!isRecord(value)) {
        throw new Error(`Invalid scene file: ${path} must be an object.`);
    }

    const filters: NonNullable<ImageSet["filters"]> = {};

    if (value.binarization !== undefined) {
        if (!isRecord(value.binarization)) {
            throw new Error(
                `Invalid scene file: ${path}.binarization must be an object.`
            );
        }

        const enabled = parseBoolean(
            value.binarization.enabled,
            `${path}.binarization.enabled`
        );
        const threshold = parseFiniteNumber(
            value.binarization.threshold,
            `${path}.binarization.threshold`
        );

        filters.binarization = {
            enabled: enabled as boolean,
            threshold: threshold as number,
        };
    }

    if (value.hsv !== undefined) {
        if (!isRecord(value.hsv)) {
            throw new Error(
                `Invalid scene file: ${path}.hsv must be an object.`
            );
        }

        filters.hsv = {
            enabled: parseBoolean(
                value.hsv.enabled,
                `${path}.hsv.enabled`
            ) as boolean,
            h: parseFiniteNumber(value.hsv.h, `${path}.hsv.h`) as number,
            s: parseFiniteNumber(value.hsv.s, `${path}.hsv.s`) as number,
            v: parseFiniteNumber(value.hsv.v, `${path}.hsv.v`) as number,
        };
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
};

const parseAnchorPoint = (
    value: unknown,
    path: string
): { x: number; y: number } => {
    if (!isRecord(value)) {
        throw new Error(`Invalid scene file: ${path} must be an object.`);
    }
    return {
        x: parseFiniteNumber(value.x, `${path}.x`) as number,
        y: parseFiniteNumber(value.y, `${path}.y`) as number,
    };
};

const parseAnchorPos = (
    value: unknown,
    path: string
): AnchorPos | null | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (!isRecord(value)) {
        throw new Error(`Invalid scene file: ${path} must be an object.`);
    }

    return {
        lt: parseAnchorPoint(value.lt, `${path}.lt`),
        lb: parseAnchorPoint(value.lb, `${path}.lb`),
        rt: parseAnchorPoint(value.rt, `${path}.rt`),
        rb: parseAnchorPoint(value.rb, `${path}.rb`),
    };
};

const parseImage = (value: unknown, index: number): SceneImageInput => {
    const pathPrefix = `images[${index}]`;
    if (!isRecord(value)) {
        throw new Error(`Invalid scene file: ${pathPrefix} must be an object.`);
    }

    const source = value.source;
    if (typeof source !== "string" || source.trim().length === 0) {
        throw new Error(
            `Invalid scene file: ${pathPrefix}.source is required.`
        );
    }

    let id: string | undefined;
    if (value.id !== undefined) {
        if (typeof value.id !== "string" || value.id.trim().length === 0) {
            throw new Error(
                `Invalid scene file: ${pathPrefix}.id must be a non-empty string.`
            );
        }
        id = value.id;
    }

    const transparency = parseFiniteNumber(
        value.transparency,
        `${pathPrefix}.transparency`,
        true
    );
    if (transparency !== undefined && (transparency < 0 || transparency > 1)) {
        throw new Error(
            `Invalid scene file: ${pathPrefix}.transparency must be between 0 and 1.`
        );
    }

    const parsed: SceneImageInput = {
        source: source.trim(),
        id,
        transparency,
        rotation: parseFiniteNumber(
            value.rotation,
            `${pathPrefix}.rotation`,
            true
        ),
        locked: parseBoolean(value.locked, `${pathPrefix}.locked`, true),
        visible: parseBoolean(value.visible, `${pathPrefix}.visible`, true),
        filters: parseImageFilters(value.filters, `${pathPrefix}.filters`),
    };

    const initAnchorPos = parseAnchorPos(
        value.initAnchorPos,
        `${pathPrefix}.initAnchorPos`
    );
    if (initAnchorPos !== undefined) {
        parsed.initAnchorPos = initAnchorPos;
    }

    const currentAnchorPos = parseAnchorPos(
        value.currentAnchorPos,
        `${pathPrefix}.currentAnchorPos`
    );
    if (currentAnchorPos !== undefined) {
        parsed.currentAnchorPos = currentAnchorPos;
    }

    return parsed;
};

const parsePoint = (value: unknown, path: string): { x: number; y: number } => {
    if (!isRecord(value)) {
        throw new Error(`Invalid scene file: ${path} must be an object.`);
    }
    return {
        x: parseFiniteNumber(value.x, `${path}.x`) as number,
        y: parseFiniteNumber(value.y, `${path}.y`) as number,
    };
};

const parseDimensionLines = (value: unknown): SceneFile["dimensionLines"] => {
    if (value === undefined) {
        return undefined;
    }
    if (!Array.isArray(value)) {
        throw new Error("Invalid scene file: dimensionLines must be an array.");
    }

    return value.map((line, index) => {
        const pathPrefix = `dimensionLines[${index}]`;
        if (!isRecord(line)) {
            throw new Error(
                `Invalid scene file: ${pathPrefix} must be an object.`
            );
        }

        let id: string | undefined;
        if (line.id !== undefined) {
            if (typeof line.id !== "string" || line.id.trim().length === 0) {
                throw new Error(
                    `Invalid scene file: ${pathPrefix}.id must be a non-empty string.`
                );
            }
            id = line.id;
        }

        let color: string | undefined;
        if (line.color !== undefined) {
            if (
                typeof line.color !== "string" ||
                line.color.trim().length === 0
            ) {
                throw new Error(
                    `Invalid scene file: ${pathPrefix}.color must be a non-empty string.`
                );
            }
            color = line.color;
        }

        const showUnitLabel = parseBoolean(
            line.showUnitLabel,
            `${pathPrefix}.showUnitLabel`,
            true
        );

        const constraint = sanitizeDimensionConstraint(line.constraint);

        const normalized: DimensionLine = {
            id: id ?? `scene-line-${index}`,
            start: parsePoint(line.start, `${pathPrefix}.start`),
            end: parsePoint(line.end, `${pathPrefix}.end`),
        };

        if (color !== undefined) {
            normalized.color = color;
        }
        if (showUnitLabel !== undefined) {
            normalized.showUnitLabel = showUnitLabel;
        }
        if (constraint !== undefined) {
            normalized.constraint = constraint;
        }
        return normalized;
    });
};

/**
 * 参考物設定を解析する。
 *
 * 構造が壊れていても既定値へ落として読み込みを継続する
 * （表示補助機能のためにシーン全体を無効化しない）。
 */
const parseGuides = (value: unknown): SceneFile["guides"] => {
    if (value === undefined) {
        return undefined;
    }
    return sanitizeGuideConfig(value);
};

const parseWindowSettings = (
    value: unknown
): SceneWindowSettings | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (!isRecord(value)) {
        throw new Error("Invalid scene file: window must be an object.");
    }

    let color: string | undefined;
    if (value.color !== undefined) {
        if (!isValidWindowColor(value.color)) {
            throw new Error("Invalid scene file: window.color is invalid.");
        }
        color = value.color.trim();
    }

    const parsed: SceneWindowSettings = {
        color,
        alwaysOnTop: parseBoolean(
            value.alwaysOnTop,
            "window.alwaysOnTop",
            true
        ),
        clickThrough: parseBoolean(
            value.clickThrough,
            "window.clickThrough",
            true
        ),
        showWindowFrame: parseBoolean(
            value.showWindowFrame,
            "window.showWindowFrame",
            true
        ),
    };

    if (
        parsed.color === undefined &&
        parsed.alwaysOnTop === undefined &&
        parsed.clickThrough === undefined &&
        parsed.showWindowFrame === undefined
    ) {
        return undefined;
    }

    return parsed;
};

const parseImagePathAliases = (
    value: unknown
): SceneFile["imagePathAliases"] => {
    if (value === undefined) {
        return undefined;
    }
    if (!isRecord(value)) {
        throw new Error(
            "Invalid scene file: imagePathAliases must be an object."
        );
    }

    const aliases: Record<string, string> = {};
    for (const [key, rawValue] of Object.entries(value)) {
        const aliasName = key.trim();
        if (aliasName.length === 0) {
            throw new Error(
                "Invalid scene file: imagePathAliases key must not be empty."
            );
        }
        if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
            throw new Error(
                `Invalid scene file: imagePathAliases.${aliasName} must be a non-empty string.`
            );
        }
        aliases[aliasName] = rawValue.trim();
    }

    return aliases;
};

export const parseSceneFile = (value: unknown): SceneFile => {
    if (!isRecord(value)) {
        throw new Error("Invalid scene file: root must be an object.");
    }

    if (value.version !== SCENE_FILE_VERSION) {
        throw new Error(
            `Unsupported scene file version: ${String(
                value.version
            )}. This app supports ${SCENE_FILE_VERSION}.`
        );
    }

    if (!Array.isArray(value.images)) {
        throw new Error("Invalid scene file: images must be an array.");
    }

    return {
        version: SCENE_FILE_VERSION,
        window: parseWindowSettings(value.window),
        unitFactor: parseFiniteNumber(value.unitFactor, "unitFactor", true),
        unit: parseUnit(value.unit),
        canvas: parseCanvas(value.canvas),
        imagePathAliases: parseImagePathAliases(value.imagePathAliases),
        images: value.images.map((image, index) => parseImage(image, index)),
        dimensionLines: parseDimensionLines(value.dimensionLines),
        guides: parseGuides(value.guides),
    };
};
