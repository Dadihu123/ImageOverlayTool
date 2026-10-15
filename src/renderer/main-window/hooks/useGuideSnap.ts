import { useMemo } from "react";

import type { GuideConfig } from "../../../shared/types/Guide";
import type { ImageSet } from "../../../shared/types/ImageSet";
import type { AnchorPos } from "../../../shared/types/AnchorPos";
import { GUIDE_GRID_MIN_SCREEN_SPACING, GUIDE_SNAP_SCREEN_RADIUS } from "../../../shared/constants/guide";
import type { Point } from "../../../shared/types/Point";
import {
    resolveGridStep,
    resolveGuideRectWorldRect,
} from "../utils/guideGeometry";
import { resolveSnap, type SnapAxis, type SnapResult } from "../utils/guideSnap";
import type { WorldRect } from "../utils/stageCoords";

export interface UseGuideSnapParams {
    guides: GuideConfig;
    dimensionLines: { id: string; start: Point; end: Point }[];
    imageSets: ImageSet[];
    /** ステージのスケール */
    scale: number;
    /** 吸着を許可する軸 */
    axis: SnapAxis;
}

const buildAnchorMap = (imageSets: ImageSet[]): Map<string, AnchorPos> => {
    const map = new Map<string, AnchorPos>();
    for (const imageSet of imageSets) {
        if (imageSet.currentAnchorPos) {
            map.set(imageSet.id, imageSet.currentAnchorPos);
        }
    }
    return map;
};

/**
 * グリッド・参考線・参考枠・寸法線端点への吸着を解決するフック。
 *
 * 吸着半径は画面 px をワールド長へ換算するため、拡大率によらず操作感が一定になる。
 */
export const useGuideSnap = ({
    guides,
    dimensionLines,
    imageSets,
    scale,
    axis,
}: UseGuideSnapParams) => {
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

    const gridStepX = useMemo(
        () =>
            resolveGridStep(
                guides.grid.spacingX,
                safeScale,
                GUIDE_GRID_MIN_SCREEN_SPACING
            ),
        [guides.grid.spacingX, safeScale]
    );

    const gridStepY = useMemo(
        () =>
            resolveGridStep(
                guides.grid.spacingY,
                safeScale,
                GUIDE_GRID_MIN_SCREEN_SPACING
            ),
        [guides.grid.spacingY, safeScale]
    );

    const anchorMap = useMemo(() => buildAnchorMap(imageSets), [imageSets]);

    const resolvedRects = useMemo(() => {
        const entries: { id: string; rect: WorldRect }[] = [];
        for (const rect of guides.rects) {
            const world = resolveGuideRectWorldRect(rect.shape, anchorMap);
            if (world) {
                entries.push({ id: rect.id, rect: world });
            }
        }
        return entries;
    }, [guides.rects, anchorMap]);

    const snap = useMemo(() => {
        const radius = GUIDE_SNAP_SCREEN_RADIUS / safeScale;
        return (pointer: Point): SnapResult =>
            resolveSnap(pointer, {
                grid: guides.grid,
                guideLines: guides.lines,
                rects: resolvedRects,
                dimensionLines,
                radius,
                gridStepX,
                gridStepY,
                axis,
            });
    }, [
        guides.grid,
        guides.lines,
        resolvedRects,
        dimensionLines,
        safeScale,
        gridStepX,
        gridStepY,
        axis,
    ]);

    return { snap, gridStepX, gridStepY };
};
