const manualTab = document.getElementById("manualTab");
const searchTab = document.getElementById("searchTab");
const manualPanel = document.getElementById("manualPanel");
const searchPanel = document.getElementById("searchPanel");

const manualEventForm = document.getElementById("manualEventForm");
const searchEventForm = document.getElementById("searchEventForm");
const eventPreviewCard = document.getElementById("eventPreviewCard");
const eventPreview = document.getElementById("eventPreview");
const searchStatus = document.getElementById("searchStatus");
const searchResults = document.getElementById("searchResults");
const openRouterApiKey = document.getElementById("openRouterApiKey");

const OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_KEY_STORAGE = "openrouter_api_key";

const switchTab = (tabName) => {
  const isManual = tabName === "manual";
  manualTab.classList.toggle("active", isManual);
  searchTab.classList.toggle("active", !isManual);
  manualTab.setAttribute("aria-selected", String(isManual));
  searchTab.setAttribute("aria-selected", String(!isManual));
  manualPanel.classList.toggle("hidden", !isManual);
  searchPanel.classList.toggle("hidden", isManual);
};

const renderEventPreview = (eventData) => {
  eventPreviewCard.classList.remove("hidden");
  eventPreview.innerHTML = `
    <dl class="preview-grid">
      <dt>Name</dt><dd>${eventData.name || "—"}</dd>
      <dt>Date</dt><dd>${eventData.date || "Unknown"}</dd>
      <dt>Location</dt><dd>${eventData.location || "Unknown"}</dd>
      <dt>Date</dt><dd>${eventData.date || "—"}</dd>
      <dt>Location</dt><dd>${eventData.location || "—"}</dd>
      <dt>Website</dt><dd>${eventData.website ? `<a href="${eventData.website}" target="_blank" rel="noopener noreferrer">${eventData.website}</a>` : "—"}</dd>
      <dt>Description</dt><dd>${eventData.description || "—"}</dd>
    </dl>
  `;
};

const sanitizeResult = (text) => {
  if (!text) return "";
  return text.replace(/<[^>]*>/g, "").trim();
};

const guessDateFromText = (text) => {
  const patterns = [
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i,
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }

  return "Unknown";
};

const guessLocationFromText = (text) => {
  const match = text.match(/\b(in|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})\b/);
  return match ? match[2] : "Unknown";
};

const searchWikipedia = async (query) => {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("srlimit", "5");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Search failed. Please try again.");
  }

  const data = await response.json();
  return (data?.query?.search || []).map((item) => ({
    title: item.title,
    snippet: sanitizeResult(item.snippet),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, "_"))}`,
  }));
};

const buildEventFromResults = (query, results) => {
  const top = results[0] || {};
  const combinedText = `${top.title || ""}. ${top.snippet || ""}`;

  return {
    name: top.title || query,
    date: guessDateFromText(combinedText),
    location: guessLocationFromText(combinedText),
    website: top.url || "",
    description: top.snippet || "No summary available from search results.",
  };
const extractDetailsWithAI = async (query, results, apiKey) => {
  if (!apiKey) {
    const top = results[0] || {};
    return {
      name: top.title || query,
      date: "Unknown",
      location: "Unknown",
      website: top.url || "",
      description: top.snippet || "Could not extract details without AI key.",
    };
  }

  const prompt = `You extract structured event details from search results.\nReturn only valid compact JSON with exactly these keys: name, date, location, website, description.\nIf missing, use \"Unknown\".\n\nQuery: ${query}\nResults:\n${results
    .map((r, idx) => `${idx + 1}. ${r.title} | ${r.snippet} | ${r.url}`)
    .join("\n")}`;

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Event Notes Web",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI extraction failed: ${text.slice(0, 160)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim() || "{}";

  try {
    return JSON.parse(content);
  } catch (error) {
    return {
      name: query,
      date: "Unknown",
      location: "Unknown",
      website: results[0]?.url || "",
      description: `AI response parsing failed. Raw output: ${content.slice(0, 180)}`,
    };
  }
};

const renderSearchResults = (results) => {
  searchResults.classList.toggle("hidden", results.length === 0);

  if (!results.length) {
    searchResults.innerHTML = "";
    return;
  }

  searchResults.innerHTML = results
    .map(
      (result) => `
      <article class="result-item">
        <h4>${result.title}</h4>
        <p>${result.snippet}</p>
        <a href="${result.url}" target="_blank" rel="noopener noreferrer">Open source</a>
      </article>
    `,
    )
    .join("");
};

manualTab.addEventListener("click", () => switchTab("manual"));
searchTab.addEventListener("click", () => switchTab("search"));

manualEventForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = {
    name: document.getElementById("eventName").value.trim(),
    date: document.getElementById("eventDate").value,
    location: document.getElementById("eventLocation").value.trim(),
    website: document.getElementById("eventWebsite").value.trim(),
    description: document.getElementById("eventDescription").value.trim(),
  };

  renderEventPreview(payload);
  manualEventForm.reset();
});

searchEventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = document.getElementById("eventSearchQuery").value.trim();

  if (!query) return;

  searchStatus.textContent = "Finding event info from the web...";
  const apiKey = openRouterApiKey.value.trim();

  if (!query) return;

  if (apiKey) {
    localStorage.setItem(OPENROUTER_KEY_STORAGE, apiKey);
  }

  searchStatus.textContent = "Searching the web...";
  searchResults.classList.add("hidden");

  try {
    const results = await searchWikipedia(query);
    renderSearchResults(results);

    if (!results.length) {
      searchStatus.textContent = "No results found. Try a more specific query.";
      return;
    }

    const eventData = buildEventFromResults(query, results);
    searchStatus.textContent = apiKey
      ? "Running AI extraction on web results..."
      : "No API key provided. Showing web results with basic auto-fill.";

    const eventData = await extractDetailsWithAI(query, results, apiKey);
    renderEventPreview(eventData);

    searchStatus.textContent = "Done. Review Event Preview below.";
  } catch (error) {
    searchStatus.textContent = error.message || "Something went wrong. Please try again.";
  }
});

openRouterApiKey.value = localStorage.getItem(OPENROUTER_KEY_STORAGE) || "";
