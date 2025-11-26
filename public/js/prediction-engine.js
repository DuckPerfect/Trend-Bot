// TrendBot Prediction Engine - Optimized Version
class PredictionEngine {
  constructor() {
    this.models = new Map([
      ['sma', this.simpleMovingAverage],
      ['ema', this.exponentialMovingAverage],
      ['rsi', this.relativeStrengthIndex],
      ['macd', this.macdIndicator],
      ['bollinger', this.bollingerBands],
      ['fibonacci', this.fibonacciRetracement],
      ['support', this.supportResistance],
      ['trend', this.trendAnalysis],
      ['momentum', this.momentumAnalysis],
      ['volatility', this.volatilityAnalysis]
    ]);
    
    this.predictions = new Map();
    this.technicalIndicators = new Map();
    this.cache = new Map();
    this.workers = new Map();
    
    this.initializeWorkers();
  }

  // Initialize web workers for heavy calculations
  initializeWorkers() {
    if (typeof Worker !== 'undefined') {
      try {
        // Create worker for complex calculations
        const workerCode = `
          self.onmessage = function(e) {
            const { type, data, id } = e.data;
            
            try {
              let result;
              switch(type) {
                case 'correlation':
                  result = calculateCorrelation(data.x, data.y);
                  break;
                case 'regression':
                  result = calculateLinearRegression(data.x, data.y);
                  break;
                case 'volatility':
                  result = calculateVolatility(data.prices, data.period);
                  break;
                default:
                  throw new Error('Unknown calculation type');
              }
              
              self.postMessage({ id, result, success: true });
            } catch (error) {
              self.postMessage({ id, error: error.message, success: false });
            }
          };
          
          function calculateCorrelation(x, y) {
            const n = x.length;
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
            const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
            const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
            
            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
            
            return denominator === 0 ? 0 : numerator / denominator;
          }
          
          function calculateLinearRegression(x, y) {
            const n = x.length;
            const sumX = x.reduce((a, b) => a + b, 0);
            const sumY = y.reduce((a, b) => a + b, 0);
            const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
            const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            
            return { slope, intercept };
          }
          
          function calculateVolatility(prices, period) {
            const returns = [];
            for (let i = 1; i < prices.length; i++) {
              returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
            }
            
            const recentReturns = returns.slice(-period);
            const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
            const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / recentReturns.length;
            
            return {
              daily: Math.sqrt(variance),
              annualized: Math.sqrt(variance) * Math.sqrt(252)
            };
          }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.calculationWorker = new Worker(URL.createObjectURL(blob));
        
        this.calculationWorker.onmessage = (e) => {
          const { id, result, error, success } = e.data;
          const callback = this.workers.get(id);
          
          if (callback) {
            if (success) {
              callback.resolve(result);
            } else {
              callback.reject(new Error(error));
            }
            this.workers.delete(id);
          }
        };
      } catch (error) {
        console.warn('Web Workers not available, falling back to main thread calculations');
      }
    }
  }

  // Async calculation using web worker
  async calculateAsync(type, data) {
    if (!this.calculationWorker) {
      // Fallback to main thread
      return this.calculateSync(type, data);
    }
    
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9);
      this.workers.set(id, { resolve, reject });
      
      this.calculationWorker.postMessage({ type, data, id });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.workers.has(id)) {
          this.workers.delete(id);
          reject(new Error('Calculation timeout'));
        }
      }, 5000);
    });
  }

  // Synchronous fallback calculations
  calculateSync(type, data) {
    switch (type) {
      case 'correlation':
        return this.calculateCorrelation(data.x, data.y);
      case 'regression':
        return this.calculateLinearRegression(data.x, data.y);
      case 'volatility':
        return this.calculateVolatilitySync(data.prices, data.period);
      default:
        throw new Error('Unknown calculation type');
    }
  }

  // Optimized Simple Moving Average with caching
  simpleMovingAverage(prices, period = 20) {
    const cacheKey = `sma_${prices.length}_${period}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const sma = [];
    let sum = 0;
    
    // Calculate initial sum
    for (let i = 0; i < period && i < prices.length; i++) {
      sum += prices[i];
    }
    
    if (prices.length >= period) {
      sma.push(sum / period);
      
      // Use sliding window for efficiency
      for (let i = period; i < prices.length; i++) {
        sum = sum - prices[i - period] + prices[i];
        sma.push(sum / period);
      }
    }
    
    this.cache.set(cacheKey, sma);
    return sma;
  }

  // Optimized Exponential Moving Average
  exponentialMovingAverage(prices, period = 20) {
    const cacheKey = `ema_${prices.length}_${period}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    if (prices.length === 0) return ema;
    
    ema[0] = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }
    
    this.cache.set(cacheKey, ema);
    return ema;
  }

  // Optimized RSI calculation
  relativeStrengthIndex(prices, period = 14) {
    if (prices.length < period + 1) {
      return { value: 50, signal: 'neutral', strength: 0 };
    }
    
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Use Wilder's smoothing method
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    }
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return {
      value: rsi,
      signal: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral',
      strength: Math.abs(50 - rsi) / 50
    };
  }

  // Optimized MACD calculation
  macdIndicator(prices) {
    if (prices.length < 26) {
      return {
        macd: 0,
        signal: 0,
        histogram: 0,
        trend: 'neutral',
        strength: 0
      };
    }
    
    const ema12 = this.exponentialMovingAverage(prices, 12);
    const ema26 = this.exponentialMovingAverage(prices, 26);
    
    const macdLine = [];
    const startIndex = 25; // Start after EMA26 has enough data
    
    for (let i = startIndex; i < Math.min(ema12.length, ema26.length); i++) {
      macdLine.push(ema12[i] - ema26[i]);
    }
    
    if (macdLine.length === 0) {
      return {
        macd: 0,
        signal: 0,
        histogram: 0,
        trend: 'neutral',
        strength: 0
      };
    }
    
    const signalLine = this.exponentialMovingAverage(macdLine, 9);
    const histogram = [];
    
    for (let i = 0; i < Math.min(macdLine.length, signalLine.length); i++) {
      histogram.push(macdLine[i] - signalLine[i]);
    }
    
    const currentMacd = macdLine[macdLine.length - 1] || 0;
    const currentSignal = signalLine[signalLine.length - 1] || 0;
    const currentHistogram = histogram[histogram.length - 1] || 0;
    
    return {
      macd: currentMacd,
      signal: currentSignal,
      histogram: currentHistogram,
      trend: currentMacd > currentSignal ? 'bullish' : 'bearish',
      strength: Math.abs(currentMacd - currentSignal) / Math.max(Math.abs(currentMacd), 0.001)
    };
  }

  // Optimized Bollinger Bands
  bollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) {
      const currentPrice = prices[prices.length - 1] || 0;
      return {
        upper: currentPrice * 1.1,
        middle: currentPrice,
        lower: currentPrice * 0.9,
        width: 0.2,
        position: 'middle',
        squeeze: 'normal'
      };
    }
    
    const sma = this.simpleMovingAverage(prices, period);
    const bands = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (standardDeviation * stdDev),
        middle: mean,
        lower: mean - (standardDeviation * stdDev),
        width: (standardDeviation * stdDev * 2) / mean
      });
    }
    
    const current = bands[bands.length - 1];
    const currentPrice = prices[prices.length - 1];
    
    if (!current) {
      return {
        upper: currentPrice * 1.1,
        middle: currentPrice,
        lower: currentPrice * 0.9,
        width: 0.2,
        position: 'middle',
        squeeze: 'normal'
      };
    }
    
    return {
      ...current,
      position: currentPrice > current.upper ? 'above_upper' : 
                currentPrice < current.lower ? 'below_lower' : 'middle',
      squeeze: current.width < 0.1 ? 'tight' : current.width > 0.3 ? 'wide' : 'normal'
    };
  }

  // Fibonacci Retracement
  fibonacciRetracement(prices) {
    if (prices.length === 0) {
      return {
        levels: {},
        nearest: null,
        trend: 'neutral'
      };
    }
    
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;
    
    const levels = {
      '0%': high,
      '23.6%': high - (range * 0.236),
      '38.2%': high - (range * 0.382),
      '50%': high - (range * 0.5),
      '61.8%': high - (range * 0.618),
      '78.6%': high - (range * 0.786),
      '100%': low
    };
    
    const currentPrice = prices[prices.length - 1];
    let nearestLevel = null;
    let minDistance = Infinity;
    
    Object.entries(levels).forEach(([level, price]) => {
      const distance = Math.abs(currentPrice - price);
      if (distance < minDistance) {
        minDistance = distance;
        nearestLevel = { level, price, distance: distance / currentPrice };
      }
    });
    
    return {
      levels,
      nearest: nearestLevel,
      trend: currentPrice > levels['50%'] ? 'uptrend' : 'downtrend'
    };
  }

  // Support and Resistance with optimization
  supportResistance(prices, window = 10) {
    if (prices.length < window * 2 + 1) {
      const currentPrice = prices[prices.length - 1] || 0;
      return {
        supports: [{ price: currentPrice * 0.95, index: 0, strength: 1 }],
        resistances: [{ price: currentPrice * 1.05, index: 0, strength: 1 }],
        currentPrice
      };
    }
    
    const supports = [];
    const resistances = [];
    
    for (let i = window; i < prices.length - window; i++) {
      const current = prices[i];
      const leftWindow = prices.slice(i - window, i);
      const rightWindow = prices.slice(i + 1, i + window + 1);
      
      // Check for support (local minimum)
      if (leftWindow.every(p => p >= current) && rightWindow.every(p => p >= current)) {
        supports.push({ 
          price: current, 
          index: i, 
          strength: this.calculateLevelStrength(prices, current) 
        });
      }
      
      // Check for resistance (local maximum)
      if (leftWindow.every(p => p <= current) && rightWindow.every(p => p <= current)) {
        resistances.push({ 
          price: current, 
          index: i, 
          strength: this.calculateLevelStrength(prices, current) 
        });
      }
    }
    
    // Sort by strength and get top levels
    supports.sort((a, b) => b.strength - a.strength);
    resistances.sort((a, b) => b.strength - a.strength);
    
    return {
      supports: supports.slice(0, 3),
      resistances: resistances.slice(0, 3),
      currentPrice: prices[prices.length - 1]
    };
  }

  calculateLevelStrength(prices, level, tolerance = 0.02) {
    let touches = 0;
    const levelRange = level * tolerance;
    
    for (const price of prices) {
      if (Math.abs(price - level) <= levelRange) {
        touches++;
      }
    }
    
    return touches;
  }

  // Async trend analysis
  async trendAnalysis(prices, shortPeriod = 10, longPeriod = 50) {
    if (prices.length < longPeriod) {
      return {
        direction: 'neutral',
        strength: { slope: 0, correlation: 0, strength: 0, direction: 'neutral' },
        momentum: 'neutral',
        crossover: null,
        confidence: 0
      };
    }
    
    const shortSMA = this.simpleMovingAverage(prices, shortPeriod);
    const longSMA = this.simpleMovingAverage(prices, longPeriod);
    
    const currentShort = shortSMA[shortSMA.length - 1];
    const currentLong = longSMA[longSMA.length - 1];
    const prevShort = shortSMA[shortSMA.length - 2];
    const prevLong = longSMA[longSMA.length - 2];
    
    // Calculate trend strength using async worker if available
    const recentPrices = prices.slice(-20);
    let trendStrength;
    
    try {
      const x = Array.from({length: recentPrices.length}, (_, i) => i);
      trendStrength = await this.calculateAsync('regression', { x, y: recentPrices });
      
      const correlation = await this.calculateAsync('correlation', { x, y: recentPrices });
      trendStrength.correlation = correlation;
      trendStrength.strength = Math.abs(correlation);
      trendStrength.direction = trendStrength.slope > 0 ? 'up' : 'down';
    } catch (error) {
      // Fallback to sync calculation
      trendStrength = this.calculateTrendStrengthSync(recentPrices);
    }
    
    return {
      direction: currentShort > currentLong ? 'bullish' : 'bearish',
      strength: trendStrength,
      momentum: (currentShort - prevShort) > (currentLong - prevLong) ? 'accelerating' : 'decelerating',
      crossover: this.detectCrossover(shortSMA, longSMA),
      confidence: Math.abs(currentShort - currentLong) / currentLong
    };
  }

  calculateTrendStrengthSync(prices) {
    const n = prices.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = prices;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const correlation = this.calculateCorrelation(x, y);
    
    return {
      slope: slope,
      correlation: correlation,
      strength: Math.abs(correlation),
      direction: slope > 0 ? 'up' : 'down'
    };
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  detectCrossover(shortMA, longMA) {
    if (shortMA.length < 2 || longMA.length < 2) return null;
    
    const currentShort = shortMA[shortMA.length - 1];
    const currentLong = longMA[longMA.length - 1];
    const prevShort = shortMA[shortMA.length - 2];
    const prevLong = longMA[longMA.length - 2];
    
    if (prevShort <= prevLong && currentShort > currentLong) {
      return 'golden_cross'; // Bullish
    } else if (prevShort >= prevLong && currentShort < currentLong) {
      return 'death_cross'; // Bearish
    }
    
    return null;
  }

  // Momentum Analysis
  momentumAnalysis(prices, period = 14) {
    if (prices.length < period + 1) {
      return {
        current: 0,
        average: 0,
        signal: 'neutral',
        direction: 'neutral'
      };
    }
    
    const momentum = [];
    for (let i = period; i < prices.length; i++) {
      momentum.push(prices[i] - prices[i - period]);
    }
    
    const currentMomentum = momentum[momentum.length - 1];
    const avgMomentum = momentum.reduce((a, b) => a + b, 0) / momentum.length;
    
    return {
      current: currentMomentum,
      average: avgMomentum,
      signal: currentMomentum > avgMomentum ? 'strong' : 'weak',
      direction: currentMomentum > 0 ? 'positive' : 'negative'
    };
  }

  // Async Volatility Analysis
  async volatilityAnalysis(prices, period = 20) {
    if (prices.length < 2) {
      return {
        daily: 0,
        annualized: 0,
        level: 'low',
        percentile: 0.5
      };
    }
    
    try {
      const volatilityData = await this.calculateAsync('volatility', { prices, period });
      
      return {
        daily: volatilityData.daily,
        annualized: volatilityData.annualized,
        level: volatilityData.annualized < 0.2 ? 'low' : 
               volatilityData.annualized > 0.5 ? 'high' : 'medium',
        percentile: this.calculateVolatilityPercentile(volatilityData.annualized, prices)
      };
    } catch (error) {
      // Fallback to sync calculation
      return this.calculateVolatilitySync(prices, period);
    }
  }

  calculateVolatilitySync(prices, period = 20) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const recentReturns = returns.slice(-period);
    const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
    const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / recentReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
    
    return {
      daily: Math.sqrt(variance),
      annualized: volatility,
      level: volatility < 0.2 ? 'low' : volatility > 0.5 ? 'high' : 'medium',
      percentile: this.calculateVolatilityPercentile(volatility, returns)
    };
  }

  calculateVolatilityPercentile(currentVol, allReturns) {
    const historicalVols = [];
    const period = 20;
    
    for (let i = period; i < allReturns.length; i++) {
      const slice = allReturns.slice(i - period, i);
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
      const variance = slice.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / slice.length;
      historicalVols.push(Math.sqrt(variance) * Math.sqrt(252));
    }
    
    historicalVols.sort((a, b) => a - b);
    const rank = historicalVols.findIndex(vol => vol >= currentVol);
    return rank === -1 ? 1 : rank / historicalVols.length;
  }

  // Optimized prediction generation
  async generatePrediction(coinId, prices, timeframe = '7d') {
    const startTime = performance.now();
    
    try {
      const analysis = await this.performCompleteAnalysis(prices);
      const prediction = this.calculatePricePrediction(prices, analysis, timeframe);
      
      this.predictions.set(coinId, {
        ...prediction,
        analysis,
        timestamp: Date.now(),
        timeframe,
        processingTime: performance.now() - startTime
      });
      
      return this.predictions.get(coinId);
    } catch (error) {
      console.error('Error generating prediction:', error);
      throw error;
    }
  }

  async performCompleteAnalysis(prices) {
    // Run analyses in parallel for better performance
    const [
      trend,
      rsi,
      macd,
      bollinger,
      fibonacci,
      supportResistance,
      momentum,
      volatility
    ] = await Promise.all([
      this.trendAnalysis(prices),
      Promise.resolve(this.relativeStrengthIndex(prices)),
      Promise.resolve(this.macdIndicator(prices)),
      Promise.resolve(this.bollingerBands(prices)),
      Promise.resolve(this.fibonacciRetracement(prices)),
      Promise.resolve(this.supportResistance(prices)),
      Promise.resolve(this.momentumAnalysis(prices)),
      this.volatilityAnalysis(prices)
    ]);
    
    return {
      trend,
      rsi,
      macd,
      bollinger,
      fibonacci,
      supportResistance,
      momentum,
      volatility
    };
  }

  calculatePricePrediction(prices, analysis, timeframe) {
    const currentPrice = prices[prices.length - 1];
    const timeframeDays = this.parseTimeframe(timeframe);
    
    // Weighted prediction based on multiple indicators
    const weights = {
      trend: 0.3,
      rsi: 0.15,
      macd: 0.2,
      bollinger: 0.15,
      momentum: 0.1,
      volatility: 0.1
    };
    
    let bullishScore = 0;
    let bearishScore = 0;
    
    // Trend analysis
    if (analysis.trend.direction === 'bullish') {
      bullishScore += weights.trend * analysis.trend.confidence;
    } else {
      bearishScore += weights.trend * analysis.trend.confidence;
    }
    
    // RSI analysis
    if (analysis.rsi.signal === 'oversold') {
      bullishScore += weights.rsi * analysis.rsi.strength;
    } else if (analysis.rsi.signal === 'overbought') {
      bearishScore += weights.rsi * analysis.rsi.strength;
    }
    
    // MACD analysis
    if (analysis.macd.trend === 'bullish') {
      bullishScore += weights.macd * analysis.macd.strength;
    } else {
      bearishScore += weights.macd * analysis.macd.strength;
    }
    
    // Bollinger Bands
    if (analysis.bollinger.position === 'below_lower') {
      bullishScore += weights.bollinger * 0.8;
    } else if (analysis.bollinger.position === 'above_upper') {
      bearishScore += weights.bollinger * 0.8;
    }
    
    // Momentum
    if (analysis.momentum.direction === 'positive' && analysis.momentum.signal === 'strong') {
      bullishScore += weights.momentum;
    } else if (analysis.momentum.direction === 'negative') {
      bearishScore += weights.momentum;
    }
    
    // Calculate prediction
    const netScore = bullishScore - bearishScore;
    const confidence = Math.min(Math.abs(netScore), 1);
    const direction = netScore > 0 ? 'bullish' : 'bearish';
    
    // Price targets based on volatility and support/resistance
    const volatilityFactor = analysis.volatility.daily * timeframeDays;
    const baseChange = netScore * volatilityFactor * currentPrice;
    
    const targets = this.calculatePriceTargets(currentPrice, analysis, baseChange, timeframeDays);
    
    return {
      direction,
      confidence,
      currentPrice,
      targets,
      timeframe: timeframeDays,
      signals: this.generateTradingSignals(analysis),
      riskLevel: this.calculateRiskLevel(analysis),
      accuracy: this.estimateAccuracy(analysis, timeframeDays)
    };
  }

  calculatePriceTargets(currentPrice, analysis, baseChange, days) {
    const volatility = analysis.volatility.daily;
    const supportResistance = analysis.supportResistance;
    
    // Conservative, moderate, and aggressive targets
    const conservative = currentPrice + (baseChange * 0.5);
    const moderate = currentPrice + baseChange;
    const aggressive = currentPrice + (baseChange * 1.5);
    
    // Adjust based on support/resistance levels
    const nearestSupport = supportResistance.supports[0]?.price || currentPrice * 0.9;
    const nearestResistance = supportResistance.resistances[0]?.price || currentPrice * 1.1;
    
    return {
      conservative: Math.max(conservative, nearestSupport),
      moderate: moderate,
      aggressive: Math.min(aggressive, nearestResistance),
      support: nearestSupport,
      resistance: nearestResistance,
      stopLoss: currentPrice - (volatility * currentPrice * Math.sqrt(days) * 2)
    };
  }

  generateTradingSignals(analysis) {
    const signals = [];
    
    // Trend signals
    if (analysis.trend.crossover === 'golden_cross') {
      signals.push({ type: 'buy', strength: 'strong', reason: 'Golden Cross detected' });
    } else if (analysis.trend.crossover === 'death_cross') {
      signals.push({ type: 'sell', strength: 'strong', reason: 'Death Cross detected' });
    }
    
    // RSI signals
    if (analysis.rsi.signal === 'oversold') {
      signals.push({ type: 'buy', strength: 'medium', reason: 'RSI oversold condition' });
    } else if (analysis.rsi.signal === 'overbought') {
      signals.push({ type: 'sell', strength: 'medium', reason: 'RSI overbought condition' });
    }
    
    // MACD signals
    if (analysis.macd.histogram > 0 && analysis.macd.trend === 'bullish') {
      signals.push({ type: 'buy', strength: 'medium', reason: 'MACD bullish momentum' });
    } else if (analysis.macd.histogram < 0 && analysis.macd.trend === 'bearish') {
      signals.push({ type: 'sell', strength: 'medium', reason: 'MACD bearish momentum' });
    }
    
    // Bollinger Bands signals
    if (analysis.bollinger.position === 'below_lower') {
      signals.push({ type: 'buy', strength: 'medium', reason: 'Price below lower Bollinger Band' });
    } else if (analysis.bollinger.position === 'above_upper') {
      signals.push({ type: 'sell', strength: 'medium', reason: 'Price above upper Bollinger Band' });
    }
    
    return signals;
  }

  calculateRiskLevel(analysis) {
    let riskScore = 0;
    
    // Volatility risk
    if (analysis.volatility.level === 'high') riskScore += 3;
    else if (analysis.volatility.level === 'medium') riskScore += 2;
    else riskScore += 1;
    
    // Trend consistency risk
    if (analysis.trend.confidence < 0.3) riskScore += 2;
    
    // RSI extreme risk
    if (analysis.rsi.signal !== 'neutral') riskScore += 1;
    
    // Bollinger squeeze risk
    if (analysis.bollinger.squeeze === 'tight') riskScore += 2;
    
    if (riskScore <= 3) return 'low';
    if (riskScore <= 6) return 'medium';
    return 'high';
  }

  estimateAccuracy(analysis, days) {
    let accuracyScore = 0.5; // Base 50%
    
    // Higher accuracy for shorter timeframes
    if (days <= 1) accuracyScore += 0.2;
    else if (days <= 7) accuracyScore += 0.1;
    else if (days > 30) accuracyScore -= 0.1;
    
    // Higher accuracy with strong trends
    if (analysis.trend.confidence > 0.7) accuracyScore += 0.15;
    else if (analysis.trend.confidence < 0.3) accuracyScore -= 0.1;
    
    // Lower accuracy with high volatility
    if (analysis.volatility.level === 'high') accuracyScore -= 0.15;
    else if (analysis.volatility.level === 'low') accuracyScore += 0.1;
    
    // Consistent signals increase accuracy
    const signals = this.generateTradingSignals(analysis);
    const buySignals = signals.filter(s => s.type === 'buy').length;
    const sellSignals = signals.filter(s => s.type === 'sell').length;
    
    if (Math.abs(buySignals - sellSignals) >= 2) {
      accuracyScore += 0.1;
    }
    
    return Math.max(0.3, Math.min(0.9, accuracyScore));
  }

  parseTimeframe(timeframe) {
    const timeframeMap = {
      '1h': 1/24,
      '4h': 1/6,
      '1d': 1,
      '3d': 3,
      '7d': 7,
      '14d': 14,
      '30d': 30
    };
    
    return timeframeMap[timeframe] || 7;
  }

  // Cache management
  clearCache() {
    this.cache.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }

  // Cleanup method
  destroy() {
    this.clearCache();
    this.predictions.clear();
    this.technicalIndicators.clear();
    
    if (this.calculationWorker) {
      this.calculationWorker.terminate();
    }
    
    this.workers.clear();
  }
}

// Export for global use
window.PredictionEngine = PredictionEngine;