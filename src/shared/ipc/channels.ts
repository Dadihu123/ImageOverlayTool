/**
 * メインプロセス(引受側)とレンダラープロセス(呼出側)間の
 * Request/Response型IPC通信で利用されるチャンネル名の定義
 */
export const IPC_CHANNELS = {
    log: {
        write: "log:write",
        export: "log:export",
    },
    window: {
        minimize: "window:minimize",
        switchSize: "window:switchSize",
        close: "window:close",
        confirm: "window:confirm",
        setRect: "window:setRect",
        setIgnoreMouseEvents: "window:setIgnoreMouseEvents",
        setAlwaysOnTop: "window:setAlwaysOnTop",
    },
    setting: {
        load: "setting:load",
        save: "setting:save",
        export: "setting:export",
        import: "setting:import",
        windowColorLoad: "window_color:load",
        windowColorSave: "window_color:save",
        windowColorPresetsLoad: "window_color_presets:load",
        windowColorPresetsSave: "window_color_presets:save",
    },
    project: {
        saveAs: "project:saveAs",
        save: "project:save",
        load: "project:load",
        loadFromPath: "project:loadFromPath",
        pickSavePath: "project:pickSavePath",
        materializeCacheImages: "project:materializeCacheImages",
    },
    scene: {
        loadFromPath: "scene:loadFromPath",
    },
    imageSettingsWindow: {
        toggle: "imageSettingsWindow:toggle",
        loadImage: "image:load",
        getImageInfo: "image:getInfo",
        pasteImage: "imageSettingsWindow:pasteImage",
        saveCacheImageAs: "imageSettingsWindow:saveCacheImageAs",
    },
    dimensionSettingsWindow: {
        toggle: "dimensionSettingsWindow:toggle",
    },
    sync: {
        updateImageSets: "imageSets:update",
        updateDimensionLines: "dimensionLines:update",
        updateGuides: "guides:update",
        updateUnitFactor: "unitFactor:update",
        updateUnit: "unit:update",
        updateInteractionMode: "interactionMode:update",
        updateSelectedImageId: "selectedImageId:update",
        updateSelectedDimensionLineId: "selectedDimensionLineId:update",
        updateProjectDirty: "project:dirty:update",
        requestInitialState: "state:requestInitial",
    },
    license: {
        get: "license:get",
        appVersion: "app:getVersion",
    },
    capture: {
        screen: "capture-screen",
        window: "capture-window",
        saveImageData: "save-image-data",
    },
} as const;

/**
 * メインプロセスからレンダラープロセスなどに対する
 * 単方向のイベント通知(Publish/Subscribe)型IPC通信で利用されるイベント名の定義
 */
export const IPC_EVENTS = {
    imageSetsUpdated: "imageSets:updated",
    dimensionLinesUpdated: "dimensionLines:updated",
    guidesUpdated: "guides:updated",
    unitFactorUpdated: "unitFactor:updated",
    unitUpdated: "unit:updated",
    interactionModeUpdated: "interactionMode:updated",
    selectedImageIdUpdated: "selectedImageId:updated",
    selectedDimensionLineIdUpdated: "selectedDimensionLineId:updated",
    languageUpdated: "language:updated",
    alwaysOnTopShortcutTriggered: "alwaysOnTop:shortcutTriggered",
    clickThroughShortcutTriggered: "clickThrough:shortcutTriggered",
    requestStateSync: "state:requestSync",
    fileOpen: "file:open",
    launchIntentApply: "launchIntent:apply",
    appControlCommandApply: "appControlCommand:apply",
} as const;
