import { useCallback, useLayoutEffect, useState } from "react";
import type { i18n as I18nType } from "i18next";

import { useIpcService } from "../../../providers/IpcServiceProvider";
import {
    LANGUAGE_LABELS,
    normalizeLanguage,
    SUPPORTED_LANGUAGES,
} from "../../../../i18n/languages";

export { LANGUAGE_LABELS, normalizeLanguage, SUPPORTED_LANGUAGES };

export const LOG_LEVELS = ["error", "warn", "info", "debug", "silly"];

interface UseSettingDialogStateParams {
    onClose: () => void;
    i18n: I18nType;
}

export const useSettingDialogState = ({
    onClose,
    i18n,
}: UseSettingDialogStateParams) => {
    const ipcService = useIpcService();
    const [logLevel, setLogLevel] = useState("info");

    const changeLanguage = useCallback(
        (value: string) => {
            void i18n.changeLanguage(normalizeLanguage(value));
        },
        [i18n]
    );

    const persistSettings = useCallback(async () => {
        await ipcService.saveSetting({
            language: normalizeLanguage(i18n.language),
            logLevel,
        });
    }, [i18n.language, ipcService, logLevel]);

    const persistAndClose = useCallback(async () => {
        await persistSettings();
        onClose();
    }, [onClose, persistSettings]);

    const exportSettings = useCallback(async () => {
        // Export must include currently edited values in this dialog.
        await persistSettings();
        await ipcService.exportSettings();
    }, [ipcService, persistSettings]);

    const importSettings = useCallback(async () => {
        const imported = await ipcService.importSettings();
        if (!imported) {
            return;
        }

        if (imported.language) {
            void i18n.changeLanguage(normalizeLanguage(imported.language));
        }
        if (imported.logLevel) {
            setLogLevel(imported.logLevel);
        }
    }, [i18n, ipcService]);

    useLayoutEffect(() => {
        const loadSetting = async () => {
            const setting = await ipcService.loadSetting();
            void i18n.changeLanguage(normalizeLanguage(setting.language));
            if (setting.logLevel) {
                setLogLevel(setting.logLevel);
            }
        };

        void loadSetting();
    }, [i18n, ipcService]);

    return {
        logLevel,
        setLogLevel,
        changeLanguage,
        persistAndClose,
        exportSettings,
        importSettings,
    };
};
