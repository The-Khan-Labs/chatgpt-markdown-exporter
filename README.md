# ChatGPT Markdown Exporter

Small Chrome extension: floating **Download MD** on ChatGPT, dumps the **conversation you have open** into one Markdown file.

Works on `chatgpt.com` and `chat.openai.com`.

**Privacy, in plain terms:** the extension doesn’t call our servers (there aren’t any). It reads the page and triggers a normal browser download. Your text isn’t “uploaded” anywhere by this thing.

## Install (unpacked)

1. Clone or download the repo.
2. Open `chrome://extensions`, turn on **Developer mode**.
3. **Load unpacked** → pick this folder (the one with `manifest.json`).

## Icons

Chrome wants icon files for the extensions page and (if you ship it) the Web Store. They live in `icons/`. You don’t make them yourself unless you’re changing the look.

## Python?

**You don’t need Python to use the extension.**  

There’s a helper script, `scripts/gen_icons.py`, that rebuilds those PNGs if you ever replace the art and need new sizes. It uses only the Python that ships on most systems—no pip install. Ignore it if you don’t care.

```bash
python3 scripts/gen_icons.py
```

## Layout

| | |
|---|---|
| `manifest.json` | MV3 manifest |
| `content.js` | Button + scrape + Markdown + download |
| `icons/` | PNGs referenced by the manifest |
| `scripts/gen_icons.py` | Optional regenerator for icons |

## License

MIT — see [LICENSE](./LICENSE).
