import React, { memo } from "react";
import { Circle, Line } from "react-konva";

import type { Point } from "../../../shared/types/Point";
import type { SnapSource } from "../utils/guideSnap";

interface GuideSnapIndicatorProps {
    /** 吸着先のワールド座標 */
    point: Point;
    source: SnapSource;
    /** 実際のポインタ位置（ワールド座標）。吸着元との関係を示す補助線に使う */
    pointer: Point;
    /** 画面上で一定の大きさにするためのスケール */
    scale: number;
    color?: string;
}

const INDICATOR_SCREEN_RADIUS = 7;
const INDICATOR_SCREEN_STROKE = 1.5;

const describeSource = (source: SnapSource): string => {
    switch (source.kind) {
        case "rectCorner":
            return "rect-corner";
        case "rectEdge":
            return "rect-edge";
        case "guideLine":
            return "guide-line";
        case "gridIntersection":
            return "grid-intersection";
        case "gridLine":
            return "grid-line";
        case "dimensionEndpoint":
            return "dimension-endpoint";
    }
};

/**
 * 吸着フィードバック。
 * 何に吸着したかを示さないと、ユーザーは意図した位置に置けたか判断できない。
 */
export const GuideSnapIndicator = memo(function GuideSnapIndicator({
    point,
    source,
    pointer,
    scale,
    color = "#22d3ee",
}: GuideSnapIndicatorProps) {
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    const radius = INDICATOR_SCREEN_RADIUS / safeScale;
    const strokeWidth = INDICATOR_SCREEN_STROKE / safeScale;

    const isPointSnap =
        source.kind === "rectCorner" || source.kind === "dimensionEndpoint";

    const showLeader =
        !isPointSnap &&
        (Math.abs(pointer.x - point.x) > radius ||
            Math.abs(pointer.y - point.y) > radius);

    return (
        <>
            {showLeader && (
                <Line
                    points={[pointer.x, pointer.y, point.x, point.y]}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    dash={[6 / safeScale, 4 / safeScale]}
                    opacity={0.7}
                    listening={false}
                    strokeScaleEnabled={false}
                    perfectDrawEnabled={false}
                    data-testid={`guide.snap.leader.${describeSource(source)}`}
                />
            )}

            {isPointSnap ? (
                <Line
                    points={[
                        point.x - radius,
                        point.y - radius,
                        point.x + radius,
                        point.y - radius,
                        point.x + radius,
                        point.y + radius,
                        point.x - radius,
                        point.y + radius,
                    ]}
                    closed
                    stroke={color}
                    strokeWidth={strokeWidth}
                    listening={false}
                    strokeScaleEnabled={false}
                    perfectDrawEnabled={false}
                    data-testid={`guide.snap.marker.${describeSource(source)}`}
                />
            ) : (
                <Circle
                    x={point.x}
                    y={point.y}
                    radius={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    listening={false}
                    strokeScaleEnabled={false}
                    perfectDrawEnabled={false}
                    data-testid={`guide.snap.marker.${describeSource(source)}`}
                />
            )}
        </>
    );
});
