import { Button } from "@/renderer/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/renderer/components/ui/select";
import { Label } from "@/renderer/components/ui/label";
import type { GuideRect } from "@/shared/types/Guide";
import type { WorldRect } from "@/renderer/main-window/utils/stageCoords";
import { computeSizeRatio } from "@/renderer/main-window/utils/guideGeometry";

interface RectItem {
    rect: GuideRect;
    world: WorldRect | null;
}

interface DimensionGuideCompareSectionProps {
    rects: RectItem[];
    baselineRectId: string | null;
    selectedRectId: string | null;
    onSetBaseline: (id: string | null) => void;
    onApplyRatio: (factor: number, origin?: { x: number; y: number }) => void;
    /** 比率を適用できる画像が選択されているか */
    canApplyToImage: boolean;
    t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * 参考枠どうしの比率比較。
 *
 * 2 つの枠を重ねられない画像でも、寸法比を数値で出せば
 * 同じ見た目スケールへ揃えられる。
 */
export function DimensionGuideCompareSection({
    rects,
    baselineRectId,
    selectedRectId,
    onSetBaseline,
    onApplyRatio,
    canApplyToImage,
    t,
}: DimensionGuideCompareSectionProps) {
    const resolvable = rects.filter(
        (item): item is { rect: GuideRect; world: WorldRect } =>
            item.world !== null
    );

    const baseline =
        resolvable.find((item) => item.rect.id === baselineRectId) ?? null;
    const current =
        resolvable.find((item) => item.rect.id === selectedRectId) ?? null;

    const ratio =
        baseline && current && baseline.rect.id !== current.rect.id
            ? computeSizeRatio(current.world, baseline.world)
            : null;

    return (
        <div className="grid gap-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
                {t("render.guide_settings.compare.title")}
            </p>

            <div className="grid gap-1.5">
                <Label className="text-xs">
                    {t("render.guide_settings.compare.baseline")}
                </Label>
                <Select
                    value={baselineRectId ?? "__none__"}
                    onValueChange={(value) =>
                        onSetBaseline(value === "__none__" ? null : value)
                    }
                >
                    <SelectTrigger
                        className="w-full"
                        data-testid="dimension-settings.guide.compare.baseline"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            value="__none__"
                            data-testid="dimension-settings.guide.compare.baseline.none"
                        >
                            {t("render.guide_settings.compare.baseline_none")}
                        </SelectItem>
                        {resolvable.map((item, index) => (
                            <SelectItem
                                key={item.rect.id}
                                value={item.rect.id}
                                data-testid={`dimension-settings.guide.compare.baseline.${index}`}
                            >
                                {item.rect.label ||
                                    t("render.guide_settings.rect.name", {
                                        index: index + 1,
                                    })}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {!baseline || !current || !ratio ? (
                <p
                    className="text-xs text-muted-foreground"
                    data-testid="dimension-settings.guide.compare.hint"
                >
                    {t("render.guide_settings.compare.hint")}
                </p>
            ) : (
                <div className="grid gap-2">
                    <div
                        className="grid gap-1 rounded-md border p-2 text-xs tabular-nums"
                        data-testid="dimension-settings.guide.compare.result"
                    >
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                {t("render.guide_settings.compare.width")}
                            </span>
                            <span data-testid="dimension-settings.guide.compare.width-ratio">
                                {ratio.width.toFixed(4)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                {t("render.guide_settings.compare.height")}
                            </span>
                            <span data-testid="dimension-settings.guide.compare.height-ratio">
                                {ratio.height.toFixed(4)}
                            </span>
                        </div>
                        <div className="flex justify-between font-medium">
                            <span className="text-muted-foreground">
                                {t("render.guide_settings.compare.average")}
                            </span>
                            <span data-testid="dimension-settings.guide.compare.average-ratio">
                                {ratio.average.toFixed(4)}
                            </span>
                        </div>
                    </div>

                    <Button
                        size="sm"
                        disabled={!canApplyToImage}
                        onClick={() => {
                            // 枠の中心を基準に拡大縮小すると、位置がずれにくい
                            const origin = {
                                x: current.world.x + current.world.width / 2,
                                y: current.world.y + current.world.height / 2,
                            };
                            onApplyRatio(ratio.average, origin);
                        }}
                        data-testid="dimension-settings.guide.compare.apply"
                    >
                        {t("render.guide_settings.compare.apply")}
                    </Button>

                    {!canApplyToImage && (
                        <p className="text-xs text-muted-foreground">
                            {t("render.guide_settings.compare.apply_hint")}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
