# ChatGPT Markdown Exporter

Lightweight Chromium extension that adds a floating `Download MD` button inside ChatGPT and exports only the currently open conversation to one Markdown file.

Works on `chatgpt.com` and `chat.openai.com`.

![Download MD button on ChatGPT](./screenshot-download-md.png)


## Install (unpacked)

1. Clone or download this repo.
2. Chrome → `chrome://extensions` → enable **Developer mode**.
3. **Load unpacked** → select this folder (where `manifest.json` is).

## Options

`chrome://extensions` → this extension → **Details** → **Extension options**.

Set the filename pattern (default `{title}_{date}.md`), how `{date}` is formatted (e.g. `YYYY-MM-DD_HH-mm`), and whether Chrome should **ask where to save** each time (folder + name). If you turn that off, files go to your normal download folder with the generated name.

## License

MIT — [LICENSE](./LICENSE).
