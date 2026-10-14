/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { FilterControl } from "@/renderer/image-settings/components/FilterControl";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/components/ui/button", () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/renderer/components/ui/popover", () => ({
    Popover: ({ children }: any) => <div>{children}</div>,
    PopoverTrigger: ({ children }: any) => <div>{children}</div>,
    PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/renderer/components/ui/label", () => ({
    Label: ({ children, htmlFor, className }: any) => (
        <label htmlFor={htmlFor} className={className}>
            {children}
        </label>
    ),
}));

vi.mock("@/renderer/components/ui/switch", () => ({
    Switch: ({ id, checked, onCheckedChange }: any) => (
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(event) => onCheckedChange(event.target.checked)}
        />
    ),
}));

vi.mock("@/renderer/components/ui/slider", () => ({
    Slider: ({ min, max, step, value, onValueChange, ...props }: any) => (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value?.[0] ?? 0}
            onChange={(event) => onValueChange([Number(event.target.value)])}
            {...props}
        />
    ),
}));

vi.mock("@/renderer/components/ui/numeric-input", () => ({
    NumericInput: ({ value, min, max, onCommit, ...props }: any) => (
        <input
            type="text"
            data-min={min}
            data-max={max}
            value={value}
            onChange={(event) => onCommit(Number(event.target.value))}
            {...props}
        />
    ),
}));

const enabledFilters = {
    binarization: { enabled: true, threshold: 128 },
    hsv: { enabled: true, h: 10, s: 20, v: 30 },
};

describe("FilterControl", () => {
    it("uses safe defaults and toggles binarization", () => {
        const onFilterChange = vi.fn();

        render(<FilterControl filters={undefined} onFilterChange={onFilterChange} />);

        fireEvent.click(screen.getByLabelText("render.image_settings.binarization"));

        expect(onFilterChange).toHaveBeenCalledWith({
            binarization: { enabled: true, threshold: 128 },
        });
    });

    it("updates threshold and HSV values from sliders", () => {
        const onFilterChange = vi.fn();
        render(
            <FilterControl
                filters={enabledFilters}
                onFilterChange={onFilterChange}
            />
        );

        const sliders = screen.getAllByRole("slider");
        fireEvent.change(sliders[0], { target: { value: "200" } });
        fireEvent.change(sliders[1], { target: { value: "30" } });
        fireEvent.change(sliders[2], { target: { value: "40" } });
        fireEvent.change(sliders[3], { target: { value: "50" } });

        expect(onFilterChange).toHaveBeenNthCalledWith(1, {
            binarization: { enabled: true, threshold: 200 },
            hsv: { enabled: true, h: 10, s: 20, v: 30 },
        });
        expect(onFilterChange).toHaveBeenNthCalledWith(2, {
            binarization: { enabled: true, threshold: 128 },
            hsv: { enabled: true, h: 30, s: 20, v: 30 },
        });
        expect(onFilterChange).toHaveBeenNthCalledWith(3, {
            binarization: { enabled: true, threshold: 128 },
            hsv: { enabled: true, h: 10, s: 40, v: 30 },
        });
        expect(onFilterChange).toHaveBeenNthCalledWith(4, {
            binarization: { enabled: true, threshold: 128 },
            hsv: { enabled: true, h: 10, s: 20, v: 50 },
        });
    });

    it("accepts exact values from the numeric inputs", () => {
        const onFilterChange = vi.fn();
        render(
            <FilterControl
                filters={enabledFilters}
                onFilterChange={onFilterChange}
            />
        );

        fireEvent.change(
            screen.getByTestId("settings.filters.binarization.threshold.input"),
            { target: { value: "77" } }
        );
        expect(onFilterChange).toHaveBeenLastCalledWith({
            binarization: { enabled: true, threshold: 77 },
            hsv: { enabled: true, h: 10, s: 20, v: 30 },
        });

        fireEvent.change(screen.getByTestId("settings.filters.hsv.h.input"), {
            target: { value: "-45" },
        });
        expect(onFilterChange).toHaveBeenLastCalledWith({
            binarization: { enabled: true, threshold: 128 },
            hsv: { enabled: true, h: -45, s: 20, v: 30 },
        });

        fireEvent.change(screen.getByTestId("settings.filters.hsv.s.input"), {
            target: { value: "-100" },
        });
        expect(onFilterChange).toHaveBeenLastCalledWith({
            binarization: { enabled: true, threshold: 128 },
            hsv: { enabled: true, h: 10, s: -100, v: 30 },
        });

        fireEvent.change(screen.getByTestId("settings.filters.hsv.v.input"), {
            target: { value: "100" },
        });
        expect(onFilterChange).toHaveBeenLastCalledWith({
            binarization: { enabled: true, threshold: 128 },
            hsv: { enabled: true, h: 10, s: 20, v: 100 },
        });
    });
});
