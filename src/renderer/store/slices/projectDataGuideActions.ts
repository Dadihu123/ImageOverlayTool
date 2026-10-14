import {
    GUIDE_RECT_DUPLICATE_OFFSET,
    sanitizeGuideConfig,
} from "../../../shared/constants/guide";
import type {
    GuideConfig,
    GuideRect,
} from "../../../shared/types/Guide";

import type {
    ProjectDataSlice,
    SetProjectDataWithOrigin,
} from "./projectDataSliceTypes";

interface CreateProjectDataGuideActionsParams {
    setProjectDataWithOrigin: SetProjectDataWithOrigin;
}

/** 参考枠の配列を差し替えつつ、全体を正規化する */
const withRects = (guides: GuideConfig, rects: GuideRect[]): GuideConfig => ({
    ...sanitizeGuideConfig(guides),
    rects,
});

const withLines = (
    guides: GuideConfig,
    lines: Partial<GuideConfig["lines"]>
): GuideConfig => ({
    ...sanitizeGuideConfig(guides),
    lines: { ...guides.lines, ...lines },
});

/** 昇順ソートと重複排除を行い、インデックスを安定させる */
const normalizeLineValues = (values: number[]): number[] =>
    [...new Set(values)].sort((a, b) => a - b);

/** 等距生成の上限（誤操作で大量生成されるのを防ぐ） */
const MAX_GENERATED_LINES = 500;

export const createProjectDataGuideActions = ({
    setProjectDataWithOrigin,
}: CreateProjectDataGuideActionsParams): Pick<
    ProjectDataSlice,
    | "setGuides"
    | "receiveGuides"
    | "updateGuides"
    | "addGuideRect"
    | "updateGuideRect"
    | "removeGuideRect"
    | "duplicateGuideRect"
    | "setBaselineGuideRectId"
    | "addGuideLine"
    | "moveGuideLine"
    | "removeGuideLine"
    | "generateGuideLines"
    | "clearGuideLines"
    | "linkGuideRectToImage"
    | "unlinkGuideRect"
> => ({
    setGuides: (guides) =>
        setProjectDataWithOrigin("local", {
            guides: sanitizeGuideConfig(guides),
            hasUnsavedChanges: true,
        }),

    receiveGuides: (guides) =>
        setProjectDataWithOrigin("remote", {
            guides: sanitizeGuideConfig(guides),
            hasUnsavedChanges: true,
        }),

    updateGuides: (patch) =>
        setProjectDataWithOrigin("local", (state) => ({
            guides: sanitizeGuideConfig(patch(state.guides)),
            hasUnsavedChanges: true,
        })),

    addGuideRect: (rect) =>
        setProjectDataWithOrigin("local", (state) => ({
            guides: withRects(state.guides, [...state.guides.rects, rect]),
            hasUnsavedChanges: true,
        })),

    updateGuideRect: (rect) =>
        setProjectDataWithOrigin("local", (state) => {
            const index = state.guides.rects.findIndex(
                (entry) => entry.id === rect.id
            );
            if (index === -1) {
                return null;
            }
            const rects = [...state.guides.rects];
            rects[index] = rect;
            return {
                guides: withRects(state.guides, rects),
                hasUnsavedChanges: true,
            };
        }),

    removeGuideRect: (id) =>
        setProjectDataWithOrigin("local", (state) => {
            const rects = state.guides.rects.filter(
                (entry) => entry.id !== id
            );
            if (rects.length === state.guides.rects.length) {
                return null;
            }
            const next = withRects(state.guides, rects);
            // 基準枠が消えたら解除する
            if (next.baselineRectId === id) {
                next.baselineRectId = null;
            }
            return { guides: next, hasUnsavedChanges: true };
        }),

    duplicateGuideRect: (id) =>
        setProjectDataWithOrigin("local", (state) => {
            const source = state.guides.rects.find(
                (entry) => entry.id === id
            );
            if (!source) {
                return null;
            }

            const copy: GuideRect = {
                ...source,
                id: crypto.randomUUID(),
            };
            if (copy.shape.kind === "world") {
                copy.shape = {
                    ...copy.shape,
                    x: copy.shape.x + GUIDE_RECT_DUPLICATE_OFFSET,
                    y: copy.shape.y + GUIDE_RECT_DUPLICATE_OFFSET,
                };
            }
            // 複製は固定を引き継がない（すぐ動かせるように）
            delete copy.locked;

            return {
                guides: withRects(state.guides, [
                    ...state.guides.rects,
                    copy,
                ]),
                hasUnsavedChanges: true,
            };
        }),

    setBaselineGuideRectId: (id) =>
        setProjectDataWithOrigin("local", (state) => {
            const valid =
                id === null ||
                state.guides.rects.some((entry) => entry.id === id);
            if (!valid) {
                return null;
            }
            return {
                guides: { ...state.guides, baselineRectId: id },
                hasUnsavedChanges: true,
            };
        }),

    addGuideLine: (axis, value) =>
        setProjectDataWithOrigin("local", (state) => {
            if (!Number.isFinite(value)) {
                return null;
            }
            const key = axis === "x" ? "xs" : "ys";
            const values = normalizeLineValues([
                ...state.guides.lines[key],
                value,
            ]);
            return {
                guides: withLines(state.guides, { [key]: values }),
                hasUnsavedChanges: true,
            };
        }),

    moveGuideLine: (axis, index, value) =>
        setProjectDataWithOrigin("local", (state) => {
            const key = axis === "x" ? "xs" : "ys";
            const values = [...state.guides.lines[key]];
            if (index < 0 || index >= values.length) {
                return null;
            }
            if (!Number.isFinite(value)) {
                return null;
            }
            values[index] = value;
            return {
                guides: withLines(state.guides, {
                    [key]: normalizeLineValues(values),
                }),
                hasUnsavedChanges: true,
            };
        }),

    removeGuideLine: (axis, index) =>
        setProjectDataWithOrigin("local", (state) => {
            const key = axis === "x" ? "xs" : "ys";
            const values = state.guides.lines[key];
            if (index < 0 || index >= values.length) {
                return null;
            }
            return {
                guides: withLines(state.guides, {
                    [key]: values.filter((_, i) => i !== index),
                }),
                hasUnsavedChanges: true,
            };
        }),

    generateGuideLines: ({ axis, start, interval, count }) =>
        setProjectDataWithOrigin("local", (state) => {
            if (
                !Number.isFinite(start) ||
                !Number.isFinite(interval) ||
                !Number.isInteger(count) ||
                count < 1 ||
                count > MAX_GENERATED_LINES ||
                interval === 0
            ) {
                return null;
            }

            const generated: number[] = [];
            for (let i = 0; i < count; i += 1) {
                generated.push(start + interval * i);
            }

            const key = axis === "x" ? "xs" : "ys";
            const values = normalizeLineValues([
                ...state.guides.lines[key],
                ...generated,
            ]);
            return {
                guides: withLines(state.guides, { [key]: values }),
                hasUnsavedChanges: true,
            };
        }),

    clearGuideLines: (axis) =>
        setProjectDataWithOrigin("local", (state) => ({
            guides: withLines(state.guides, {
                [axis === "x" ? "xs" : "ys"]: [],
            }),
            hasUnsavedChanges: true,
        })),

    linkGuideRectToImage: ({ rectId, imageSetId, shape }) =>
        setProjectDataWithOrigin("local", (state) => {
            const index = state.guides.rects.findIndex(
                (entry) => entry.id === rectId
            );
            if (index === -1 || shape.kind !== "linked") {
                return null;
            }
            if (shape.imageSetId !== imageSetId) {
                return null;
            }
            const rects = [...state.guides.rects];
            rects[index] = { ...rects[index], shape };
            return {
                guides: withRects(state.guides, rects),
                hasUnsavedChanges: true,
            };
        }),

    unlinkGuideRect: ({ rectId, worldRect }) =>
        setProjectDataWithOrigin("local", (state) => {
            const index = state.guides.rects.findIndex(
                (entry) => entry.id === rectId
            );
            if (index === -1) {
                return null;
            }
            const rects = [...state.guides.rects];
            rects[index] = {
                ...rects[index],
                shape: { kind: "world", ...worldRect },
            };
            return {
                guides: withRects(state.guides, rects),
                hasUnsavedChanges: true,
            };
        }),
});
