import {
    GUIDE_RECT_DUPLICATE_OFFSET,
    sanitizeGuideConfig,
} from "../../../shared/constants/guide";
import type { GuideConfig, GuideRect } from "../../../shared/types/Guide";

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
});
