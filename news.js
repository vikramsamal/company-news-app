const company = "Microsoft";
const companySymbol = "MSFT";
const competitors = [
  { name: "Google", symbol: "GOOGL" },
  { name: "Apple", symbol: "AAPL" },
  { name: "Amazon", symbol: "AMZN" },
  { name: "Meta", symbol: "META" },
  { name: "IBM", symbol: "IBM" }
];

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

// Fetch stock data for a company
async function fetchStockData(symbol) {
  // Using a free API that doesn't require an API key for demo purposes
  // In a production environment, you would use a proper financial API with authentication
  try {
    // For demonstration, we'll generate mock stock data
    // In a real implementation, you would call an actual stock API
    const mockData = {
      symbol: symbol,
      price: (Math.random() * 300 + 100).toFixed(2), // Random price between 100 and 400
      change: (Math.random() * 10 - 5).toFixed(2),   // Random change between -5 and 5
      changePercent: (Math.random() * 5 - 2.5).toFixed(2) // Random percent change between -2.5% and 2.5%
    };
    return mockData;
  } catch (e) {
    console.error("Error fetching stock data:", e);
    return null;
  }
}

// Render stock data
function renderStockData(stockData) {
  const container = document.getElementById("msft-stock");
  if (!stockData) {
    container.innerHTML = "<p>Failed to load stock data.</p>";
    return;
  }
  
  const changeClass = parseFloat(stockData.change) >= 0 ? "positive" : "negative";
  const changeSymbol = parseFloat(stockData.change) >= 0 ? "+" : "";
  
  container.innerHTML = `
    <div class="stock-price">$${stockData.price}</div>
    <div class="stock-change ${changeClass}">${changeSymbol}${stockData.change} (${changeSymbol}${stockData.changePercent}%)</div>
  `;
}

// Render competitor stock data
function renderCompetitorStocks(stockDataArray) {
  const container = document.getElementById("competitor-stocks");
  if (!stockDataArray || stockDataArray.length === 0) {
    container.innerHTML = "<p>Failed to load competitor stock data.</p>";
    return;
  }
  
  let html = "";
  stockDataArray.forEach(stock => {
    if (stock) {
      const changeClass = parseFloat(stock.change) >= 0 ? "positive" : "negative";
      const changeSymbol = parseFloat(stock.change) >= 0 ? "+" : "";
      
      html += `
        <div class="competitor-stock">
          <div><strong>${stock.symbol}</strong></div>
          <div class="stock-price">$${stock.price}</div>
          <div class="stock-change ${changeClass}">${changeSymbol}${stock.change}%</div>
        </div>
      `;
    }
  });
  
  container.innerHTML = html;
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
  // Fetch main company stock data
  const stockData = await fetchStockData(companySymbol);
  renderStockData(stockData);
  
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

  // Fetch competitor news and stock data in parallel
  let competitorArticles = [];
  const competitorPromises = competitors.map(comp => 
    Promise.all([
      fetchCompanyNews(comp.name),
      fetchStockData(comp.symbol)
    ])
  );
  
  const competitorResults = await Promise.all(competitorPromises);
  
  // Process competitor news
  competitorResults.forEach(([newsArray, stockData]) => {
    competitorArticles = competitorArticles.concat(newsArray.slice(0, 2));
  });
  
  // Extract stock data for rendering
  const competitorStocks = competitorResults.map(([_, stockData]) => stockData);
  
  renderNews("competitor-news", competitorArticles);
  renderCompetitorStocks(competitorStocks);
}

main();