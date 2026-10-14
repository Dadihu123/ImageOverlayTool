# 参考标尺系统（Reference Gauge）v1 方案

- Status: Draft
- Date: 2026-10-14
- 相关代码: `src/renderer/main-window/hooks/useDimensionLineMode.ts`、`src/renderer/main-window/components/DimensionLineLayer.tsx`、`src/shared/types/DimensionLine.ts`
- 前置阅读: `docs/specs/scene-input-v1.md`

## 1. 背景与问题诊断

当前尺寸线功能实现为「任意两点线段」，实测存在以下问题。逐条对应代码根因：

| 现象 | 代码根因 |
| --- | --- |
| 很难画直 | `useDimensionLineMode.ts:60-98` 直接把 `stage.getPointerPosition()` 经 `getAbsoluteTransform().invert()` 反变换为世界坐标作为端点，**没有任何正交约束或吸附** |
| 画完只能靠两个端点调整 | `DimensionLine` 类型（`src/shared/types/DimensionLine.ts`）只有 `start`/`end`；`DimensionLineLayer.tsx:163-193` 选中后仅渲染两个 `Circle` |
| 框不住图案指定位置 | 数据模型里没有「矩形/区间」概念，只有线段，无法同时约束宽与高 |
| 无法比对两张图的比例 | 没有可复制的参考形状，没有网格对齐基准，没有比例计算 |
| 放大后线条过粗 | 所有 Konva 图形未设 `strokeScaleEnabled={false}`，线宽随 `scale` 放大 |
| 微小误触也会生成线 | `MIN_DIMENSION_LINE_DISTANCE = 2`（`src/renderer/constants.ts:13`），2px 拖动即落线 |
| 单位标签偏移不准 | `DimensionLineLayer.tsx:158` 用 `label.length * 4` 硬估算居中偏移 |

**核心结论**：真正的需求不是「测量长度」，而是**「用一个固定形状框住图案的指定部位，然后把这个形状复用到另一张图上做等比缩放」**。这是模板比对，不是测量。因此主力工具应该是**参考框（矩形）**，网格是对齐基础设施，尺寸线降级为补充工具。

## 2. 目标与非目标

### 2.1 目标

1. 提供可配置的参考网格（方格），保证落点对齐、线条天然笔直
2. 提供参考框（矩形），可拖边调整（对面固定）、可复制、可显示尺寸标签
3. 提供单条参考线（横/竖），可设定间隔、可拖拽、可批量等距生成
4. 为尺寸线增加正交约束与网格吸附
5. 支持两个参考框的比例比对，并可将比例直接应用到图像缩放
6. 参考框可绑定到图像（归一化），图像移动/缩放时框自动跟随
7. 全部参考物随项目/场景文件持久化，随窗口同步，纳入撤销重做

### 2.2 非目标（v1 不做）

- 不删除自由尺寸线（保留为可选工具，保证向后兼容）
- 不做网格的透视/仿射对齐（网格恒为轴对齐）
- 不做多选框的批量变换
- 不做参考物的分组/图层管理 UI

## 3. 术语

- **世界坐标**：Konva `Stage` 变换前的坐标系。图像锚点（`currentAnchorPos`）即存于此坐标系
- **屏幕坐标**：窗口像素坐标
- **格（cell）**：网格的最小主格
- **参考物（guide）**：网格、参考线、参考框、区间尺寸线的统称
- **绑定（linked）**：参考框通过归一化 `(u, v)` 绑定到某个图像的锚点四角，随图像变换

## 4. 数据模型

新建 `src/shared/types/Guide.ts`：

```ts
import type { Point } from "./Point";

/** 网格层级：相对图像的绘制顺序 */
export type GuideLayerPlacement = "belowImages" | "aboveImages" | "screenLocked";

export interface GridConfig {
    enabled: boolean;
    /** 主格间距（世界坐标 px）。> 0 */
    spacingX: number;
    spacingY: number;
    /** 每主格细分数，1..20。1 表示无细线 */
    subdivisions: number;
    /** 网格原点（世界坐标）。可拖拽或「对齐到当前视图」 */
    origin: Point;
    /** 是否锁定 X/Y 间距联动 */
    linkSpacing: boolean;
    color: string;      // 主线色
    minorColor: string; // 细线色
    opacity: number;    // 0..1，主/细线共用基准，细线再乘 0.5
    lineWidth: number;  // px，屏幕恒定宽
    layer: GuideLayerPlacement;
    snap: {
        gridIntersection: boolean;
        guideLines: boolean;
        guideRectEdges: boolean;
        dimensionEndpoints: boolean;
    };
}

export interface GuideLinesConfig {
    enabled: boolean;
    /** 竖线，世界 x 坐标 */
    xs: number[];
    /** 横线，世界 y 坐标 */
    ys: number[];
    color: string;
    opacity: number;
    lineWidth: number;
    layer: Exclude<GuideLayerPlacement, "screenLocked">;
}

/**
 * 参考框形状。
 * - world: 轴对齐矩形，直接存世界坐标
 * - linked: 归一化绑定到图像的锚点四角，(u,v) ∈ [0,1]
 */
export type GuideRectShape =
    | { kind: "world"; x: number; y: number; width: number; height: number }
    | {
          kind: "linked";
          imageSetId: string;
          u0: number;
          v0: number;
          u1: number;
          v1: number;
      };

export interface GuideRect {
    id: string;
    /** 用户命名，如「头」「基准」 */
    label?: string;
    color?: string;
    showSizeLabel?: boolean;
    locked?: boolean;
    shape: GuideRectShape;
}

export interface GuideConfig {
    grid: GridConfig;
    lines: GuideLinesConfig;
    rects: GuideRect[];
    /** 比例比对的基准框 id */
    baselineRectId?: string | null;
}

/** 尺寸线的正交约束（可选字段，旧数据不受影响） */
export type DimensionConstraint = "free" | "horizontal" | "vertical";
```

`src/shared/types/DimensionLine.ts` 追加可选字段：

```ts
export interface DimensionLine {
    id: string;
    start: Point;
    end: Point;
    color?: string;
    showUnitLabel?: boolean;
    constraint?: DimensionConstraint; // 新增，缺省视为 "free"
    showCellCount?: boolean;          // 新增，网格启用时显示格数
}
```

### 4.1 默认值

`src/shared/constants/guide.ts`：

```ts
export const GUIDE_GRID_SPACING_DEFAULT = 50;
export const GUIDE_GRID_SUBDIVISIONS_DEFAULT = 1;
export const GUIDE_GRID_SUBDIVISIONS_MIN = 1;
export const GUIDE_GRID_SUBDIVISIONS_MAX = 20;
export const GUIDE_GRID_SPACING_MIN = 0.01;
export const GUIDE_GRID_SPACING_MAX = 100000;
export const GUIDE_GRID_COLOR_DEFAULT = "#64748b";
export const GUIDE_GRID_MINOR_COLOR_DEFAULT = "#94a3b8";
export const GUIDE_GRID_OPACITY_DEFAULT = 0.5;
export const GUIDE_LINE_WIDTH_DEFAULT = 1;
export const GUIDE_RECT_COLOR_DEFAULT = "#22c55e";

/** 吸附半径（屏幕 px）。实际世界半径 = SNAP / stage.scale */
export const GUIDE_SNAP_SCREEN_RADIUS = 8;
/** 细线最小屏幕间距，低于则隐藏细线 */
export const GUIDE_GRID_MIN_SCREEN_SPACING = 6;
/** 整层最小屏幕间距，低于则隐藏整个网格 */
export const GUIDE_GRID_HIDE_SCREEN_SPACING = 2;
/** 网格绘制时向视口外扩展的倍率，避免平移过程中出现未绘制区域 */
export const GUIDE_GRID_DRAW_MARGIN_FACTOR = 2;

export const createDefaultGuideConfig = (): GuideConfig => ({ /* ... */ });
export const sanitizeGuideConfig = (value: unknown): GuideConfig => { /* 宽容降级 */ };
export const sanitizeDimensionConstraint = (
    value: unknown
): DimensionConstraint | undefined => { /* ... */ };
```

配色取舍：网格用中性石板灰（`#64748b` / `#94a3b8`），参考框用绿色（`#22c55e`），与既有蓝色系（尺寸线 `#2563eb`、锚点 `#4e4eff`、选中框 `#4e4eff`）在视觉上区分开。

## 5. 坐标系与变换

**决策：网格、参考线、参考框一律存世界坐标**（`linked` 参考框例外，存归一化坐标，渲染时反算为世界坐标）。

理由：`ImageStage.tsx:120-133` 的 `Stage` 已带 `x/y/scale` 变换，图像锚点也在世界坐标系中。存世界坐标意味着参考物自动跟随画布平移缩放，且与图像内容天然对齐——这是「框住图案指定位置」的前提。若锁屏幕，缩放后网格与图片的相对关系会漂移，框选必然错位。

`screenLocked` 层级仅作为网格的一个可选显示模式（做纯像素级对齐时用），不改变数据存储方式。

**变换边界约定**：所有几何/吸附工具函数只接受世界坐标；屏幕↔世界的转换只在指针入口做一次。现有 `useDimensionLineMode.ts:50-58` 的 `getStagePointerPos` 可提取为共享工具 `src/renderer/main-window/utils/stageCoords.ts`：

```ts
export const screenToWorld = (stage: Konva.Stage, p: Point): Point => { /* ... */ };
export const getVisibleWorldRect = (stage: Konva.Stage): Rect => { /* ... */ };
export const screenDistanceToWorld = (stage: Konva.Stage, px: number): number =>
    px / stage.scaleX();
```

## 6. 吸附系统

新建 `src/renderer/main-window/utils/guideSnap.ts`。这是「画得直、对得齐」的根本机制。

```ts
export type SnapTarget =
    | { kind: "gridIntersection"; point: Point }
    | { kind: "gridLine"; axis: "x" | "y"; value: number; point: Point }
    | { kind: "guideLine"; id: "x" | "y"; index: number; value: number; point: Point }
    | { kind: "rectEdge"; rectId: string; edge: "left" | "right" | "top" | "bottom"; value: number; point: Point }
    | { kind: "rectCorner"; rectId: string; corner: "lt" | "rt" | "lb" | "rb"; point: Point }
    | { kind: "dimensionEndpoint"; lineId: string; which: "start" | "end"; point: Point }
    | { kind: "none"; point: Point };

export const resolveSnap = (
    world: Point,
    ctx: SnapContext
): SnapTarget => { /* ... */ };
```

**优先级（从高到低）**：

1. 参考框的角
2. 参考框的边
3. 单条参考线
4. 网格交点
5. 尺寸线端点
6. 自由落点

**半径**：`GUIDE_SNAP_SCREEN_RADIUS / stage.scaleX()` 换算为世界距离，保证任何缩放级别下手感一致。

**反馈**：命中时在吸附点绘制高亮标记（十字/方框），并从吸附源到落点画一条虚线，让用户明确知道「吸到了什么」。这是可用性的关键，不能省。

**约束组合**：`resolveSnap` 支持轴约束参数 `{ axis: "x" | "y" | "both" }`，供正交尺寸线使用——例如 `constraint === "horizontal"` 时只在 x 方向吸附，y 锁定为起点 y。

## 7. 渲染与层级

`ImageStage.tsx` 的单个 `<Layer>` 拆为按层级排布：

```tsx
{/* 图像下方 */}
<Layer listening={false}>
    {grid.layer === "belowImages" && <GuideGridLayer ... />}
    {lines.layer === "belowImages" && <GuideLinesLayer ... />}
</Layer>

{/* 图像层（现状不变） */}
<Layer>
    {imageSets.map(...)}
    {selectedImageId && <OverlayControls ... />}
</Layer>

{/* 图像上方 */}
<Layer listening={false}>
    {grid.layer === "aboveImages" && <GuideGridLayer ... />}
    {lines.layer === "aboveImages" && <GuideLinesLayer ... />}
</Layer>

{/* 交互层（置顶） */}
<Layer>
    <DimensionLineLayer ... />
    <GuideRectLayer ... />
</Layer>
```

`screenLocked` 的网格渲染在一个**不继承 Stage 变换**的独立层中（渲染时自行减去 `canvas.x/y` 并除以 `scale`），或直接在 `GuideGridLayer` 内对 `sceneFunc` 做逆变换，二选一，实现时取更简单者。

### 7.1 网格绘制

**用单个 `Konva.Shape` + 自定义 `sceneFunc` 循环画线**，而不是几百个 `<Line>` 节点：

```tsx
const sceneFunc = useCallback((ctx: Konva.Context, shape: Konva.Shape) => {
    // 1. 视口世界矩形，向外扩展 GUIDE_GRID_DRAW_MARGIN_FACTOR 倍
    // 2. LOD 跳级：spacing *= 10^k 直到 screenSpacing >= GUIDE_GRID_MIN_SCREEN_SPACING
    // 3. screenSpacing < GUIDE_GRID_HIDE_SCREEN_SPACING → 整层不画
    // 4. 先画细线（subdivisions），再画主线
    ctx.setAttr("strokeStyle", minorColor);
    ctx.beginPath();
    // ... moveTo / lineTo
    ctx.stroke();
    // 主线同理
}, [grid, viewport, scale]);

return (
    <Shape
        sceneFunc={sceneFunc}
        listening={false}
        strokeScaleEnabled={false}
        perfectDrawEnabled={false}
    />
);
```

要点：

- **一个节点、一次绘制**，缩放平移时零 React 重渲染开销
- `strokeScaleEnabled={false}` → 屏幕恒定线宽，缩放时不会变粗
- **LOD 细节分级**：屏幕间距 < 6px 隐藏细线，< 2px 隐藏整层。因此**不需要限制用户输入的间距范围**，填 0.1px 只是看不到而已
- **重绘时机**：视口变化时重绘。`canvas` 状态在 `wheel` 与 `dragEnd` 时更新（`useStageControls.ts:44`、`useStagePointerHandlers.ts:49-61`），但**平移拖拽过程中 store 不更新**，仅靠视口范围计算会出现「拖出来的新区域没有网格」。因此需要额外：① 按 `GUIDE_GRID_DRAW_MARGIN_FACTOR` 向外多画一整个视口；② 监听 stage 的 `dragmove` 与 `wheel` 触发重绘。两者都做，冗余但稳妥

### 7.2 参考框绘制

`GuideRectLayer.tsx`：

- `world` 形状：`<Rect>` + `<Text>` 尺寸标签
- `linked` 形状：按 `(u,v)` 双线性映射出四个世界角点，用 `<Line closed>` 绘制。轴对齐图像下退化为矩形
- 选中时渲染 **4 个边控制点 + 4 个角控制点**（比现有两个端点更强）
- 尺寸标签显示三项信息：`W 320px (4.0 格) × H 240px (3.0 格)`，单位换算后追加 `= 3.2 mm`
- 标签定位用 `Text` 的 `width` + `align="center"` + `offsetX={width/2}` 做真实居中，替代 `label.length * 4` 的估算

### 7.3 尺寸线增强

`DimensionLineLayer.tsx` 修改：

- 所有 `Arrow` / `Text` 加 `strokeScaleEnabled={false}`
- 按 `constraint` 渲染：`horizontal` / `vertical` 时强制正交
- 标签居中改为真实测量
- 网格启用且 `showCellCount` 时，标签追加格数：`320 px (6.4 格) = 3.2 mm`

## 8. 交互设计

### 8.1 工具集

| 工具 | 交互模式 | 行为 |
| --- | --- | --- |
| **参考框**（主力） | `guide_rect_draw` / `guide_rect_select` | 拖拽画矩形；拖边时**对面固定**；拖角时对角固定；Shift 锁等比；边/角均吸附网格与参考线 |
| **单条参考线** | `guide_line_draw` | 从视口边缘拖出横/竖线，或面板按钮直接添加；拖拽平移；面板可改数值 |
| **区间尺寸线** | `dimension_add`（增强） | 起止点吸附格点，标签显示格数 |
| **正交尺寸线** | `dimension_add`（增强） | 新建默认 `horizontal` 或 `vertical`（由面板设定）；按住 Shift 临时切 `free` |
| **自由尺寸线** | `dimension_add`（原样保留） | 现有行为，向后兼容 |

### 8.2 参考框调整（已确认方案）

- **拖边**：该边移动，对面边固定 → 直接对应「调整宽度或高度」
- **拖角**：相邻两边同时移动，对角固定
- **Shift**：锁定宽高比
- **面板数值输入**：`NumericInput` 精确指定 X / Y / W / H（`src/renderer/components/ui/numeric-input.tsx` 已具备「编辑中不覆盖、Enter/失焦才提交」的语义，正合适）
- **锁定**：`locked: true` 时不可拖拽，避免误动基准框

### 8.3 复制与比对（核心工作流）

用户目标：让两张图的人物头部大小一致。

1. 拖一个框住图1的头 → 标签显示 `W 320px × H 240px`
2. `Ctrl+D` 或列表里的复制按钮 → 生成偏移 `+20px` 的副本，拖到图2旁
3. 缩放图2 让头刚好塞进副本框
4. 面板比对区显示：

```
基准框「头」  320.0 × 240.0 px
当前框「头 副本」 318.0 × 238.0 px
比例  W 0.994  H 0.992  平均 0.993
[ 应用到图像 ]
```

5. 点「应用到图像」→ 以框中心为基准，对绑定图像的 `currentAnchorPos` 四角等比缩放 `0.993`，一步到位

**基准框选择**：`baselineRectId`。未指定时默认取列表第一个框。选中两个框时显示两框互比。

### 8.4 参考线的等距生成

面板提供「等距生成」：输入起点、间隔、条数 → 一次生成一排参考线。用于快速铺出固定节距的比对参考。

### 8.5 图像绑定

参考框可绑定到图像（`shape.kind === "linked"`）：把世界矩形的四角用双线性反解得到 `(u, v)`，图像移动/缩放/旋转时按 `(u, v)` 正解回世界角点。

双线性映射：

```
P(u,v) = (1-u)(1-v)·lt + u(1-v)·rt + (1-u)v·lb + u·v·rb
```

反解用二维 Newton 迭代（3~5 次，初值取 `u = (x-lt.x)/(rt.x-lt.x)`），对合理四边形收敛良好。实现于 `guideGeometry.ts`，需单测覆盖旋转与梯形情形。

## 9. 设置面板

`DimensionLineSettingsPanel` 内容已较多，改为 **Tabs 分栏**，避免面板过长（当前最小高度 `560`，见 `src/shared/types/AppConfig.ts:108`）。

i18n 新增 `render.guide_settings.*`，**en / ja / zh 三份必须同时补齐**，否则 `tests/unit/i18n/translationConsistency.spec.ts` 会失败（该校验要求三语言键集完全一致、无空值、无 `t(key, fallback)` 写法）。

### Tab 1：参考网格

- 启用开关
- 主格间距 X / Y（`NumericInput`）+ 联动锁 🔗
- **输入单位切换**：px / 实际单位（按 `unitFactor` 换算）
- 细分数（1..20）
- 原点 X / Y + 「对齐到当前视图」按钮
- 主线色 / 细线色 / 透明度 / 线宽
- **层级**下拉：图像下方 / 图像上方 / 锁定屏幕
- 吸附开关：网格交点 / 参考线 / 参考框边 / 尺寸线端点

### Tab 2：参考线

- 启用开关、颜色、透明度、线宽、层级
- 竖线列表 / 横线列表（数值可编辑、可删除）
- 「添加竖线」「添加横线」
- 「等距生成」：起点 + 间隔 + 条数

### Tab 3：参考框

- 「绘制参考框」按钮（进入 `guide_rect_draw`）
- 框列表：名称、`W × H`、颜色、绑定图像、锁定、复制、删除
- 「显示尺寸标签」开关
- 基准框选择
- 比对区（§8.3）

### Tab 4：尺寸线（现有 + 增强）

- 现有全部内容
- 新增：默认正交约束、吸附开关、格数显示开关

## 10. 持久化 / 同步 / 撤销

### 10.1 文件格式

`ProjectFile` 追加可选字段：

```ts
export interface ProjectFile<TImage = unknown> {
    // ... 现有字段不变
    dimensionLines?: { /* 追加 constraint?, showCellCount? */ }[];
    guides?: GuideConfig; // 新增
}
```

`SceneFile` / `ResolvedSceneFile` / `LaunchIntent` 同样追加 `guides?: GuideConfig`。

**版本号保持 `"1.0.0"`**：新字段全部可选，旧文件加载后 `guides` 为 `undefined` → 回落默认；旧版本程序读取新文件时，`projectSchema` 只读取已知字段，未知字段被静默忽略。两个方向都不破坏，因此无需升版本（`projectSchema.ts:248` 的 `assertSupportedVersion` 只接受 `"1.0.0"`，升版本反而会破坏旧文件兼容）。

### 10.2 Schema 解析策略

`projectSchema.ts` 新增 `normalizeGuides`，`sceneSchema.ts` 新增 `parseGuides`。

**推荐：结构严格、取值宽容。** 即 `guides` 必须是对象、`grid` 必须是对象、`rects` 必须是数组；但单个数值非法时回落默认值并记录警告，**不抛错**。

理由：场景文件的现有策略是「任一项非法 → 整个 Scene 视为非法 → 回退普通启动」（`docs/specs/scene-input-v1.md` §8）。对一个纯显示辅助功能而言，让一个写错的网格间距导致整个场景加载失败，代价过高。

### 10.3 IPC 同步

按现有 `dimensionLines` 的完整链路对称新增 `guides`：

1. `src/shared/ipc/channels.ts` — `IPC_CHANNELS.sync.updateGuides`、`IPC_EVENTS.guidesUpdated`
2. `src/shared/ipc/contracts/sync.ts` — `updateGuides` invoke 契约、`guidesUpdated` event 契约
3. `src/main/ipc/imageSettingsWindow/syncHandlers.ts` — 注册广播处理器
4. `src/preload/ipc/sync.ts` — 暴露 `updateGuides` / `onGuidesUpdated`
5. `src/renderer/services/ipc/sync.ts` — 渲染侧封装
6. `src/shared/ipc/electronApi.ts` — 类型声明
7. `src/renderer/services/sync/syncBroadcaster.ts` — `ProjectSyncSnapshot` 加 `guides`，`broadcastDiff` / `broadcastSnapshot` 各加一支
8. `src/renderer/hooks/useBroadcastProjectData.ts` — 订阅 `guides`
9. `src/renderer/hooks/useReceiveProjectData.ts` — 接收并调用 `receiveGuides`

**新增 UI 选择态**（与现有 `selectedDimensionLineId` 对称）：`selectedGuideRectId`、`selectedGuideLineRef`。按现有约定，选择态**不进撤销历史**，但**要跨窗口同步**（见 `syncBroadcaster.ts:77-90` 的②区块）。

### 10.4 撤销重做

`src/renderer/store/useAppStore.ts`：

- `UndoSnapshot`（:32-40）加入 `guides`
- `isSameUndoSnapshot`（:55-67）加入 `guides` 比较
- `partialize`（:129-146）加入 `guides`

绘制过程中的临时草稿（draft rect / draft line）不进历史，仅在提交时 `setProjectDataWithOrigin("local", ...)`，与现有尺寸线的做法一致（`useDimensionLineMode.ts:100-122`）。

### 10.5 Store 层改动

- `src/renderer/store/slices/projectDataSliceTypes.ts` — `ProjectDataSlice` 加 `guides` 及 4 个 action；`ProjectDataMutableFields` 加 `guides`
- 新建 `src/renderer/store/slices/projectDataGuideActions.ts` — `setGuides` / `receiveGuides` / `updateGuideConfig`（网格、参考线、参考框的局部更新）
- `src/renderer/store/slices/createProjectDataSlice.ts` — 注册新 action 组、默认 `guides`
- `src/renderer/store/slices/projectDataBulkActions.ts` — `loadProjectData` / `resetProjectData` 处理 `guides`
- `src/renderer/store/selectors/projectSelectors.ts` — 新增 `selectGuides` 等
- `src/renderer/store/slices/createInteractionSlice.ts` — 新增选择态与清理逻辑

### 10.6 交互模式重构（**重要风险点**）

当前定义（`src/shared/types/InteractionMode.ts`）：

```ts
export type InteractionMode = "default" | "dimension_add" | "dimension_select";
export const isDimensionInteractionMode = (mode: InteractionMode): boolean =>
    mode !== "default";   // ← 问题所在
```

`useDimensionLineMode.ts:39` 用 `isDimensionInteractionMode(interactionMode)` 得到 `isDimensionMode`，再传给 `useStagePointerHandlers`，后者（:34-36）把布尔值**压回** `"dimension_select" | "default"`。

如果直接往 union 里加 `guide_rect_draw`，`isDimensionInteractionMode` 会返回 `true`，导致：

- 参考框绘制模式下指针策略被当成 `dimension_select`
- 左键不再触发 `stage_pan`，画布无法平移
- `dimension_add` 的分支逻辑被误触发

**必须同步重构**：

```ts
export type InteractionMode =
    | "default"
    | "dimension_add"
    | "dimension_select"
    | "guide_rect_draw"
    | "guide_rect_select"
    | "guide_line_draw"
    | "guide_line_select";

export const isDimensionInteractionMode = (mode: InteractionMode): boolean =>
    mode === "dimension_add" || mode === "dimension_select";

export const isGuideInteractionMode = (mode: InteractionMode): boolean =>
    mode === "guide_rect_draw" ||
    mode === "guide_rect_select" ||
    mode === "guide_line_draw" ||
    mode === "guide_line_select";

export const isToolInteractionMode = (mode: InteractionMode): boolean =>
    isDimensionInteractionMode(mode) || isGuideInteractionMode(mode);
```

配套：

- `useStagePointerHandlers.ts` 改为接收**真实 `InteractionMode`**，不再接收布尔值（消除有损压缩）
- `pointerSessionMachine.ts` 的 `resolveSessionOnMouseDown` / `resolvePointerPolicy` 按新模式扩展；`PointerSession` 的 `"dimension_interaction"` 更名为 `"tool_interaction"`
- `createInteractionSlice.ts:22-43` 的 `setInteractionMode` 分支补齐新模式的选择态清理
- `src/main/windows/windowManager.ts:119` 的 `resetDimensionInteractionState` 扩展为重置全部工具模式
- `useDimensionKeyboard.ts` 扩展支持删除选中的参考框/参考线，并补上**输入框聚焦时忽略 Delete/Backspace** 的保护（现有实现缺失，属潜在缺陷）

## 11. 导出行为

`useStageExport.ts` 两条导出路径都需临时隐藏参考物：

- `includeBackground === true`：走 `ipcService.captureWindow()` 截取整个窗口，网格会被一并截入
- `includeBackground === false`：走 `stage.toDataURL()`，会渲染所有可见 Layer

实现：导出前把所有参考物 Layer 设 `visible(false)`，导出后恢复。与现有 `setUIHidden(true)` + `setTimeout(500)` 的时序合并处理，避免多段等待。

## 12. 实施阶段

每阶段独立可用、独立可回退。

### P1：网格 + 吸附（解决「画不直、对不齐」）

- `src/shared/types/Guide.ts`、`src/shared/constants/guide.ts`（含 `sanitizeGuideConfig`）
- `src/renderer/main-window/utils/stageCoords.ts`（提取坐标工具）
- `src/renderer/main-window/utils/guideGeometry.ts`（可见范围、格线枚举、格数计算）
- `src/renderer/main-window/utils/guideSnap.ts`
- `src/renderer/main-window/components/GuideGridLayer.tsx`（含 LOD）
- `ImageStage.tsx` 分层改造
- Store：`guides` 字段 + `setGuides` / `updateGuideConfig` + selectors
- 面板 Tab 1 + i18n 三语言
- 尺寸线：正交约束 + 网格吸附 + `strokeScaleEnabled`

### P2：参考框（解决「框不住、难调整」，核心比对能力到位）

- `GuideRectLayer.tsx`（绘制、拖边对面固定、拖角对角固定、Shift 等比）
- 复制（`Ctrl+D`）、锁定、尺寸标签
- 面板 Tab 3（列表 + 数值输入）
- `InteractionMode` 重构（§10.6）

### P3：参考线 + 比对工作流

- `GuideLinesLayer.tsx`、单条参考线拖拽、等距生成
- 面板 Tab 2
- 归一化绑定（`linked`）+ 双线性反解
- 双框比例比对 + 「应用到图像」等比缩放

### P4：持久化与集成

- `ProjectFile` / `SceneFile` / `LaunchIntent` 加 `guides`
- `projectSchema.ts` / `sceneSchema.ts` / `cliSceneTemplate.ts` 解析
- IPC 全链路 9 处改动
- 撤销重做快照
- 导出自动隐藏
- `buildProjectFile.ts` / `useProjectOperations.ts` / `sceneFileApplicator.ts` / `launchIntent.ts` 透传

## 13. 测试清单

| 文件 | 覆盖内容 |
| --- | --- |
| `tests/unit/renderer/main-window/utils/guideGeometry.spec.ts` | 可见范围计算、LOD 跳级与阈值、格数计算、双线性正解/反解（含旋转、梯形） |
| `tests/unit/renderer/main-window/utils/guideSnap.spec.ts` | 优先级顺序、屏幕半径→世界半径换算、轴约束下的单向吸附 |
| `tests/unit/renderer/main-window/utils/stageCoords.spec.ts` | 屏幕↔世界往返一致性 |
| `tests/unit/renderer/main-window/components/GuideGridLayer.spec.tsx` | 关闭时不渲染；LOD 阈值下不绘制细线 |
| `tests/unit/renderer/main-window/components/GuideRectLayer.spec.tsx` | 拖边对面固定、拖角对角固定、Shift 等比 |
| `tests/unit/main/repositories/projectSchema.spec.ts` | `guides` 缺失 → 默认；合法值保留；非法值降级不抛错 |
| `tests/unit/main/repositories/sceneSchema.spec.ts` | 同上 |
| `tests/unit/renderer/store/useAppStore.spec.ts` | `guides` 纳入撤销重做；选择态不进历史 |
| `tests/unit/renderer/main-window/hooks/pointerSessionMachine.spec.ts` | 新模式的指针策略（重点：`guide_rect_draw` 下左键不触发 stage_pan） |
| `tests/unit/i18n/translationConsistency.spec.ts` | 自动覆盖新 key（三语言齐全） |

**手动验收**：

1. 旧项目文件 / 旧 Scene 文件加载不报错
2. 导出图片（两条路径）不含网格与参考线
3. 缩放 10% 与 1000% 下线条宽度视觉恒定
4. 网格间距设为 0.1px 时不卡顿、不糊成一片
5. 平移拖拽过程中新露出区域有网格（验证 §7.1 的重绘时机处理）
6. 参考框绘制模式下左键拖拽画框、中/右键平移画布均正常

## 14. 风险与取舍

| 风险 | 应对 |
| --- | --- |
| 世界/屏幕坐标混用（最易出 bug） | 几何函数只接受世界坐标；转换仅在指针入口与渲染出口各做一次；`stageCoords.ts` 统一封装并单测 |
| `isDimensionInteractionMode` 的 `!== "default"` 语义导致新模式被误判 | §10.6 强制重构，且新增 `pointerSessionMachine` 单测锁定行为 |
| 平移过程中网格出现未绘制区域 | 视口外扩 `GUIDE_GRID_DRAW_MARGIN_FACTOR` + 监听 `dragmove`/`wheel` 重绘 |
| 网格过密导致卡顿 | LOD 自动跳级 + 整层隐藏；间距输入不设上下限，靠显示层兜住 |
| 「自由」能力丢失 | 自由尺寸线保留为可选工具，不作为默认 |
| 矩形 vs 双端点 | 拖边对面固定语义等价于「两端点独立调」，但更符合直觉；面板数值输入保证精确指定 |
| 双线性反解在极端梯形下发散 | 迭代次数上限 + 收敛失败时回落到轴对齐包围盒 |
| 面板过长 | 改为 Tabs 分栏 |
| 三语言 i18n 遗漏 | `translationConsistency.spec.ts` 自动拦截 |

## 15. 后续可扩展（v1 之外）

- 参考框作为图像缩放的对齐目标（拖拽图像角点时吸附到框边）
- 多个参考框组成模板集，随项目保存复用
- 网格按实际单位（nm/um/mm）直接指定间距，而非 px 换算
- 参考物的分组与显隐开关
- 沿参考框边缘自动生成尺寸线
