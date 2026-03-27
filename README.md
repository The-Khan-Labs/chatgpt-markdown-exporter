# ChatGPT Markdown Exporter

Small Chrome extension: floating **Download MD** on ChatGPT, dumps the **conversation you have open** into one Markdown file.

Works on `chatgpt.com` and `chat.openai.com`.

![Download MD button pinned on ChatGPT (dark UI)](./screenshot-download-md.png)

**Privacy, in plain terms:** the extension doesn’t call our servers (there aren’t any). It reads the page and triggers a normal browser download. Your text isn’t “uploaded” anywhere by this thing.

### What’s MV3?

**MV3** is **Manifest V3**—the current Chrome extension format (the `"manifest_version": 3` line in `manifest.json`). Google’s been moving everyone off the old MV2 rules. For this repo it mostly matters because the manifest and permissions follow the new style; the extension itself is just a content script that adds the button—no heavy MV3 background machinery.

## Install (unpacked)

1. Clone or download the repo.
2. Open `chrome://extensions`, turn on **Developer mode**.
3. **Load unpacked** → pick this folder (the one with `manifest.json`).

## Layout

| | |
|---|---|
| `manifest.json` | Extension config (Manifest V3) |
| `content.js` | Button + scrape + Markdown + download |
| `screenshot-download-md.png` | Screenshot of the button |

## License

MIT — see [LICENSE](./LICENSE).
