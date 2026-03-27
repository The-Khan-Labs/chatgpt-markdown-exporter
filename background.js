const DEFAULTS = {
  filenamePattern: "{title}_{date}.md",
  datePattern: "YYYY-MM-DD_HH-mm",
  askWhereToSave: true
};

function pad(n, len = 2) {
  return String(n).padStart(len, "0");
}

function formatDatePattern(date, pattern) {
  const p = pattern || DEFAULTS.datePattern;
  return p
    .replace(/YYYY/g, String(date.getFullYear()))
    .replace(/MM/g, pad(date.getMonth() + 1))
    .replace(/DD/g, pad(date.getDate()))
    .replace(/HH/g, pad(date.getHours()))
    .replace(/mm/g, pad(date.getMinutes()))
    .replace(/ss/g, pad(date.getSeconds()));
}

function sanitizeTitle(input) {
  const fallback = "chatgpt-conversation";
  const cleaned = (input || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return (cleaned || fallback).replace(/[. ]+$/g, "");
}

function buildExportFilename(rawTitle, filenamePattern, datePattern) {
  const title = sanitizeTitle(rawTitle);
  const dateStr = formatDatePattern(new Date(), datePattern);
  let name = (filenamePattern || DEFAULTS.filenamePattern).replace(/\{title\}/g, title).replace(/\{date\}/g, dateStr);

  if (!name.toLowerCase().endsWith(".md")) {
    name += ".md";
  }

  name = name
    .replace(/[<>:"|?*\u0000-\u001F]/g, "")
    .replace(/\\/g, "")
    .replace(/^\.+/, "");

  return name || "chatgpt-export.md";
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "EXPORT_MARKDOWN") {
    sendResponse({ ok: false, error: "Unknown message" });
    return;
  }

  (async () => {
    try {
      const stored = await chrome.storage.local.get(["filenamePattern", "datePattern", "askWhereToSave"]);
      const filenamePattern = stored.filenamePattern ?? DEFAULTS.filenamePattern;
      const datePattern = stored.datePattern ?? DEFAULTS.datePattern;
      const askWhereToSave = stored.askWhereToSave ?? DEFAULTS.askWhereToSave;

      const filename = buildExportFilename(msg.rawTitle, filenamePattern, datePattern);
      const blob = new Blob([msg.markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      await chrome.downloads.download({
        url,
        filename,
        saveAs: askWhereToSave,
        conflictAction: "uniquify"
      });

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      sendResponse({ ok: true, filename });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || "Download failed" });
    }
  })();

  return true;
});
