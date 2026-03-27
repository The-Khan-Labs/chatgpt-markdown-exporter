const DEFAULTS = {
  filenamePattern: "{title}_{date}.md",
  datePattern: "YYYY-MM-DD_HH-mm",
  askWhereToSave: true
};

const filenamePatternEl = document.getElementById("filenamePattern");
const datePatternEl = document.getElementById("datePattern");
const askWhereToSaveEl = document.getElementById("askWhereToSave");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");

async function load() {
  const s = await chrome.storage.local.get(["filenamePattern", "datePattern", "askWhereToSave"]);
  filenamePatternEl.value = s.filenamePattern ?? DEFAULTS.filenamePattern;
  datePatternEl.value = s.datePattern ?? DEFAULTS.datePattern;
  askWhereToSaveEl.checked = s.askWhereToSave ?? DEFAULTS.askWhereToSave;
}

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = kind || "";
}

saveBtn.addEventListener("click", async () => {
  try {
    await chrome.storage.local.set({
      filenamePattern: filenamePatternEl.value.trim() || DEFAULTS.filenamePattern,
      datePattern: datePatternEl.value.trim() || DEFAULTS.datePattern,
      askWhereToSave: askWhereToSaveEl.checked
    });
    setStatus("Saved.", "ok");
  } catch (e) {
    setStatus(e?.message || "Could not save.", "err");
  }
});

load();
