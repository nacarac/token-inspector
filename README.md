# Token Inspector (Chrome Extension) <img src="token-inspector-extension/icons/icon-48.png" alt="Token Inspector icon" width="28" height="28" />

Detect, inspect, and **remap design tokens** (CSS custom properties / `var(--token)`) on any webpage.

This is a **Manifest V3** Chrome extension with a popup UI that injects a content script into the active tab to:
- Find CSS variables used via `var(--...)` in page stylesheets
- Overlay lightweight “badge” labels on matching elements
- Let you click a badge to open a picker and **swap to a different token**
- Optionally **import** an external token set (JSON or CSS variables) to apply values
- Track changes and **export remappings** as JSON

## Features

- **On-page badges**: Labels appear near elements using CSS custom properties (up to ~300 badges per page).
- **Token picker**: Click a badge to search and pick a replacement from:
  - Page CSS variables (grouped by category: Typography / Color / Spacing / Size / Other)
  - Imported tokens (optional)
- **Live edit**: In the picker, type a token name or raw CSS value for common properties (font/color/background/etc).
- **Category filter + hide/show**: Floating toolbar on the page for filtering badge types and toggling visibility.
- **Changes panel**: See a running list of remaps and clear them.
- **Import tokens (optional)**:
  - Upload `.json`, `.css`, or `.txt`
  - Or paste JSON / CSS variables text in the popup
- **Export remappings**: Copies JSON to clipboard (fallback: downloads a `.json` file).

## Install (unpacked / local development)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the folder: `token-inspector-extension/`

Then open any page, click the extension icon, and press **Activate**.

## Usage

### Basic inspection and remapping

1. Navigate to the page you want to inspect.
2. Open the extension popup.
3. Click **Activate**.
4. On the page:
   - Hover a badge to outline its element
   - Click a badge to open the picker
   - Choose a different token to apply

### Import tokens (optional)

You can load tokens **before** activating (they’ll be injected on activation), or import while active.

- **File import**: Choose a `.json` file (design token JSON) or a `.css` file / text containing CSS variables like:

```css
:root {
  --color-brand: #3b82f6;
  --space-md: 16px;
}
```

- **Paste import**: Click **Paste**, paste JSON or CSS variable text, then click **Import pasted tokens**.

Imported tokens appear under the picker’s **Imported Tokens** tab (when available).

### Export remappings

1. Make some remaps (or edits) on the page.
2. In the popup, click **Export Remappings**.
3. The extension will try to **copy JSON to clipboard**; if that fails, it will download a file named like `token-remappings-<timestamp>.json`.

The export contains entries like:
- Which element was changed (a simple tag/id/class + truncated text description)
- Property changed
- From/to token (or value)
- Mode (CSS var remap, token edit, direct edit, variant swap)
- Timestamp

## How it works (high level)

- **Popup (`popup.html` + `popup.js`)**:
  - Sends `ACTIVATE_TAB` / `DEACTIVATE_TAB` to the service worker
  - Loads optional token data (file or paste) and sends it to the page
  - Requests remappings via `GET_REMAPPINGS` for export
- **Service worker (`background.js`)**:
  - Injects `content.js` into the active tab using `chrome.scripting.executeScript`
  - Relays import/export messages between popup and content script
- **Content script (`content.js`)**:
  - Scans accessible stylesheets for CSS variables and `var(--...)` usages (cross-origin stylesheets may be unreadable)
  - Builds an overlay UI in a closed Shadow DOM
  - Applies changes by setting inline styles on the target element

## Permissions

From `token-inspector-extension/manifest.json`:
- **`activeTab`**: Run only on the tab you activate.
- **`scripting`**: Inject the content script at runtime.
- **`storage`**: Reserved for persisted settings (not currently required by the core flow, but present in the manifest).

## Limitations / notes

- **Cross-origin CSS**: Many sites load stylesheets from other origins; browsers often block reading `stylesheet.cssRules` for those. The extension skips unreadable sheets, so results may be incomplete on some pages.
- **Page mutations**: Badges are positioned from `getBoundingClientRect()` and updated on scroll/resize; dynamic DOM updates may not always be captured unless you re-activate.
- **Inline overrides**: Remaps are applied as inline styles (easy to undo/clear, but not the same as editing source CSS).
- **Badge cap**: The overlay intentionally limits the number of badges to keep pages responsive.

## Project structure

- `token-inspector-extension/manifest.json`: Extension manifest (MV3)
- `token-inspector-extension/background.js`: Service worker (inject/relay)
- `token-inspector-extension/content.js`: Scanner + on-page UI + remapping logic
- `token-inspector-extension/popup.html`: Popup UI
- `token-inspector-extension/popup.js`: Popup logic (activate/import/export)
- `token-inspector-extension/popup.css`: Popup styling

## Credits

- **Kanika Rehani** ([nacarac](https://github.com/nacarac)) — extension author/maintainer
- **AI Agents (ChatGPT + Claude)** — implementation support

## License

No license file is included yet. If you plan to distribute this extension, consider adding a `LICENSE` file (MIT/Apache-2.0/etc.).