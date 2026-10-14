import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/renderer/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/renderer/components/ui/select";
import { Button } from "@/renderer/components/ui/button";
import { Label } from "@/renderer/components/ui/label";
import {
    LANGUAGE_LABELS,
    LOG_LEVELS,
    normalizeLanguage,
    SUPPORTED_LANGUAGES,
    useSettingDialogState,
} from "./useSettingDialogState";

interface SettingDialogProps {
    open: boolean;
    onClose: () => void;
}

export function SettingDialog(props: SettingDialogProps) {
    const { open, onClose } = props;
    const { t, i18n } = useTranslation();
    const {
        logLevel,
        setLogLevel,
        changeLanguage,
        persistAndClose,
        exportSettings,
        importSettings,
    } = useSettingDialogState({
        onClose,
        i18n,
    });

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => !isOpen && persistAndClose()}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("render.setting_dlg.title")}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {t("render.setting_dlg.description")}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="language-select" className="text-right">
                            {t("render.setting_dlg.language")}
                        </Label>
                        <Select
                            value={normalizeLanguage(i18n.language)}
                            onValueChange={changeLanguage}
                        >
                            <SelectTrigger
                                className="col-span-3"
                                id="language-select"
                                data-testid="main.settings.language.trigger"
                            >
                                <SelectValue
                                    placeholder={t(
                                        "render.setting_dlg.language"
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORTED_LANGUAGES.map((lng) => (
                                    <SelectItem
                                        key={lng}
                                        value={lng}
                                        data-testid={`main.settings.language.option.${lng}`}
                                    >
                                        {LANGUAGE_LABELS[lng]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground ml-auto">
                        {t("render.setting_dlg.helper.language")}
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="loglevel-select" className="text-right">
                            {t("render.setting_dlg.log_level")}
                        </Label>
                        <Select value={logLevel} onValueChange={setLogLevel}>
                            <SelectTrigger
                                className="col-span-3"
                                id="loglevel-select"
                                data-testid="main.settings.log-level.trigger"
                            >
                                <SelectValue
                                    placeholder={t(
                                        "render.setting_dlg.log_level"
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {LOG_LEVELS.map((level) => (
                                    <SelectItem
                                        key={level}
                                        value={level}
                                        data-testid={`main.settings.log-level.option.${level}`}
                                    >
                                        {t(
                                            `render.setting_dlg.log_levels.${level}`
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={exportSettings}
                            type="button"
                            data-testid="main.settings.export"
                        >
                            {t("render.setting_dlg.export")}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={importSettings}
                            type="button"
                            data-testid="main.settings.import"
                        >
                            {t("render.setting_dlg.import")}
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={persistAndClose}
                        data-testid="main.settings.done"
                    >
                        {t("render.setting_dlg.done")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
