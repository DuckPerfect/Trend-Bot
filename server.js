const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

// Import fetch for Node.js
let fetch;
(async () => {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
})();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Math.floor(Date.now() / 1000),
    version: '2.0.0',
    uptime: process.uptime()
  });
});

// Get cryptocurrency trends
app.get('/api/trends', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '24h';
    const market = req.query.market || 'crypto';
    const limit = parseInt(req.query.limit) || 10;
    
    const url = "https://api.coingecko.com/api/v3/coins/markets";
    
    const categoryMapping = {
      'crypto': null,
      'all': null,
      'defi': 'decentralized-finance-defi',
      'nft': 'non-fungible-tokens-nft',
      'gaming': 'gaming',
      'layer-1': 'layer-1',
      'layer-2': 'layer-2'
    };
    
    const params = new URLSearchParams({
      'vs_currency': 'usd',
      'order': 'market_cap_desc',
      'per_page': limit.toString(),
      'page': '1',
      'sparkline': 'false',
      'locale': 'en',
      'price_change_percentage': '1h,24h,7d,30d'
    });
    
    if (market !== 'crypto' && market !== 'all' && categoryMapping[market]) {
      params.append('category', categoryMapping[market]);
    }
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TrendBot/2.0'
    };
    
    const response = await fetch(`${url}?${params}`, { 
      headers,
      timeout: 15000 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const priceChangeKeyMap = {
      '1h': 'price_change_percentage_1h_in_currency',
      '24h': 'price_change_percentage_24h_in_currency',
      '7d': 'price_change_percentage_7d_in_currency',
      '30d': 'price_change_percentage_30d_in_currency'
    };
    
    const selectedTimeframeKey = priceChangeKeyMap[timeframe] || priceChangeKeyMap['24h'];
    
    const trends = data.map(coin => {
      let priceChange = coin[selectedTimeframeKey];
      if (priceChange === null || priceChange === undefined) {
        priceChange = coin.price_change_percentage_24h || 0.0;
      }
      
      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price || 0,
        change_24h: Math.round(parseFloat(priceChange) * 100) / 100,
        market_cap: coin.market_cap || 0,
        trend: priceChange > 0 ? 'up' : (priceChange < 0 ? 'down' : 'flat'),
        volume_24h: coin.total_volume || 0,
        image: coin.image || '',
        market_cap_rank: coin.market_cap_rank || 0,
        ath: coin.ath || 0,
        ath_change_percentage: coin.ath_change_percentage || 0,
        circulating_supply: coin.circulating_supply || 0,
        total_supply: coin.total_supply || 0,
        max_supply: coin.max_supply || 0
      };
    });
    
    res.json({
      success: true,
      data: trends,
      timestamp: Math.floor(Date.now() / 1000),
      count: trends.length,
      timeframe,
      market
    });
    
  } catch (error) {
    console.error('Error in get_trends:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trends data',
      details: error.message
    });
  }
});

// Get detailed coin information
app.get('/api/coin/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;
    
    const params = new URLSearchParams({
      'localization': 'false',
      'tickers': 'false',
      'market_data': 'true',
      'community_data': 'true',
      'developer_data': 'true',
      'sparkline': 'false'
    });
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TrendBot/2.0'
    };
    
    const response = await fetch(`${url}?${params}`, { 
      headers,
      timeout: 10000 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const marketData = data.market_data || {};
    const communityData = data.community_data || {};
    const developerData = data.developer_data || {};
    
    const currentPrice = marketData.current_price?.usd || 0;
    const marketCap = marketData.market_cap?.usd || 0;
    const volume24h = marketData.total_volume?.usd || 0;
    const descriptionEn = data.description?.en || '';
    
    const coinData = {
      id: data.id,
      name: data.name,
      symbol: (data.symbol || '').toUpperCase(),
      current_price: currentPrice,
      market_cap: marketCap,
      price_change_percentage_1h: marketData.price_change_percentage_1h || 0,
      price_change_percentage_24h: marketData.price_change_percentage_24h || 0,
      price_change_percentage_7d: marketData.price_change_percentage_7d || 0,
      price_change_percentage_30d: marketData.price_change_percentage_30d || 0,
      volume_24h: volume24h,
      market_cap_rank: data.market_cap_rank || marketData.market_cap_rank || 0,
      ath: marketData.ath?.usd || 0,
      ath_change_percentage: marketData.ath_change_percentage?.usd || 0,
      atl: marketData.atl?.usd || 0,
      atl_change_percentage: marketData.atl_change_percentage?.usd || 0,
      circulating_supply: marketData.circulating_supply || 0,
      total_supply: marketData.total_supply || 0,
      max_supply: marketData.max_supply || 0,
      description: descriptionEn.length > 500 ? descriptionEn.substring(0, 500) + '...' : (descriptionEn || 'No description available.'),
      image: data.image?.large || '',
      homepage: data.links?.homepage?.[0] || '',
      blockchain_site: data.links?.blockchain_site?.[0] || '',
      twitter_screen_name: data.links?.twitter_screen_name || '',
      telegram_channel_identifier: data.links?.telegram_channel_identifier || '',
      subreddit_url: data.links?.subreddit_url || '',
      // Community metrics
      twitter_followers: communityData.twitter_followers || 0,
      reddit_subscribers: communityData.reddit_subscribers || 0,
      telegram_channel_user_count: communityData.telegram_channel_user_count || 0,
      // Developer metrics
      forks: developerData.forks || 0,
      stars: developerData.stars || 0,
      subscribers: developerData.subscribers || 0,
      total_issues: developerData.total_issues || 0,
      closed_issues: developerData.closed_issues || 0,
      pull_requests_merged: developerData.pull_requests_merged || 0,
      commit_count_4_weeks: developerData.commit_count_4_weeks || 0
    };
    
    res.json({
      success: true,
      data: coinData,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
  } catch (error) {
    console.error(`Error fetching coin details for ${req.params.coinId}:`, error.message);
    res.status(500).json({
      success: false,
      error: `Failed to fetch details for ${req.params.coinId}`,
      details: error.message
    });
  }
});

// Search cryptocurrencies
app.get('/api/search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }
    
    const url = "https://api.coingecko.com/api/v3/search";
    const params = new URLSearchParams({ query });
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TrendBot/2.0'
    };
    
    const response = await fetch(`${url}?${params}`, { 
      headers,
      timeout: 10000 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const results = (data.coins || []).slice(0, 10).map(coin => ({
      id: coin.id,
      name: coin.name,
      api_symbol: coin.api_symbol,
      symbol: (coin.symbol || '').toUpperCase(),
      market_cap_rank: coin.market_cap_rank,
      thumb: coin.thumb || '',
      large: coin.large || ''
    }));
    
    res.json({
      success: true,
      data: results,
      query,
      count: results.length,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
  } catch (error) {
    console.error('Error searching cryptocurrencies:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search cryptocurrencies',
      details: error.message
    });
  }
});

// Get chart data for a specific coin
app.get('/api/chart/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const days = req.query.days || '7';
    const vsCurrency = req.query.vs_currency || 'usd';
    
    let numDays;
    if (days === 'max') {
      numDays = 'max';
    } else {
      numDays = parseInt(days);
      if (isNaN(numDays) || numDays <= 0) {
        numDays = 7;
      }
    }
    
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`;
    const params = new URLSearchParams({
      'vs_currency': vsCurrency,
      'days': numDays.toString()
    });
    
    // Add interval for specific timeframes
    if (numDays === 1) {
      params.append('interval', 'hourly');
    } else if (typeof numDays === 'number' && numDays > 90) {
      params.append('interval', 'daily');
    }
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TrendBot/2.0'
    };
    
    const response = await fetch(`${url}?${params}`, { 
      headers,
      timeout: 15000 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const prices = (data.prices || []).map(pricePoint => ({
      timestamp: pricePoint[0],
      price: pricePoint[1]
    }));
    
    const volumes = (data.total_volumes || []).map(volumePoint => ({
      timestamp: volumePoint[0],
      volume: volumePoint[1]
    }));
    
    res.json({
      success: true,
      data: {
        prices,
        volumes,
        coin_id: coinId,
        days: numDays.toString(),
        vs_currency: vsCurrency
      },
      timestamp: Math.floor(Date.now() / 1000)
    });
    
  } catch (error) {
    console.error(`Error fetching chart data for ${req.params.coinId}:`, error.message);
    res.status(500).json({
      success: false,
      error: `Failed to fetch chart data for ${req.params.coinId}`,
      details: error.message
    });
  }
});

// Get trending cryptocurrencies
app.get('/api/trending', async (req, res) => {
  try {
    const url = "https://api.coingecko.com/api/v3/search/trending";
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TrendBot/2.0'
    };
    
    const response = await fetch(url, { 
      headers,
      timeout: 10000 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const trendingCoins = (data.coins || []).map(coinItem => {
      const coinData = coinItem.item || {};
      return {
        id: coinData.id,
        name: coinData.name,
        symbol: (coinData.symbol || '').toUpperCase(),
        market_cap_rank: coinData.market_cap_rank,
        thumb: coinData.thumb,
        score: coinItem.score || coinData.score || 0,
        price_btc: coinData.price_btc || 0
      };
    });
    
    res.json({
      success: true,
      data: trendingCoins,
      timestamp: Math.floor(Date.now() / 1000)
    });
    
  } catch (error) {
    console.error('Error fetching trending data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending data',
      details: error.message
    });
  }
});

// Get global market data
app.get('/api/global', async (req, res) => {
  try {
    const url = "https://api.coingecko.com/api/v3/global";
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TrendBot/2.0'
    };
    
    const response = await fetch(url, { 
      headers,
      timeout: 10000 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const globalData = data.data || {};
    
    res.json({
      success: true,
      data: {
        total_market_cap: globalData.total_market_cap?.usd || 0,
        total_volume: globalData.total_volume?.usd || 0,
        market_cap_percentage: globalData.market_cap_percentage || {},
        active_cryptocurrencies: globalData.active_cryptocurrencies || 0,
        upcoming_icos: globalData.upcoming_icos || 0,
        ongoing_icos: globalData.ongoing_icos || 0,
        ended_icos: globalData.ended_icos || 0,
        markets: globalData.markets || 0,
        market_cap_change_percentage_24h_usd: globalData.market_cap_change_percentage_24h_usd || 0
      },
      timestamp: Math.floor(Date.now() / 1000)
    });
    
  } catch (error) {
    console.error('Error fetching global data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch global market data',
      details: error.message
    });
  }
});

// Get Fear & Greed Index
app.get('/api/fear-greed', async (req, res) => {
  try {
    const url = "https://api.alternative.me/fng/";
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TrendBot/2.0'
    };
    
    const response = await fetch(url, { 
      headers,
      timeout: 10000 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      data: data.data?.[0] || {},
      timestamp: Math.floor(Date.now() / 1000)
    });
    
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Fear & Greed Index',
      details: error.message
    });
  }
});

// Get top gainers and losers
app.get('/api/gainers-losers', async (req, res) => {
  try {
    const url = "https://api.coingecko.com/api/v3/coins/markets";
    const params = new URLSearchParams({
      'vs_currency': 'usd',
      'order': 'price_change_percentage_24h_desc',
      'per_page': '50',
      'page': '1',
      'sparkline': 'false',
      'price_change_percentage': '24h'
    });
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'TrendBot/2.0'
    };
    
    const response = await fetch(`${url}?${params}`, { 
      headers,
      timeout: 15000 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const gainers = data.slice(0, 10).map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      change_24h: coin.price_change_percentage_24h,
      image: coin.image
    }));
    
    const losers = data.slice(-10).reverse().map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      change_24h: coin.price_change_percentage_24h,
      image: coin.image
    }));
    
    res.json({
      success: true,
      data: {
        gainers,
        losers
      },
      timestamp: Math.floor(Date.now() / 1000)
    });
    
  } catch (error) {
    console.error('Error fetching gainers/losers:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gainers and losers data',
      details: error.message
    });
  }
});

// Error handlers
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found. Please check the URL.',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

app.use((error, req, res, next) => {
  console.error('Internal Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'An unexpected internal server error occurred.',
    code: 'INTERNAL_SERVER_ERROR',
    details: error.message
  });
});

// Initialize fetch and start server
(async () => {
  try {
    const { default: nodeFetch } = await import('node-fetch');
    fetch = nodeFetch;
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Starting TrendBot API Server v2.0...');
      console.log(`🌐 Server running on http://localhost:${PORT}`);
      console.log('✨ Enhanced with additional crypto features!');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
