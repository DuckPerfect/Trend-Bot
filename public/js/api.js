// Optimized API manager for GitHub Pages deployment
class APIManager {
  constructor() {
    this.cache = new CacheManager();
    this.requestQueue = new Map();
    this.batchTimeout = 50; // ms
    this.maxRetries = 3;
    this.baseDelay = 1000; // ms
  }

  // Convert relative API URLs to direct API calls for GitHub Pages
  convertToDirectAPI(url) {
    const baseUrl = window.location.origin;
    
    // Map internal API endpoints to external APIs
    const apiMappings = {
      '/api/trends': 'https://api.coingecko.com/api/v3/coins/markets',
      '/api/global': 'https://api.coingecko.com/api/v3/global',
      '/api/trending': 'https://api.coingecko.com/api/v3/search/trending',
      '/api/fear-greed': 'https://api.alternative.me/fng/',
      '/api/gainers-losers': 'https://api.coingecko.com/api/v3/coins/markets',
      '/api/search': 'https://api.coingecko.com/api/v3/search',
      '/api/coin/': 'https://api.coingecko.com/api/v3/coins/',
      '/api/chart/': 'https://api.coingecko.com/api/v3/coins/'
    };

    // Handle different API endpoints
    if (url.startsWith('/api/trends')) {
      const params = new URLSearchParams(url.split('?')[1] || '');
      const timeframe = params.get('timeframe') || '24h';
      const market = params.get('market') || 'all';
      const limit = params.get('limit') || '10';
      
      const apiParams = new URLSearchParams({
        'vs_currency': 'usd',
        'order': 'market_cap_desc',
        'per_page': limit,
        'page': '1',
        'sparkline': 'false',
        'price_change_percentage': '1h,24h,7d,30d'
      });

      if (market !== 'all' && market !== 'crypto') {
        const categoryMapping = {
          'defi': 'decentralized-finance-defi',
          'nft': 'non-fungible-tokens-nft',
          'gaming': 'gaming',
          'layer-1': 'layer-1',
          'layer-2': 'layer-2'
        };
        if (categoryMapping[market]) {
          apiParams.append('category', categoryMapping[market]);
        }
      }

      return `${apiMappings['/api/trends']}?${apiParams}`;
    }

    if (url.startsWith('/api/search')) {
      const params = new URLSearchParams(url.split('?')[1] || '');
      const query = params.get('q');
      return `${apiMappings['/api/search']}?query=${encodeURIComponent(query)}`;
    }

    if (url.startsWith('/api/coin/')) {
      const coinId = url.split('/api/coin/')[1].split('?')[0];
      const apiParams = new URLSearchParams({
        'localization': 'false',
        'tickers': 'false',
        'market_data': 'true',
        'community_data': 'true',
        'developer_data': 'true',
        'sparkline': 'false'
      });
      return `${apiMappings['/api/coin/']}${coinId}?${apiParams}`;
    }

    if (url.startsWith('/api/chart/')) {
      const parts = url.split('/api/chart/')[1].split('?');
      const coinId = parts[0];
      const params = new URLSearchParams(parts[1] || '');
      const days = params.get('days') || '7';
      const vsCurrency = params.get('vs_currency') || 'usd';
      
      const apiParams = new URLSearchParams({
        'vs_currency': vsCurrency,
        'days': days
      });

      if (days === '1') {
        apiParams.append('interval', 'hourly');
      } else if (parseInt(days) > 90) {
        apiParams.append('interval', 'daily');
      }

      return `${apiMappings['/api/coin/']}${coinId}/market_chart?${apiParams}`;
    }

    if (url.startsWith('/api/gainers-losers')) {
      const apiParams = new URLSearchParams({
        'vs_currency': 'usd',
        'order': 'price_change_percentage_24h_desc',
        'per_page': '50',
        'page': '1',
        'sparkline': 'false',
        'price_change_percentage': '24h'
      });
      return `${apiMappings['/api/gainers-losers']}?${apiParams}`;
    }

    // Direct mappings
    for (const [apiPath, directUrl] of Object.entries(apiMappings)) {
      if (url.startsWith(apiPath)) {
        return directUrl;
      }
    }

    return url;
  }

  // Process API response to match expected format
  processResponse(url, data) {
    if (url.includes('/api/trends') || url.includes('coins/markets')) {
      return {
        success: true,
        data: data.map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          price: coin.current_price || 0,
          change_24h: coin.price_change_percentage_24h || 0,
          market_cap: coin.market_cap || 0,
          trend: (coin.price_change_percentage_24h || 0) > 0 ? 'up' : 'down',
          volume_24h: coin.total_volume || 0,
          image: coin.image || '',
          market_cap_rank: coin.market_cap_rank || 0,
          ath: coin.ath || 0,
          ath_change_percentage: coin.ath_change_percentage || 0,
          circulating_supply: coin.circulating_supply || 0,
          total_supply: coin.total_supply || 0,
          max_supply: coin.max_supply || 0
        })),
        timestamp: Math.floor(Date.now() / 1000)
      };
    }

    if (url.includes('/api/global') || url.includes('global')) {
      const globalData = data.data || data;
      return {
        success: true,
        data: {
          total_market_cap: globalData.total_market_cap?.usd || 0,
          total_volume: globalData.total_volume?.usd || 0,
          market_cap_percentage: globalData.market_cap_percentage || {},
          active_cryptocurrencies: globalData.active_cryptocurrencies || 0,
          markets: globalData.markets || 0,
          market_cap_change_percentage_24h_usd: globalData.market_cap_change_percentage_24h_usd || 0
        },
        timestamp: Math.floor(Date.now() / 1000)
      };
    }

    if (url.includes('/api/trending') || url.includes('trending')) {
      return {
        success: true,
        data: (data.coins || []).map(coinItem => {
          const coin = coinItem.item || coinItem;
          return {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol?.toUpperCase() || '',
            market_cap_rank: coin.market_cap_rank,
            thumb: coin.thumb,
            score: coin.score || 0
          };
        }),
        timestamp: Math.floor(Date.now() / 1000)
      };
    }

    if (url.includes('/api/fear-greed') || url.includes('alternative.me')) {
      return {
        success: true,
        data: data.data?.[0] || data,
        timestamp: Math.floor(Date.now() / 1000)
      };
    }

    if (url.includes('/api/search') || url.includes('search')) {
      return {
        success: true,
        data: (data.coins || []).slice(0, 10).map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol?.toUpperCase() || '',
          market_cap_rank: coin.market_cap_rank,
          thumb: coin.thumb || '',
          large: coin.large || ''
        })),
        timestamp: Math.floor(Date.now() / 1000)
      };
    }

    if (url.includes('/api/coin/') || (url.includes('coins/') && !url.includes('markets'))) {
      if (url.includes('market_chart')) {
        // Chart data
        return {
          success: true,
          data: {
            prices: (data.prices || []).map(pricePoint => ({
              timestamp: pricePoint[0],
              price: pricePoint[1]
            })),
            volumes: (data.total_volumes || []).map(volumePoint => ({
              timestamp: volumePoint[0],
              volume: volumePoint[1]
            }))
          },
          timestamp: Math.floor(Date.now() / 1000)
        };
      } else {
        // Coin details
        const marketData = data.market_data || {};
        return {
          success: true,
          data: {
            id: data.id,
            name: data.name,
            symbol: (data.symbol || '').toUpperCase(),
            current_price: marketData.current_price?.usd || 0,
            market_cap: marketData.market_cap?.usd || 0,
            price_change_percentage_24h: marketData.price_change_percentage_24h || 0,
            volume_24h: marketData.total_volume?.usd || 0,
            market_cap_rank: data.market_cap_rank || 0,
            ath: marketData.ath?.usd || 0,
            ath_change_percentage: marketData.ath_change_percentage?.usd || 0,
            circulating_supply: marketData.circulating_supply || 0,
            total_supply: marketData.total_supply || 0,
            max_supply: marketData.max_supply || 0,
            description: data.description?.en?.substring(0, 500) || 'No description available.',
            image: data.image?.large || ''
          },
          timestamp: Math.floor(Date.now() / 1000)
        };
      }
    }

    if (url.includes('/api/gainers-losers')) {
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

      return {
        success: true,
        data: { gainers, losers },
        timestamp: Math.floor(Date.now() / 1000)
      };
    }

    // Default response format
    return {
      success: true,
      data: data,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  // Make optimized request with caching and retry logic
  async makeRequest({ url, options = {}, cacheKey, cacheTTL, retries = 0 }) {
    // Check cache first
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Convert to direct API URL for GitHub Pages
      const directUrl = this.convertToDirectAPI(url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(directUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrendBot/2.0',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      const processedData = this.processResponse(url, rawData);

      // Cache successful response
      if (cacheKey) {
        this.cache.set(cacheKey, processedData, cacheTTL);
      }

      return processedData;

    } catch (error) {
      // Retry logic with exponential backoff
      if (retries < this.maxRetries && error.name !== 'AbortError') {
        const delay = this.baseDelay * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest({ url, options, cacheKey, cacheTTL, retries: retries + 1 });
      }

      console.error('API request failed:', error);
      throw error;
    }
  }

  // Batch multiple requests
  async batchRequest(requests) {
    const batchKey = JSON.stringify(requests.map(r => r.url).sort());
    
    if (this.requestQueue.has(batchKey)) {
      return this.requestQueue.get(batchKey);
    }

    const batchPromise = this.executeBatch(requests);
    this.requestQueue.set(batchKey, batchPromise);
    
    // Clean up after batch completes
    batchPromise.finally(() => {
      this.requestQueue.delete(batchKey);
    });

    return batchPromise;
  }

  async executeBatch(requests) {
    const results = await Promise.allSettled(
      requests.map(request => this.makeRequest(request))
    );

    return results.map((result, index) => ({
      url: requests[index].url,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Preload data
  async preload(requests) {
    return Promise.allSettled(
      requests.map(request => this.makeRequest(request))
    );
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Export for use in main script
window.APIManager = APIManager;