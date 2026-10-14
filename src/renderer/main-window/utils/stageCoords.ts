import type Konva from "konva";

import type { Point } from "../../../shared/types/Point";

/** ワールド座標系の軸平行矩形 */
export interface WorldRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * ステージ上のポインタ位置をワールド座標へ変換する。
 * ステージやポインタが取得できない場合は null を返す。
 */
export const getStagePointerWorld = (
    stage: Konva.Stage | null | undefined
): Point | null => {
    if (!stage) {
        return null;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) {
        return null;
    }

    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pointer);
};

/**
 * 現在画面に表示されている領域をワールド座標の矩形で返す。
 * 回転は想定していないが、負のスケールでも破綻しないよう min/max で正規化する。
 */
export const getVisibleWorldRect = (stage: Konva.Stage): WorldRect => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();

    const width = stage.width();
    const height = stage.height();

    const topLeft = transform.point({ x: 0, y: 0 });
    const bottomRight = transform.point({ x: width, y: height });

    return {
        x: Math.min(topLeft.x, bottomRight.x),
        y: Math.min(topLeft.y, bottomRight.y),
        width: Math.abs(bottomRight.x - topLeft.x),
        height: Math.abs(bottomRight.y - topLeft.y),
    };
};

/** ステージのスケール（0 や非有限値は 1 とみなす） */
export const getStageScale = (stage: Konva.Stage): number => {
    const scale = Math.abs(stage.scaleX());
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
};

/** 画面上の px 距離をワールド座標の距離へ変換する */
export const screenPxToWorld = (stage: Konva.Stage, px: number): number =>
    px / getStageScale(stage);
