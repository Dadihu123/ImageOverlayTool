import React, { memo, useCallback, useState } from "react";
import { Arrow, Group, Text, Circle } from "react-konva";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { KonvaEventObject } from "konva/lib/Node";
import { sanitizeDimensionLineColor } from "../../../shared/constants/dimensionLine";
import type { Point } from "../../../shared/types/Point";
import { countGridCells } from "../utils/guideGeometry";

interface DimensionLineLayerProps {
    dimensionLines: DimensionLine[];
    unitFactor: number;
    unit: string;
    isSelected: (id: string) => boolean;
    onSelect: (id: string | null) => void;
    onUpdate: (line: DimensionLine) => void;
    isDimensionEditMode: boolean;
    /** 画面上で一定の太さを保つためのスケール */
    scale?: number;
    /** 格子数の併記に使う実効グリッド間隔（未指定なら併記しない） */
    gridStepX?: number;
    gridStepY?: number;
    /** 格子数を併記するか */
    showCellCount?: boolean;
}

type AnchorType = "start" | "end";
type EditingAnchorMap = Record<string, Partial<Record<AnchorType, Point>>>;

export const DimensionLineLayer = memo(function DimensionLineLayer(
    props: DimensionLineLayerProps
) {
    "use no memo";

    const {
        dimensionLines,
        unitFactor,
        unit,
        isSelected,
        onSelect,
        onUpdate,
        isDimensionEditMode,
        scale = 1,
        gridStepX,
        gridStepY,
        showCellCount = false,
    } = props;
    const [editingAnchors, setEditingAnchors] = useState<EditingAnchorMap>({});

    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

    // 画面上で一定の大きさにするための換算
    const anchorRadius = 6 / safeScale;
    const pointerLength = 10 / safeScale;
    const fontSize = 16 / safeScale;

    const getLabel = (
        start: { x: number; y: number },
        end: { x: number; y: number },
        constraint: DimensionLine["constraint"]
    ) => {
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        // 直交拘束時は拘束された軸の長さを表示する
        const measured =
            constraint === "horizontal"
                ? Math.abs(dx)
                : constraint === "vertical"
                ? Math.abs(dy)
                : Math.sqrt(dx * dx + dy * dy);

        const realDist = measured * unitFactor;
        const parts = [`${realDist.toFixed(2)} ${unit}`];

        if (showCellCount) {
            const step = constraint === "vertical" ? gridStepY : gridStepX;
            const cells = step === undefined ? null : countGridCells(measured, step);
            if (cells !== null && Number.isFinite(cells)) {
                parts.push(`(${cells.toFixed(1)} cell)`);
            }
        }

        return parts.join(" ");
    };

    const getMidPoint = (
        start: { x: number; y: number },
        end: { x: number; y: number }
    ) => {
        return {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2,
        };
    };

    const onAnchorDragEnd = useCallback(
        (id: string, type: AnchorType) => (e: KonvaEventObject<DragEvent>) => {
            const line = dimensionLines.find((l) => l.id === id);
            if (!line) {
                setEditingAnchors((prev) => {
                    if (!prev[id]) {
                        return prev;
                    }
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
                return;
            }

            const newPos = { x: e.target.x(), y: e.target.y() };
            const newLine = { ...line };
            if (type === "start") {
                newLine.start = newPos;
            } else {
                newLine.end = newPos;
            }
            onUpdate(newLine);

            setEditingAnchors((prev) => {
                const lineAnchors = prev[id];
                if (!lineAnchors) {
                    return prev;
                }
                const nextLineAnchors = { ...lineAnchors };
                delete nextLineAnchors[type];
                if (Object.keys(nextLineAnchors).length === 0) {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                }
                return { ...prev, [id]: nextLineAnchors };
            });
        },
        [dimensionLines, onUpdate]
    );

    const onAnchorDragMove = useCallback(
        (id: string, type: AnchorType) => (e: KonvaEventObject<DragEvent>) => {
            const newPos = { x: e.target.x(), y: e.target.y() };
            setEditingAnchors((prev) => ({
                ...prev,
                [id]: {
                    ...(prev[id] ?? {}),
                    [type]: newPos,
                },
            }));
        },
        []
    );

    return (
        <Group>
            {dimensionLines.map((line) => {
                const selected = isSelected(line.id);
                const editing = editingAnchors[line.id];
                const start = editing?.start ?? line.start;
                const end = editing?.end ?? line.end;
                const mid = getMidPoint(start, end);
                const label = getLabel(start, end, line.constraint);
                const lineColor = sanitizeDimensionLineColor(line.color);
                const shouldShowUnitLabel = line.showUnitLabel !== false;

                return (
                    <Group
                        key={line.id}
                        onClick={(e) => {
                            if (isDimensionEditMode) {
                                onSelect(line.id);
                                e.cancelBubble = true;
                            }
                        }}
                    >
                        {/* 矢印 */}
                        <Arrow
                            points={[start.x, start.y, end.x, end.y]}
                            stroke={lineColor}
                            fill={lineColor}
                            strokeWidth={selected ? 3 : 2}
                            pointerLength={pointerLength}
                            pointerWidth={pointerLength}
                            pointerAtBeginning={true}
                            strokeScaleEnabled={false}
                            perfectDrawEnabled={false}
                        />

                        {/* ラベル */}
                        {shouldShowUnitLabel && (
                            <Text
                                x={mid.x}
                                y={mid.y}
                                text={label}
                                fontSize={fontSize}
                                fill={lineColor}
                                width={label.length * fontSize * 0.6}
                                align="center"
                                offsetX={(label.length * fontSize * 0.6) / 2}
                                offsetY={fontSize * 1.4}
                                listening={false}
                                strokeScaleEnabled={false}
                                perfectDrawEnabled={false}
                            />
                        )}

                        {/* ラベルを編集するためのアンカー */}
                        {selected && isDimensionEditMode && (
                            <>
                                <Circle
                                    x={start.x}
                                    y={start.y}
                                    radius={anchorRadius}
                                    fill={lineColor}
                                    draggable
                                    strokeScaleEnabled={false}
                                    onDragMove={onAnchorDragMove(
                                        line.id,
                                        "start"
                                    )}
                                    onDragEnd={onAnchorDragEnd(
                                        line.id,
                                        "start"
                                    )}
                                />
                                <Circle
                                    x={end.x}
                                    y={end.y}
                                    radius={anchorRadius}
                                    fill={lineColor}
                                    draggable
                                    strokeScaleEnabled={false}
                                    onDragMove={onAnchorDragMove(
                                        line.id,
                                        "end"
                                    )}
                                    onDragEnd={onAnchorDragEnd(line.id, "end")}
                                />
                            </>
                        )}
                    </Group>
                );
            })}
        </Group>
    );
});
