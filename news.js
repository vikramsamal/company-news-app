const company = "Microsoft";
const competitors = ["Google", "Apple", "Amazon", "Meta", "IBM"];

// Helper: Basic sentiment analysis using keywords
function getSentiment(text) {
  const positiveWords = ["growth", "profit", "record", "beat", "success", "win", "positive", "up", "increase", "surge"];
  const negativeWords = ["loss", "decline", "fall", "drop", "negative", "down", "lawsuit", "scandal", "cut", "layoff"];
  let score = 0;
  const lower = text.toLowerCase();
  positiveWords.forEach(word => { if (lower.includes(word)) score++; });
  negativeWords.forEach(word => { if (lower.includes(word)) score--; });
  return score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
}

// Helper: Guess if news is local (US) or global (not US) based on title/description
function isLocal(article) {
  // Try to detect US/local news by keywords in title/description
  const localKeywords = ["US", "United States", "America", "U.S.", "USA"];
  const text = (article.title || "") + " " + (article.description || "");
  return localKeywords.some(k => text.includes(k));
}

// Fetch news for a company using Google News RSS (no API key required)
async function fetchCompanyNews(query) {
  const rssURL = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const apiURL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssURL)}`;
  try {
    const res = await fetch(apiURL);
    const data = await res.json();
    if (data.items && data.items.length) {
      return data.items.map(item => ({
        title: item.title,
        description: item.description,
        link: item.link
      }));
    }
  } catch (e) {
    // If fetch fails, return empty array
  }
  return [];
}

// Render news cards
function renderNews(containerId, articles) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  if (!articles.length) {
    container.innerHTML = "<p>No news found.</p>";
    return;
  }
  articles.forEach(article => {
    const card = document.createElement("div");
    card.className = "news-card";
    card.innerHTML = `
      <h3><a href="${article.link}" target="_blank">${article.title}</a></h3>
      <p>${article.description || ''}</p>
    `;
    container.appendChild(card);
  });
}

async function main() {
  // Fetch main company news
  const articles = await fetchCompanyNews(company);

  // Sentiment split
  const positive = [];
  const negative = [];
  const global = [];
  const local = [];

  articles.forEach(article => {
    const sentiment = getSentiment((article.title || "") + " " + (article.description || ""));
    if (sentiment === "positive") positive.push(article);
    else if (sentiment === "negative") negative.push(article);

    if (isLocal(article)) local.push(article);
    else global.push(article);
  });

  renderNews("positive-news", positive.slice(0, 3));
  renderNews("negative-news", negative.slice(0, 3));
  renderNews("global-news", global.slice(0, 5));
  renderNews("local-news", local.slice(0, 5));

  // Fetch competitor news in parallel
  let competitorArticles = [];
  const competitorNewsArrays = await Promise.all(
    competitors.map(comp => fetchCompanyNews(comp))
  );
  competitorNewsArrays.forEach(arr => {
    competitorArticles = competitorArticles.concat(arr.slice(0, 2));
  });
  renderNews("competitor-news", competitorArticles);
}

main();