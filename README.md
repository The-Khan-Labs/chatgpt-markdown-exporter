# ChatGPT Markdown Exporter

**Save any open ChatGPT conversation as a clean `.md` file in one click**—right from the thread you’re reading. Built for people who want their chats in Notion, Obsidian, docs, or GitHub without copy-paste marathons.

**New on GitHub:** a minimal, modern Chrome extension (Manifest V3) that does one job well: turn the **current** chat into readable Markdown, formatted for real use.

## Why we talk about privacy (not “local tech jargon”)

When other tools say *local*, they usually mean *nobody else sees your words*. This extension **does not send your messages to us or to any backend**—there is no server, no analytics hook, no “phone home.” Export happens in your browser when you click **Download MD**, then your file saves like any normal download. We say it plainly because that’s the promise.

## What you get

- **One floating button** on ChatGPT (`chatgpt.com` and `chat.openai.com`)
- **This chat only**—not your history vault, not other tabs
- **Rich Markdown**: headings, lists, links, code fences, quotes, tables, images
- **No accounts, no tracking**—just the extension and your download folder

## Icons—do you need them?

**For you as a user:** Chrome uses icons in the extensions page and menus so the project looks finished and is easy to spot.

**For publishing:** the Chrome Web Store expects proper icons; without them you look incomplete and can hit rejections.

They’re small PNGs in `icons/`. Regenerate anytime:

```bash
python3 scripts/gen_icons.py
```

## Install (load unpacked)

1. Clone [the repo](https://github.com/The-Khan-Labs/chatgpt-markdown-exporter) or download a release zip.
2. Chrome → **Extensions** → `chrome://extensions`
3. Turn on **Developer mode**
4. **Load unpacked** → choose the folder that contains `manifest.json`

## Repo layout

| Path | Purpose |
|------|--------|
| `manifest.json` | Manifest V3 config |
| `content.js` | Button, extract, Markdown build, download |
| `icons/` | Store- and Chrome-ready PNGs (16–128 px) |
| `scripts/gen_icons.py` | Optional icon generator (Python stdlib only) |
| `LICENSE` | MIT |

## Contributing

Issues and PRs welcome—keep changes focused and reload the unpacked extension after edits.

## License

MIT — see [LICENSE](./LICENSE).
