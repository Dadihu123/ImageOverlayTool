import * as React from "react";

import { cn } from "@/renderer/utils/cn";

export interface TabItem {
    id: string;
    label: string;
    testId?: string;
}

interface TabStripProps {
    items: TabItem[];
    value: string;
    onValueChange: (id: string) => void;
    testIdPrefix: string;
}

/**
 * 依存を増やさないための最小限のタブ。
 * パネルが縦に長くなりすぎるのを避けるために使う。
 */
export function TabStrip({
    items,
    value,
    onValueChange,
    testIdPrefix,
}: TabStripProps) {
    return (
        <div
            className="flex flex-wrap gap-1 rounded-lg border p-1"
            role="tablist"
            data-testid={`${testIdPrefix}.tablist`}
        >
            {items.map((item) => {
                const selected = item.id === value;
                return (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onValueChange(item.id)}
                        className={cn(
                            "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                            selected
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        data-testid={
                            item.testId ?? `${testIdPrefix}.tab.${item.id}`
                        }
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}

interface TabPanelProps {
    active: boolean;
    children: React.ReactNode;
    testId: string;
}

export function TabPanel({ active, children, testId }: TabPanelProps) {
    if (!active) {
        return null;
    }
    return (
        <div role="tabpanel" className="grid gap-4" data-testid={testId}>
            {children}
        </div>
    );
}
