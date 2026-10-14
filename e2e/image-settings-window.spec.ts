import { test, expect } from "@playwright/test";
import {
    applyFixtureScene,
    clickAppMenuItem,
    launchE2EApp,
    openImageSettingsWindow,
} from "./helpers/electronHarness";

test("image settings window supports stable UI controls", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "default.scene.json");

        const settingsWindowPromise = app.waitForEvent("window");
        await clickAppMenuItem(page, "main.menu.item.open-image-settings");
        const settingsPage = await settingsWindowPromise;

        await settingsPage.getByTestId("settings.app.root").waitFor({
            state: "visible",
        });
        await expect.poll(() => app.windows().length).toBe(2);

        const cards = settingsPage.getByTestId("settings.image-item.card");
        const beforeCount = await cards.count();

        await settingsPage.getByTestId("settings.image-list.add").click();
        await expect(cards).toHaveCount(beforeCount + 1);

        await settingsPage.getByTestId("settings.menu.close").click();
        await clickAppMenuItem(page, "main.menu.item.open-image-settings");
        await settingsPage.getByTestId("settings.menu.bar").waitFor({
            state: "visible",
        });
    } finally {
        await app.close();
    }
});

test("image settings accepts exact values from numeric inputs", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "scene02-image-settings.scene.json");
        const settingsPage = await openImageSettingsWindow(app, page);

        // 透過度: スライダーを残したまま厳密な % を入力できる
        const transparencyInput = settingsPage
            .getByTestId("settings.image-item.transparency.input")
            .first();
        await expect(transparencyInput).toBeVisible();
        await transparencyInput.fill("42.5");
        await transparencyInput.press("Enter");
        await expect(transparencyInput).toHaveValue("42.5");

        // 拡大/縮小: 小数を含む厳密な % を入力できる
        const scaleInput = settingsPage
            .getByTestId("settings.image-item.scale.input")
            .first();
        await expect(scaleInput).toBeVisible();
        await scaleInput.fill("133.75");
        await scaleInput.press("Enter");
        await expect(scaleInput).toHaveValue("133.75");

        // 回転: 負の角度も入力できる
        const rotationInput = settingsPage
            .getByTestId("settings.image-item.rotation.input")
            .first();
        await expect(rotationInput).toBeVisible();
        await rotationInput.fill("-37.5");
        await rotationInput.press("Enter");
        await expect(rotationInput).toHaveValue("-37.5");

        // 範囲外は許容範囲へ丸め込まれる
        await scaleInput.fill("900");
        await scaleInput.press("Enter");
        await expect(scaleInput).toHaveValue("500");

        // Esc で取り消すと元の値に戻る
        await rotationInput.fill("90");
        await rotationInput.press("Escape");
        await expect(rotationInput).toHaveValue("-37.5");
    } finally {
        await app.close();
    }
});
