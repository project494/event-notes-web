const manualEventForm = document.getElementById("manualEventForm");
const searchEventForm = document.getElementById("searchEventForm");
const eventPreviewCard = document.getElementById("eventPreviewCard");
const eventPreview = document.getElementById("eventPreview");
const searchStatus = document.getElementById("searchStatus");
const searchResults = document.getElementById("searchResults");

const renderEventPreview = (eventData) => {
  eventPreviewCard.classList.remove("hidden");
  eventPreview.innerHTML = `
    <dl class="preview-grid">
      <dt>Name</dt><dd>${eventData.name || "—"}</dd>
      <dt>Date</dt><dd>${eventData.date || "Unknown"}</dd>
      <dt>Location</dt><dd>${eventData.location || "Unknown"}</dd>
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

  if (!query) {
    searchStatus.textContent = "Please enter a search query.";
    return;
  }

  searchStatus.textContent = "Searching online events...";
  searchResults.classList.add("hidden");

  try {
    const results = await searchWikipedia(query);
    renderSearchResults(results);

    if (!results.length) {
      searchStatus.textContent = "No results found. Try a more specific query.";
      return;
    }

    const eventData = buildEventFromResults(query, results);
    renderEventPreview(eventData);

    searchStatus.textContent = "Done. Review Event Preview below.";
  } catch (error) {
    searchStatus.textContent = error.message || "Something went wrong. Please try again.";
  }
});
