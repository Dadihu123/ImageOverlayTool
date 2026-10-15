/**
 * @vitest-environment happy-dom
 *
 * 参考标尺機能の新規キーが、実際に各言語で解決されることを確認する。
 * （キーが存在するだけでなく、UI に出る文字列が本当に中国語になっているか）
 */
import { describe, expect, it } from "vitest";
import i18n from "@/i18n/configs";
import { SUPPORTED_LANGUAGES } from "@/i18n/languages";

/** 参考标尺機能で追加したキーの代表例 */
const GUIDE_KEYS = [
    "render.guide_settings.tab.grid",
    "render.guide_settings.tab.rect",
    "render.guide_settings.tab.lines",
    "render.guide_settings.tab.dimension",
    "render.guide_settings.grid.title",
    "render.guide_settings.grid.align_to_view",
    "render.guide_settings.grid.layer_option.screen_locked",
    "render.guide_settings.grid.snap.grid_intersection",
    "render.guide_settings.rect.draw_button",
    "render.guide_settings.rect.link_helper",
    "render.guide_settings.lines.generate_title",
    "render.guide_settings.lines.edit_start",
    "render.guide_settings.compare.apply",
    "render.guide_settings.compare.apply_hint",
    "render.guide_settings.dimension.default_constraint",
    "render.guide_settings.dimension.constraint_option.horizontal",
] as const;

const CJK_PATTERN = /[\u4e00-\u9fff]/;

describe("guide feature translations resolve at runtime", () => {
    it("returns non-missing, non-empty values for every locale", async () => {
        for (const lang of SUPPORTED_LANGUAGES) {
            await i18n.changeLanguage(lang);
            for (const key of GUIDE_KEYS) {
                const value = i18n.t(key);
                // parseMissingKeyHandler は "[missing] ..." を返す
                expect(value, `${lang}:${key}`).not.toContain("[missing]");
                expect(value.trim(), `${lang}:${key}`).not.toBe("");
                expect(value, `${lang}:${key}`).not.toBe(key);
            }
        }
    });

    it("renders Chinese (CJK) for the zh locale", async () => {
        await i18n.changeLanguage("zh");
        for (const key of GUIDE_KEYS) {
            expect(i18n.t(key), key).toMatch(CJK_PATTERN);
        }
    });

    it("interpolates the rect name placeholder in every locale", async () => {
        for (const lang of SUPPORTED_LANGUAGES) {
            await i18n.changeLanguage(lang);
            const value = i18n.t("render.guide_settings.rect.name", {
                index: 3,
            });
            expect(value, lang).toContain("3");
            expect(value, lang).not.toContain("{{");
        }
    });

    it("keeps zh distinct from en for user-visible labels", async () => {
        await i18n.changeLanguage("en");
        const en = i18n.t("render.guide_settings.grid.title");
        await i18n.changeLanguage("zh");
        const zh = i18n.t("render.guide_settings.grid.title");

        expect(en).not.toBe(zh);
        expect(en).toBe("Reference Grid");
        expect(zh).toBe("参考网格");
    });
});
