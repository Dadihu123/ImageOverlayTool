---
title: 'User Guide'
date: 2026-02-19T00:00:00+09:00
draft: false
layout: 'page'
---

# User Guide

**ImageOverlayTool** is a desktop application for overlaying and comparing multiple images with precision.
It supports developers' image verification work and design comparison tasks.

---

## 1. Installation

### Download

Get it from [Microsoft Store](https://apps.microsoft.com/store/detail/9PBQ7VPKTXQ1?cid=DevShareMCLPCS) or download from [GitHub Releases](https://github.com/yhmr/ImageOverlayTool/releases).

- **Windows**: `.exe` or `.zip` file
- **Linux**: `.AppImage` or `.deb` file

### System Requirements

- Windows 10 or later / Linux (Ubuntu 20.04+)

---

## 2. Basic Operations

### Loading Images

There are four ways to load images:

1. **From file dialog**: Select "Image Settings" from the menu (or press `Ctrl+I`), then click the "Add" button to select files.
2. **Drag & Drop**: Drag and drop image files onto the main window or image settings window.
3. **Paste from clipboard**: Press `Ctrl+V` to paste an image from the clipboard (added as a temporary cache image).
4. **Launch from Command Line (CLI)**: You can pass command-line arguments from a terminal to load images immediately upon startup. For details, please refer to the [Command Line (CLI) Integration Guide](cli-guide).

### Manipulating Images

- **Move**: Drag an image to adjust its position.
- **Transform**: Drag the corner anchor points for perspective correction (free transform).
- **Zoom**: Use the mouse wheel to zoom in and out of the entire stage.

### Fit to Screen

Use "Fit to Screen" (`Ctrl+F`) from the menu to fit the selected image to the window size.

---

## 3. Image Settings Window

Open from the menu via "Image Settings" (`Ctrl+I`) or the FAB menu's settings button.

### Image List and Reordering

- A list of loaded images is displayed.
- Drag the grip handle (☰) to reorder layers by drag & drop.
- Click an image to select it; it will be highlighted on the main canvas.

### Transparency

Adjust each image's opacity (0–100%) with the slider. Making foreground images semi-transparent enables easy comparison with background images.

Type directly into the number field on the right to set an exact value (confirm with Enter or by clicking outside the field; press Escape to cancel).

### Scale

Adjust the display scale of images with the slider. The number field on the right accepts an exact percentage (range: 10–500%).

### Rotation

Set the rotation angle of images using the slider or numeric input (range: -180 to +180 degrees). Numeric input is confirmed with Enter or by clicking outside the field.

### Reset Transform

Click "Reset Transform" to restore the image's position, transformation, and rotation to their initial state.

### Image Filters

Click the "Filter" button to open a popover with the following filters:

- **Binarization**: Converts the image to black and white. Adjust the threshold (0–255) with a slider, or type an exact value into the number field on the right.
- **HSV Adjustment**: Individually adjust Hue (H: -180 to +180), Saturation (S: -100 to +100), and Value/Brightness (V: -100 to +100) with sliders, or type exact values into the number fields.

### Visibility and Lock

- **Visibility** (👁 icon): Toggle image visibility. Hidden images remain in the layer list.
- **Lock** (🔒 icon): Locked images cannot be moved or transformed on the canvas, preventing accidental modifications.

### Relinking Missing Images

When opening an existing project with missing image files, a warning is displayed in the list. Use the "Relink" button to select a replacement file.

### Saving Clipboard Images

Images pasted from the clipboard (cache images) can be saved as regular files using the "Save As" button.

---

## 4. Project Management

Save and load your work as `.iot` project files.

| Action | Menu | Shortcut |
|---|---|---|
| New Project | Menu > New Project | `Ctrl+N` |
| Open Project | Menu > Open Project | `Ctrl+O` |
| Save Project | Menu > Save Project | `Ctrl+S` |
| Save As | Menu > Save As | `Ctrl+Shift+S` |

Project files store image paths, placement, transformation state, filter settings, layer order, and more.

---

## 5. Image Export & Capture

### Capture

Use "Capture" (`Ctrl+Shift+C`) from the menu to capture the desktop background and import it as an image.

### Image Export

Use "Image Export" (`Ctrl+E`) from the menu to export the current canvas state as an image file.
You can choose whether to include the background color in the export.

---

## 6. Dimension Lines

Open the dimension settings window from "Dimension Settings" (`Ctrl+D`) in the menu or from the FAB menu.
Draw dimension lines on the canvas with resolution-factor-aware real dimension display.

---

## 7. View Customization

### Background Color/Style

Change the canvas background color from "Background Style" (`Ctrl+B`) in the menu or the FAB menu's background style button. You can choose any color from the color picker, and frequently used colors can be saved and managed as presets.

### Always on Top

Toggle this from "Always on Top" in the menu or the FAB menu.
Click-through mode can be controlled only while this mode is ON.

### Click-Through Mode

Toggle via "Click-Through Mode" (`Ctrl+Shift+M`) in the menu or the FAB menu.
It can be enabled only when "Always on Top" is ON.
When using the global shortcut `Ctrl+Shift+M`, the app can enable "Always on Top" automatically and enter click-through mode in one step.
When enabled, clicks on the canvas area pass through to the window below (the menu bar and FAB buttons remain interactive).
A yellow indicator appears in the menu bar when active.

---

## 8. FAB Menu

A floating action button (`+` button) is located in the bottom-right corner of the screen.
Click it to expand the following shortcut buttons:

| Button | Function |
|---|---|
| Image Settings | Open Image Settings window |
| Dimension Lines | Open Dimension Settings window |
| Background Style | Change background color |
| Always on Top | Toggle always-on-top mode |
| Click-Through | Toggle click-through mode |
| Capture | Background capture |
| Export | Image export |

---

## 9. Settings

Open the settings dialog from "Settings" (`Ctrl+,`) in the menu.

- **Language**: Switch between Japanese and English.
- **Log Level**: Set the verbosity of application logs.
- **Export/Import Settings**: Export and import app settings as JSON files.

Window size, position, background color, preset colors, language, and other settings are automatically saved and restored on next launch.

---

## 10. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New Project |
| `Ctrl+O` | Open Project |
| `Ctrl+S` | Save Project |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+I` | Open Image Settings |
| `Ctrl+F` | Fit to Screen |
| `Ctrl+V` | Paste image from clipboard |
| `Ctrl+Shift+C` | Capture |
| `Ctrl+E` | Image Export |
| `Ctrl+D` | Open Dimension Settings |
| `Ctrl+B` | Background Style |
| `Ctrl+Shift+T` | Toggle Always on Top |
| `Ctrl+Shift+M` | Toggle Click-Through Mode (auto-enables Always on Top if needed) |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+,` | Open Settings |
| `Ctrl+Shift+L` | Export Logs |
| `Ctrl+Q` | Quit |

---

## 11. Troubleshooting

### Exporting Logs

If you encounter issues, export logs from "Export Logs" (`Ctrl+Shift+L`) in the menu and attach them to your support request.

### Contact

If you have any questions, please post them to [GitHub Issue](https://github.com/yhmr/ImageOverlayTool/issues) or email `yhmr.develop@gmail.com`.
