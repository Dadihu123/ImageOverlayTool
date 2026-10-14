/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DimensionLineSettingsPanel } from "@/renderer/dimension-settings/components/DimensionLineSettingsPanel";
import { IpcServiceProvider } from "@/renderer/providers/IpcServiceProvider";
import { useAppStore } from "@/renderer/store/useAppStore";
import { MockIPCService } from "../../../support/mocks/MockIPCService";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, params?: { index?: number }) =>
            params?.index ? `${key} ${params.index}` : key,
    }),
}));

describe("DimensionLineSettingsPanel", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
    });

    const renderPanel = () =>
        render(
            <IpcServiceProvider service={new MockIPCService()}>
                <DimensionLineSettingsPanel />
            </IpcServiceProvider>
        );

    it("controls dimension settings in dedicated window panel", () => {
        useAppStore.getState().addDimensionLine({
            id: "line-1",
            start: { x: 0, y: 0 },
            end: { x: 100, y: 0 },
        });

        renderPanel();

        // 寸法線まわりは「寸法線」タブにまとまっている
        fireEvent.click(
            screen.getByTestId("dimension-settings.guide.tab.dimension")
        );

        expect(
            screen.getByTestId("dimension-settings.mode.add-button")
        ).toBeTruthy();
        expect(
            screen.getByTestId("dimension-settings.unit.factor-input")
        ).toBeTruthy();
        expect(screen.getByTestId("dimension-settings.unit.select")).toBeTruthy();

        fireEvent.click(screen.getByTestId("dimension-settings.mode.add-button"));
        expect(useAppStore.getState().interactionMode).toBe("dimension_add");

        fireEvent.click(screen.getByTestId("dimension-settings.line.0"));
        expect(useAppStore.getState().interactionMode).toBe("dimension_select");
        expect(useAppStore.getState().selectedDimensionLineId).toBe("line-1");

        fireEvent.click(screen.getByTestId("dimension-settings.mode.done-button"));
        expect(useAppStore.getState().interactionMode).toBe("default");
        expect(useAppStore.getState().selectedDimensionLineId).toBeNull();

        fireEvent.change(
            screen.getByTestId("dimension-settings.unit.factor-input"),
            {
                target: { value: "2" },
            }
        );
        expect(useAppStore.getState().unitFactor).toBe(2);

        fireEvent.change(screen.getByTestId("dimension-settings.line.0.color"), {
            target: { value: "#ff0000" },
        });
        expect(useAppStore.getState().dimensionLines[0].color).toBe("#ff0000");

        fireEvent.click(
            screen.getByTestId("dimension-settings.line.0.show-unit-switch")
        );
        expect(useAppStore.getState().dimensionLines[0].showUnitLabel).toBe(
            false
        );

        fireEvent.click(
            screen.getByTestId("dimension-settings.line.0.delete")
        );
        expect(useAppStore.getState().dimensionLines).toHaveLength(0);
    });

    it("edits the reference grid configuration", () => {
        renderPanel();

        // 既定はグリッドタブ
        expect(
            screen.getByTestId("dimension-settings.guide.panel.grid")
        ).toBeTruthy();

        fireEvent.click(
            screen.getByTestId("dimension-settings.guide.grid.enabled")
        );
        expect(useAppStore.getState().guides.grid.enabled).toBe(true);

        // 連動が有効なときは X の変更が Y にも伝わる
        fireEvent.change(
            screen.getByTestId("dimension-settings.guide.grid.spacing-x"),
            { target: { value: "120" } }
        );
        expect(useAppStore.getState().guides.grid.spacingX).toBe(120);
        expect(useAppStore.getState().guides.grid.spacingY).toBe(120);

        fireEvent.click(
            screen.getByTestId("dimension-settings.guide.grid.link-spacing")
        );
        expect(useAppStore.getState().guides.grid.linkSpacing).toBe(false);

        fireEvent.change(
            screen.getByTestId("dimension-settings.guide.grid.spacing-y"),
            { target: { value: "40" } }
        );
        expect(useAppStore.getState().guides.grid.spacingY).toBe(40);
        expect(useAppStore.getState().guides.grid.spacingX).toBe(120);

        fireEvent.change(
            screen.getByTestId("dimension-settings.guide.grid.subdivisions"),
            { target: { value: "4" } }
        );
        expect(useAppStore.getState().guides.grid.subdivisions).toBe(4);

        fireEvent.click(
            screen.getByTestId("dimension-settings.guide.grid.snap.grid")
        );
        expect(useAppStore.getState().guides.grid.snap.gridIntersection).toBe(
            false
        );
    });

    it("aligns the grid origin to the current view", () => {
        useAppStore
            .getState()
            .setCanvasState({ x: -100, y: -50, scale: 2 });

        renderPanel();

        fireEvent.click(
            screen.getByTestId("dimension-settings.guide.grid.align-origin")
        );

        expect(useAppStore.getState().guides.grid.origin).toEqual({
            x: 50,
            y: 25,
        });
    });

    it("changes the default dimension constraint", () => {
        renderPanel();

        fireEvent.click(
            screen.getByTestId("dimension-settings.guide.tab.dimension")
        );

        expect(useAppStore.getState().guides.dimension.defaultConstraint).toBe(
            "free"
        );

        fireEvent.click(
            screen.getByTestId("dimension-settings.guide.dimension.show-cell-count")
        );
        expect(useAppStore.getState().guides.dimension.showCellCount).toBe(false);
    });
});
