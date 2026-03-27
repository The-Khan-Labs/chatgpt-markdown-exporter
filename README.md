# ChatGPT Markdown Exporter

Lightweight [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/) extension that adds a floating **Download MD** button on ChatGPT and exports the **currently open** conversation to a single Markdown file. All work happens in your browser; nothing is uploaded.

## Features

- Per-chat export (only the conversation open on the tab)
- Local-only processing; no network calls from the extension for export
- No analytics, telemetry, or remote endpoints
- Markdown-friendly output: headings, lists, links, fenced code blocks, blockquotes, tables, images
- Matches: `https://chatgpt.com/*`, `https://chat.openai.com/*`

## Install (load unpacked)

1. Clone this repo (or download a release zip).
2. Open Chrome → **Extensions** (`chrome://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the folder that contains `manifest.json` (repo root).

Icons are committed under `icons/`. To regenerate them after edits:

```bash
python3 scripts/gen_icons.py
```

## Privacy

Export runs entirely in the page context at click time. Conversation text is not sent to any server by this extension.

## Repository layout

| Path | Purpose |
|------|--------|
| `manifest.json` | Extension manifest (MV3) |
| `content.js` | Content script: UI, DOM extraction, Markdown build, download |
| `icons/` | Toolbar / store icons (16–128 px PNG) |
| `scripts/gen_icons.py` | Optional icon generator (stdlib only) |
| `LICENSE` | MIT |

## Contributing

Issues and PRs are welcome. Please keep changes scoped (one logical change per PR) and test **Load unpacked** after editing.

## License

MIT — see [LICENSE](./LICENSE).
