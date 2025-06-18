import { bangs } from "./bang";
import "./global.css";

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <div class="content-container">
        <h1>Ducky</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="https://ducky-gilt.vercel.app/?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
      </div>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });
}

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  // Split query into separate words separated by spaces
  const words = query.split(/\s+/);

  let selectedBang = defaultBang;
  let cleanQuery = query;

  // Find bang match
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();

    // Check if word matches any bangs
    const foundBang = bangs.find((b) => b.t === word);

    if (foundBang) {
      selectedBang = foundBang;

      // Remove bang from query
      const queryWords = [...words];
      queryWords.splice(i, 1);

      cleanQuery = queryWords.join(" ").trim();
      break;
    }
  }

  // Still allow !bang format
  const traditionalMatch = query.match(/!(\S+)/i);
  if (traditionalMatch) {
    const bangCandidate = traditionalMatch[1]?.toLowerCase();
    const traditionalBang = bangs.find((b) => b.t === bangCandidate);

    if (traditionalBang) {
      selectedBang = traditionalBang;
      // Remove !bang from query
      cleanQuery = query.replace(/!\S+\s*/i, "").trim();
    }
  }

  let searchUrl = selectedBang?.u;

  if (!searchUrl) return null;

  if (cleanQuery.trim() === "") {
    // If the query is just `!gpt`, use `chatgpt.com/?model=gpt-4-1` instead of `chatgpt.com?q={{{s}}}`
    searchUrl = searchUrl.replace(/[?&]q={{{s}}}/, "");

    // Add back leading params if they exist
    if (searchUrl.includes("&") && !searchUrl.includes("?")) {
      searchUrl = searchUrl.replace("&", "?");
    }
  } else {
    searchUrl = searchUrl.replace(
      "{{{s}}}",
      // Replace %2F with / to fix formats like "ghr+t3dotgg/unduck"
      encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
    );
  }

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();