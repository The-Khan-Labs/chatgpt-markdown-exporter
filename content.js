(() => {
  const BUTTON_ID = "chatgpt-md-export-btn";
  const TOAST_ID = "chatgpt-md-export-toast";
  const STYLE_ID = "chatgpt-md-export-style";
  let remountQueued = false;

  function sanitizeFilename(input) {
    const fallback = "chatgpt-conversation";
    const cleaned = (input || fallback)
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);

    return (cleaned || fallback).replace(/[. ]+$/g, "");
  }

  function escapeInlineText(text) {
    return (text || "")
      .replace(/\\/g, "\\\\")
      .replace(/([*_`~\[\]])/g, "\\$1");
  }

  function escapeTableText(text) {
    return (text || "").replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
  }

  function normalizeWs(text) {
    return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }

  function getLanguageFromCode(codeEl) {
    const className = codeEl?.className || "";
    const match = className.match(/language-([\w+-]+)/i);
    return match ? match[1].toLowerCase() : "";
  }

  function inlineNodesToMarkdown(nodes) {
    return Array.from(nodes).map((node) => inlineNodeToMarkdown(node)).join("");
  }

  function inlineNodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeInlineText(node.textContent || "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node;
    const tag = el.tagName.toLowerCase();

    if (tag === "br") {
      return "  \n";
    }

    if (tag === "code" && el.closest("pre")) {
      return "";
    }

    if (tag === "code") {
      const text = el.textContent || "";
      const ticks = "`".repeat((text.match(/`+/g)?.reduce((m, s) => Math.max(m, s.length), 0) || 0) + 1);
      return `${ticks}${text}${ticks}`;
    }

    if (tag === "strong" || tag === "b") {
      return `**${inlineNodesToMarkdown(el.childNodes)}**`;
    }

    if (tag === "em" || tag === "i") {
      return `*${inlineNodesToMarkdown(el.childNodes)}*`;
    }

    if (tag === "s" || tag === "del" || tag === "strike") {
      return `~~${inlineNodesToMarkdown(el.childNodes)}~~`;
    }

    if (tag === "a") {
      const href = el.getAttribute("href") || "";
      const label = normalizeWs(inlineNodesToMarkdown(el.childNodes)) || href;
      if (!href) return label;
      return `[${label}](${href})`;
    }

    if (tag === "img") {
      const src = el.getAttribute("src") || el.getAttribute("data-src") || "";
      const alt = escapeInlineText(el.getAttribute("alt") || "image");
      return src ? `![${alt}](${src})` : `![${alt}]()`;
    }

    return inlineNodesToMarkdown(el.childNodes);
  }

  function listToMarkdown(listEl, depth) {
    const ordered = listEl.tagName.toLowerCase() === "ol";
    const items = Array.from(listEl.children).filter((n) => n.tagName?.toLowerCase() === "li");
    if (!items.length) return "";

    return items
      .map((li, idx) => {
        const indent = "  ".repeat(depth);
        const marker = ordered ? `${idx + 1}. ` : "- ";
        const children = Array.from(li.childNodes);
        const nestedLists = children.filter((n) => n.nodeType === Node.ELEMENT_NODE && ["ul", "ol"].includes(n.tagName.toLowerCase()));
        const inlineChildren = children.filter((n) => !nestedLists.includes(n));
        const lineBody = normalizeWs(inlineNodesToMarkdown(inlineChildren));
        let block = `${indent}${marker}${lineBody || "(empty)"}\n`;

        for (const nested of nestedLists) {
          block += listToMarkdown(nested, depth + 1);
        }

        return block;
      })
      .join("");
  }

  function tableToMarkdown(tableEl) {
    const rows = Array.from(tableEl.querySelectorAll("tr"));
    if (!rows.length) return "";

    const grid = rows.map((row) =>
      Array.from(row.querySelectorAll("th, td")).map((cell) => escapeTableText(normalizeWs(inlineNodesToMarkdown(cell.childNodes))))
    );

    const width = Math.max(...grid.map((r) => r.length));
    if (!width) return "";

    const normalized = grid.map((r) => {
      const padded = r.slice();
      while (padded.length < width) padded.push("");
      return padded;
    });

    const hasHeader = rows[0].querySelectorAll("th").length > 0;
    const header = hasHeader ? normalized[0] : Array.from({ length: width }, (_, i) => `Column ${i + 1}`);
    const body = hasHeader ? normalized.slice(1) : normalized;

    const headerLine = `| ${header.join(" | ")} |`;
    const sepLine = `| ${Array.from({ length: width }, () => "---").join(" | ")} |`;
    const bodyLines = body.map((r) => `| ${r.join(" | ")} |`).join("\n");

    return `${headerLine}\n${sepLine}${bodyLines ? `\n${bodyLines}` : ""}\n\n`;
  }

  function nodeToMarkdown(node, depth = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeWs(node.textContent || "");
      return text ? `${escapeInlineText(text)}\n\n` : "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node;
    const tag = el.tagName.toLowerCase();

    if (["script", "style", "button", "nav", "aside", "footer", "form", "noscript"].includes(tag)) {
      return "";
    }

    if (tag === "pre") {
      const codeEl = el.querySelector("code");
      const lang = getLanguageFromCode(codeEl);
      const content = (codeEl ? codeEl.textContent : el.textContent) || "";
      return `\n\n\`\`\`${lang}\n${content.replace(/\n+$/g, "")}\n\`\`\`\n\n`;
    }

    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1]);
      const text = normalizeWs(inlineNodesToMarkdown(el.childNodes));
      return text ? `${"#".repeat(level)} ${text}\n\n` : "";
    }

    if (tag === "p") {
      const text = normalizeWs(inlineNodesToMarkdown(el.childNodes));
      return text ? `${text}\n\n` : "";
    }

    if (tag === "blockquote") {
      const content = blocksToMarkdown(el.childNodes, depth).trim();
      if (!content) return "";
      const quoted = content
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n");
      return `${quoted}\n\n`;
    }

    if (tag === "ul" || tag === "ol") {
      return `${listToMarkdown(el, depth)}\n`;
    }

    if (tag === "table") {
      return tableToMarkdown(el);
    }

    if (tag === "hr") {
      return `---\n\n`;
    }

    if (tag === "img") {
      return `${inlineNodeToMarkdown(el)}\n\n`;
    }

    if (tag === "code") {
      return `${inlineNodeToMarkdown(el)}\n\n`;
    }

    const childContent = blocksToMarkdown(el.childNodes, depth);
    if (childContent.trim()) {
      return childContent;
    }

    const inline = normalizeWs(inlineNodeToMarkdown(el));
    return inline ? `${inline}\n\n` : "";
  }

  function blocksToMarkdown(nodes, depth = 0) {
    return Array.from(nodes).map((n) => nodeToMarkdown(n, depth)).join("");
  }

  function normalizeMarkdown(md) {
    return md
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim() + "\n";
  }

  function detectRole(container) {
    const direct = container.getAttribute("data-message-author-role");
    if (direct === "assistant" || direct === "user") return direct;

    const nested = container.querySelector("[data-message-author-role]")?.getAttribute("data-message-author-role");
    if (nested === "assistant" || nested === "user") return nested;

    const label = (container.querySelector("h5, h6, strong")?.textContent || "").toLowerCase();
    if (label.includes("assistant") || label.includes("chatgpt")) return "assistant";

    return "user";
  }

  function getMessageRoots() {
    const roots = [];
    const seen = new Set();

    const candidates = [
      ...document.querySelectorAll("main [data-message-author-role]"),
      ...document.querySelectorAll("main article[data-testid^='conversation-turn-']"),
      ...document.querySelectorAll("main article")
    ];

    for (const candidate of candidates) {
      const root = candidate.closest("[data-message-author-role]") || candidate;
      if (!root || seen.has(root)) continue;
      seen.add(root);
      roots.push(root);
    }

    return roots;
  }

  function cloneContentRoot(messageRoot) {
    const preferred =
      messageRoot.querySelector("[data-message-content='true']") ||
      messageRoot.querySelector(".markdown") ||
      messageRoot.querySelector(".prose") ||
      messageRoot;

    const clone = preferred.cloneNode(true);

    const removeSelectors = [
      "button",
      "nav",
      "aside",
      "footer",
      "form",
      "[role='button']",
      "[data-testid*='copy']",
      "[data-testid*='regenerate']",
      "[data-testid*='thumbs']",
      "[aria-label*='copy' i]",
      "[aria-label*='regenerate' i]"
    ];

    for (const selector of removeSelectors) {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    }

    return clone;
  }

  function getConversationTitle() {
    const candidates = [
      document.querySelector("main h1"),
      document.querySelector("h1"),
      document.querySelector("title")
    ];

    for (const candidate of candidates) {
      const text = normalizeWs(candidate?.textContent || "");
      if (text) {
        return text.replace(/\s*\|\s*ChatGPT\s*$/i, "").trim();
      }
    }

    return "ChatGPT Conversation";
  }

  function buildMarkdown() {
    const roots = getMessageRoots();
    if (!roots.length) {
      throw new Error("No conversation found on this page.");
    }

    const title = getConversationTitle();
    const now = new Date().toISOString();
    const meta = [
      `- Source: ${window.location.href}`,
      `- Exported: ${now}`
    ].join("\n");

    const turns = [];

    for (const root of roots) {
      const role = detectRole(root);
      const contentRoot = cloneContentRoot(root);
      const mdBody = normalizeMarkdown(blocksToMarkdown(contentRoot.childNodes));
      if (!mdBody.trim()) continue;

      turns.push(`## ${role === "assistant" ? "Assistant" : "User"}\n\n${mdBody}`);
    }

    if (!turns.length) {
      throw new Error("Conversation was detected, but no message text could be extracted.");
    }

    const output = [`# ${title}`, "", meta, "", "---", "", turns.join("\n\n---\n\n")].join("\n");

    return {
      filename: `${sanitizeFilename(title)}.md`,
      markdown: normalizeMarkdown(output)
    };
  }

  function downloadMarkdown(filename, content) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function showToast(message, isError = false) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = isError ? "cgmd-toast cgmd-toast-error" : "cgmd-toast";
    toast.style.opacity = "1";

    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      const activeToast = document.getElementById(TOAST_ID);
      if (activeToast) activeToast.style.opacity = "0";
    }, 2200);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BUTTON_ID} {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 10px;
        background: rgba(20, 20, 20, 0.9);
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        padding: 10px 12px;
        cursor: pointer;
        backdrop-filter: blur(4px);
      }

      #${BUTTON_ID}:hover {
        background: rgba(0, 0, 0, 0.95);
      }

      #${BUTTON_ID}:disabled {
        opacity: 0.6;
        cursor: progress;
      }

      .cgmd-toast {
        position: fixed;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        z-index: 2147483647;
        background: rgba(15, 23, 42, 0.95);
        color: #fff;
        border-radius: 8px;
        font-size: 12px;
        padding: 8px 10px;
        opacity: 0;
        transition: opacity 160ms ease;
        pointer-events: none;
      }

      .cgmd-toast-error {
        background: rgba(185, 28, 28, 0.95);
      }
    `;

    document.documentElement.appendChild(style);
  }

  async function onDownloadClick() {
    const btn = document.getElementById(BUTTON_ID);
    if (!btn) return;

    btn.disabled = true;

    try {
      const { filename, markdown } = buildMarkdown();
      downloadMarkdown(filename, markdown);
      showToast(`Downloaded ${filename}`);
    } catch (error) {
      showToast(error?.message || "Export failed.", true);
    } finally {
      btn.disabled = false;
    }
  }

  function mountButton() {
    injectStyles();

    if (!document.body) return;
    if (document.getElementById(BUTTON_ID)) return;

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.type = "button";
    btn.textContent = "Download MD";
    btn.addEventListener("click", onDownloadClick);
    document.body.appendChild(btn);
  }

  function queueMount() {
    if (remountQueued) return;
    remountQueued = true;

    requestAnimationFrame(() => {
      remountQueued = false;
      mountButton();
    });
  }

  function startObservers() {
    const observer = new MutationObserver(() => {
      if (!document.getElementById(BUTTON_ID)) {
        queueMount();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  mountButton();
  startObservers();
})();
