import React, { memo, useCallback, useRef, useState } from "react";
import Konva from "konva";
import { Group, Line, Rect, Text } from "react-konva";

import { GUIDE_RECT_COLOR_DEFAULT } from "../../../shared/constants/guide";
import type { AnchorPos } from "../../../shared/types/AnchorPos";
import type { GuideRect, GuideRectShape } from "../../../shared/types/Guide";
import type { Point } from "../../../shared/types/Point";
import {
    getRectHandlePoints,
    isEdgeHandle,
    mapRectToQuad,
    resizeGuideRect,
    type RectHandle,
} from "../utils/guideGeometry";
import type { WorldRect } from "../utils/stageCoords";

interface GuideRectLayerProps {
    rects: GuideRect[];
    /** linked 参考枠の解決に使う画像アンカー */
    anchorsByImageId: Map<string, AnchorPos>;
    /** world 形状の参考枠をワールド矩形へ解決する */
    resolveRect: (rect: GuideRect) => WorldRect | null;
    selectedRectId: string | null;
    onSelect: (id: string | null) => void;
    onUpdateRect: (rect: GuideRect) => void;
    isEditMode: boolean;
    scale: number;
    baselineRectId?: string | null;
    /** 吸着を適用する関数（ドラッグ中の座標補正に使う） */
    snapPoint?: (point: Point) => Point;
    /** 表示単位換算 */
    unitFactor?: number;
    unit?: string;
    /** グリッド間隔（格子数表示用） */
    gridStepX?: number;
    gridStepY?: number;
}

const HANDLE_SCREEN_RADIUS = 5;
const HANDLE_ORDER: RectHandle[] = [
    "lt",
    "rt",
    "rb",
    "lb",
    "left",
    "right",
    "top",
    "bottom",
];

/** 参考枠を描画用の四隅へ変換する */
const toQuad = (
    shape: GuideRectShape,
    anchorsByImageId: Map<string, AnchorPos>
): [Point, Point, Point, Point] | null => {
    if (shape.kind === "linked") {
        const anchors = anchorsByImageId.get(shape.imageSetId);
        if (!anchors) {
            return null;
        }
        return mapRectToQuad(shape, anchors);
    }

    return [
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.width, y: shape.y },
        { x: shape.x + shape.width, y: shape.y + shape.height },
        { x: shape.x, y: shape.y + shape.height },
    ];
};

const formatSize = (
    rect: WorldRect,
    unitFactor: number,
    unit: string,
    gridStepX?: number,
    gridStepY?: number
): string => {
    const parts: string[] = [];

    const widthCells =
        gridStepX && gridStepX > 0 ? rect.width / gridStepX : null;
    const heightCells =
        gridStepY && gridStepY > 0 ? rect.height / gridStepY : null;

    const widthText =
        widthCells !== null
            ? `${rect.width.toFixed(1)}px (${widthCells.toFixed(1)} cell)`
            : `${rect.width.toFixed(1)}px`;
    const heightText =
        heightCells !== null
            ? `${rect.height.toFixed(1)}px (${heightCells.toFixed(1)} cell)`
            : `${rect.height.toFixed(1)}px`;

    parts.push(`${widthText} x ${heightText}`);

    if (unitFactor && unitFactor > 0 && unit) {
        parts.push(
            `= ${(rect.width * unitFactor).toFixed(2)} x ${(
                rect.height * unitFactor
            ).toFixed(2)} ${unit}`
        );
    }

    return parts.join("  ");
};

/**
 * 参考枠の描画と編集。
 *
 * 編集中は 4 辺 + 4 角のハンドルを出す。辺ドラッグでは対辺が、
 * 角ドラッグでは対角が固定されるため、狙った寸法へ合わせやすい。
 */
export const GuideRectLayer = memo(function GuideRectLayer({
    rects,
    anchorsByImageId,
    resolveRect,
    selectedRectId,
    onSelect,
    onUpdateRect,
    isEditMode,
    scale,
    baselineRectId,
    snapPoint,
    unitFactor = 0,
    unit = "",
    gridStepX,
    gridStepY,
}: GuideRectLayerProps) {
    "use no memo";

    const [dragging, setDragging] = useState<{
        id: string;
        handle: RectHandle;
        rect: WorldRect;
    } | null>(null);

    const shiftRef = useRef(false);

    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    const handleRadius = HANDLE_SCREEN_RADIUS / safeScale;
    const strokeWidth = 2 / safeScale;
    const fontSize = 12 / safeScale;

    const onHandleDragMove = useCallback(
        (rect: GuideRect, handle: RectHandle) => {
            return (e: Konva.KonvaEventObject<DragEvent>) => {
                const current = resolveRect(rect);
                if (!current) {
                    return;
                }

                shiftRef.current = Boolean(
                    (e.evt as MouseEvent | undefined)?.shiftKey
                );

                const raw: Point = { x: e.target.x(), y: e.target.y() };
                const pointer = snapPoint ? snapPoint(raw) : raw;

                const next = resizeGuideRect({
                    rect: current,
                    handle,
                    pointer,
                    minSize: 1 / safeScale,
                    keepAspectRatio: shiftRef.current,
                });

                setDragging({ id: rect.id, handle, rect: next });
            };
        },
        [resolveRect, snapPoint, safeScale]
    );

    const onHandleDragEnd = useCallback(
        (rect: GuideRect, handle: RectHandle) => {
            return (e: Konva.KonvaEventObject<DragEvent>) => {
                const current = resolveRect(rect);
                if (current) {
                    const raw: Point = { x: e.target.x(), y: e.target.y() };
                    const pointer = snapPoint ? snapPoint(raw) : raw;
                    const next = resizeGuideRect({
                        rect: current,
                        handle,
                        pointer,
                        minSize: 1 / safeScale,
                        keepAspectRatio: shiftRef.current,
                    });

                    if (rect.shape.kind === "world") {
                        onUpdateRect({
                            ...rect,
                            shape: { kind: "world", ...next },
                        });
                    }
                }

                setDragging(null);
            };
        },
        [onUpdateRect, resolveRect, snapPoint, safeScale]
    );

    const onBodyDragEnd = useCallback(
        (rect: GuideRect) => {
            return (e: Konva.KonvaEventObject<DragEvent>) => {
                const current = resolveRect(rect);
                if (!current || rect.shape.kind !== "world") {
                    e.target.x(0);
                    e.target.y(0);
                    return;
                }

                const next = {
                    ...current,
                    x: current.x + e.target.x(),
                    y: current.y + e.target.y(),
                };

                onUpdateRect({
                    ...rect,
                    shape: { kind: "world", ...next },
                });

                e.target.x(0);
                e.target.y(0);
            };
        },
        [onUpdateRect, resolveRect]
    );

    return (
        <Group>
            {rects.map((rect) => {
                const activeDrag =
                    dragging && dragging.id === rect.id ? dragging : null;
                const world = activeDrag?.rect ?? resolveRect(rect);
                if (!world) {
                    return null;
                }

                const quad = toQuad(rect.shape, anchorsByImageId);
                const selected = selectedRectId === rect.id;
                const isBaseline = baselineRectId === rect.id;
                const color = rect.color ?? GUIDE_RECT_COLOR_DEFAULT;
                const showLabel = rect.showSizeLabel !== false;
                const handles = getRectHandlePoints(world);

                return (
                    <Group
                        key={rect.id}
                        onClick={(e) => {
                            if (!isEditMode) {
                                return;
                            }
                            onSelect(rect.id);
                            e.cancelBubble = true;
                        }}
                    >
                        {/* 本体 */}
                        {quad ? (
                            <Line
                                points={quad.flatMap((point) => [
                                    point.x,
                                    point.y,
                                ])}
                                closed
                                stroke={color}
                                strokeWidth={selected ? strokeWidth * 1.5 : strokeWidth}
                                dash={
                                    isBaseline
                                        ? []
                                        : [8 / safeScale, 4 / safeScale]
                                }
                                draggable={
                                    isEditMode &&
                                    !rect.locked &&
                                    rect.shape.kind === "world"
                                }
                                onDragEnd={onBodyDragEnd(rect)}
                                strokeScaleEnabled={false}
                                perfectDrawEnabled={false}
                                data-testid={`guide.rect.${rect.id}`}
                            />
                        ) : (
                            <Rect
                                x={world.x}
                                y={world.y}
                                width={world.width}
                                height={world.height}
                                stroke={color}
                                strokeWidth={selected ? strokeWidth * 1.5 : strokeWidth}
                                strokeScaleEnabled={false}
                                perfectDrawEnabled={false}
                                data-testid={`guide.rect.${rect.id}`}
                            />
                        )}

                        {/* サイズラベル */}
                        {showLabel && (
                            <Text
                                x={world.x}
                                y={world.y - fontSize * 1.5}
                                text={formatSize(
                                    world,
                                    unitFactor,
                                    unit,
                                    gridStepX,
                                    gridStepY
                                )}
                                fontSize={fontSize}
                                fill={color}
                                listening={false}
                                strokeScaleEnabled={false}
                                perfectDrawEnabled={false}
                                data-testid={`guide.rect.${rect.id}.label`}
                            />
                        )}

                        {/* 名称 */}
                        {rect.label && (
                            <Text
                                x={world.x}
                                y={world.y - fontSize * 3}
                                text={rect.label}
                                fontSize={fontSize * 1.1}
                                fill={color}
                                listening={false}
                                strokeScaleEnabled={false}
                                perfectDrawEnabled={false}
                            />
                        )}

                        {/* 編集ハンドル */}
                        {isEditMode && selected && !rect.locked && (
                            <>
                                {HANDLE_ORDER.map((handle) => {
                                    const point = handles[handle];
                                    return (
                                        <Rect
                                            key={handle}
                                            x={point.x - handleRadius}
                                            y={point.y - handleRadius}
                                            width={handleRadius * 2}
                                            height={handleRadius * 2}
                                            fill={color}
                                            stroke="#ffffff"
                                            strokeWidth={strokeWidth}
                                            draggable
                                            onDragMove={onHandleDragMove(
                                                rect,
                                                handle
                                            )}
                                            onDragEnd={onHandleDragEnd(
                                                rect,
                                                handle
                                            )}
                                            strokeScaleEnabled={false}
                                            perfectDrawEnabled={false}
                                            data-testid={`guide.rect.${
                                                rect.id
                                            }.handle.${
                                                isEdgeHandle(handle)
                                                    ? "edge"
                                                    : "corner"
                                            }.${handle}`}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </Group>
                );
            })}
        </Group>
    );
});
