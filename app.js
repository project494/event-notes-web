const createEventBtn = document.getElementById("createEventBtn");
const viewCardBtn = document.getElementById("viewCardBtn");
const createEventModal = document.getElementById("createEventModal");
const closeEventModalBtn = document.getElementById("closeEventModalBtn");

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

const toggleModal = (show) => {
  createEventModal.classList.toggle("hidden", !show);
};

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

createEventBtn.addEventListener("click", () => {
  switchTab("manual");
  toggleModal(true);
});

closeEventModalBtn.addEventListener("click", () => toggleModal(false));
createEventModal.addEventListener("click", (event) => {
  if (event.target === createEventModal) {
    toggleModal(false);
  }
});

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
  toggleModal(false);
  manualEventForm.reset();
});

searchEventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = document.getElementById("eventSearchQuery").value.trim();
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

viewCardBtn.addEventListener("click", () => {
  alert("Next step: build Digital Card page.");
});

openRouterApiKey.value = localStorage.getItem(OPENROUTER_KEY_STORAGE) || "";
