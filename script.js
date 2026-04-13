// ==================== STOCK DATA ENGINE ====================
class StockDataEngine {
    constructor() {
        this.stocks = new Map();
        this.initializeStocks();
    }

    initializeStocks() {
        const stockConfigs = [
            { ticker: 'AAPL', basePrice: 230.50, name: 'Apple Inc.' },
            { ticker: 'TSLA', basePrice: 242.80, name: 'Tesla Inc.' },
            { ticker: 'GOOGL', basePrice: 140.23, name: 'Alphabet Inc.' },
            { ticker: 'MSFT', basePrice: 420.15, name: 'Microsoft Corp.' },
            { ticker: 'AMZN', basePrice: 175.90, name: 'Amazon.com Inc.' },
            { ticker: 'RELIANCE', basePrice: 2850.45, name: 'Reliance Industries' },
            { ticker: 'INFY', basePrice: 1645.30, name: 'Infosys Limited' },
            { ticker: 'TCS', basePrice: 3850.75, name: 'Tata Consultancy Services' },
            { ticker: 'NVDA', basePrice: 875.40, name: 'NVIDIA Corporation' },
            { ticker: 'META', basePrice: 485.60, name: 'Meta Platforms Inc.' }
        ];

        stockConfigs.forEach(config => {
            this.stocks.set(config.ticker, {
                ...config,
                priceHistory: this.generatePriceHistory(config.basePrice),
                lastUpdate: Date.now()
            });
        });
    }

    generatePriceHistory(basePrice, days = 7) {
        const history = [];
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        let price = basePrice;

        for (let i = days - 1; i >= 0; i--) {
            const volatility = (Math.random() - 0.5) * basePrice * 0.05;
            price = Math.max(price * 0.85, Math.min(price * 1.15, price + volatility));
            history.push({
                timestamp: now - (i * dayMs),
                open: price * (0.98 + Math.random() * 0.04),
                close: price,
                high: price * (1 + Math.random() * 0.02),
                low: price * (0.98 - Math.random() * 0.01),
                volume: Math.floor(Math.random() * 100000000) + 50000000
            });
        }
        return history;
    }

    getStock(ticker) {
        return this.stocks.get(ticker.toUpperCase());
    }

    getCurrentPrice(ticker) {
        const stock = this.getStock(ticker);
        if (!stock) return null;
        return stock.priceHistory[stock.priceHistory.length - 1].close;
    }

    getPriceChange(ticker) {
        const stock = this.getStock(ticker);
        if (!stock) return null;
        const current = stock.priceHistory[stock.priceHistory.length - 1].close;
        const previous = stock.priceHistory[stock.priceHistory.length - 2].close;
        return current - previous;
    }

    getPriceChangePercent(ticker) {
        const stock = this.getStock(ticker);
        if (!stock) return null;
        const change = this.getPriceChange(ticker);
        const previous = stock.priceHistory[stock.priceHistory.length - 2].close;
        return (change / previous) * 100;
    }

    simulateLiveUpdate(ticker) {
        const stock = this.getStock(ticker);
        if (!stock) return null;

        const lastPrice = stock.priceHistory[stock.priceHistory.length - 1].close;
        const volatility = (Math.random() - 0.5) * lastPrice * 0.02;
        const newPrice = Math.max(lastPrice * 0.95, Math.min(lastPrice * 1.05, lastPrice + volatility));
        
        stock.priceHistory.push({
            timestamp: Date.now(),
            open: lastPrice,
            close: newPrice,
            high: Math.max(lastPrice, newPrice),
            low: Math.min(lastPrice, newPrice),
            volume: Math.floor(Math.random() * 50000000) + 25000000
        });

        if (stock.priceHistory.length > 100) {
            stock.priceHistory.shift();
        }

        return newPrice;
    }

    getAllStocks() {
        return Array.from(this.stocks.values()).map(stock => ({
            ticker: stock.ticker,
            name: stock.name,
            price: stock.priceHistory[stock.priceHistory.length - 1].close,
            change: this.getPriceChange(stock.ticker),
            changePercent: this.getPriceChangePercent(stock.ticker)
        }));
    }
}

// ==================== TECHNICAL INDICATORS ====================
class TechnicalAnalysis {
    static calculateSMA(prices, period) {
        if (prices.length < period) return null;
        let sum = 0;
        for (let i = prices.length - period; i < prices.length; i++) {
            sum += prices[i];
        }
        return sum / period;
    }

    static calculateEMA(prices, period) {
        if (prices.length < period) return null;
        let sma = this.calculateSMA(prices.slice(0, period), period);
        const k = 2 / (period + 1);
        let ema = sma;

        for (let i = period; i < prices.length; i++) {
            ema = prices[i] * k + ema * (1 - k);
        }
        return ema;
    }

    static calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;

        let gains = 0, losses = 0;
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses += Math.abs(change);
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        if (prices.length < slowPeriod) return null;

        const emaFast = this.calculateEMA(prices, fastPeriod);
        const emaSlow = this.calculateEMA(prices, slowPeriod);
        const macd = emaFast - emaSlow;

        const macdLine = [];
        for (let i = slowPeriod - 1; i < prices.length; i++) {
            const fast = this.calculateEMA(prices.slice(0, i + 1), fastPeriod);
            const slow = this.calculateEMA(prices.slice(0, i + 1), slowPeriod);
            if (fast && slow) macdLine.push(fast - slow);
        }

        let signalLine = this.calculateEMA(macdLine, signalPeriod);
        return {
            macd: macd,
            signal: signalLine,
            histogram: macd - signalLine
        };
    }

    static calculateBollingerBands(prices, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(prices, period);
        if (!sma) return null;

        let variance = 0;
        for (let i = prices.length - period; i < prices.length; i++) {
            variance += Math.pow(prices[i] - sma, 2);
        }
        const std = Math.sqrt(variance / period);

        return {
            upper: sma + (std * stdDev),
            middle: sma,
            lower: sma - (std * stdDev)
        };
    }

    static calculateATR(highPrices, lowPrices, closePrices, period = 14) {
        if (highPrices.length < period) return null;

        let trueRanges = [];
        for (let i = 1; i < closePrices.length; i++) {
            const tr1 = highPrices[i] - lowPrices[i];
            const tr2 = Math.abs(highPrices[i] - closePrices[i - 1]);
            const tr3 = Math.abs(lowPrices[i] - closePrices[i - 1]);
            trueRanges.push(Math.max(tr1, tr2, tr3));
        }

        return this.calculateSMA(trueRanges, period);
    }

    static calculateVolatility(prices, period = 20) {
        if (prices.length < period) return null;

        const returns = [];
        for (let i = prices.length - period; i < prices.length; i++) {
            const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
            returns.push(ret);
        }

        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        return Math.sqrt(variance) * 100;
    }
}

// ==================== AI PREDICTION ENGINE ====================
class AIPredictionEngine {
    static generatePrediction(stock, indicators) {
        const { rsi, macd, sma20, currentPrice, prices } = indicators;
        let signal = 'HOLD';
        let confidence = 50;
        let reasoning = [];

        // RSI Analysis
        if (rsi < 30) {
            signal = 'BUY';
            confidence += 25;
            reasoning.push('RSI indicates oversold conditions (< 30)');
        } else if (rsi > 70) {
            signal = 'SELL';
            confidence += 25;
            reasoning.push('RSI indicates overbought conditions (> 70)');
        } else if (rsi > 50) {
            confidence += 10;
            reasoning.push('Bullish RSI momentum detected');
        }

        // MACD Analysis
        if (macd && macd.histogram > 0 && signal !== 'SELL') {
            signal = signal === 'HOLD' ? 'BUY' : 'BUY';
            confidence += 20;
            reasoning.push('MACD histogram positive - bullish crossover');
        } else if (macd && macd.histogram < 0 && signal !== 'BUY') {
            signal = signal === 'HOLD' ? 'SELL' : 'SELL';
            confidence += 20;
            reasoning.push('MACD histogram negative - bearish crossover');
        }

        // Price vs SMA Analysis
        if (sma20 && currentPrice > sma20 * 1.02) {
            signal = signal === 'SELL' ? 'HOLD' : signal;
            confidence += 15;
            reasoning.push(`Price above 20-SMA (bullish trend)`);
        } else if (sma20 && currentPrice < sma20 * 0.98) {
            signal = signal === 'BUY' ? 'HOLD' : signal;
            confidence += 15;
            reasoning.push(`Price below 20-SMA (bearish trend)`);
        }

        // Trend Analysis
        const trend = this.analyzeTrend(prices);
        if (trend === 'UPTREND') {
            signal = signal === 'SELL' ? 'HOLD' : signal;
            reasoning.push('Strong uptrend detected');
        } else if (trend === 'DOWNTREND') {
            signal = signal === 'BUY' ? 'HOLD' : signal;
            reasoning.push('Strong downtrend detected');
        }

        // Volatility Adjustment
        const volatility = TechnicalAnalysis.calculateVolatility(prices);
        if (volatility > 3) {
            confidence -= 10;
            reasoning.push(`High volatility (${volatility.toFixed(2)}%) - increased risk`);
        }

        confidence = Math.max(30, Math.min(95, confidence));

        // Predicted Price
        const momentum = (prices[prices.length - 1] - prices[Math.max(0, prices.length - 5)]) / prices[Math.max(0, prices.length - 5)];
        const predictedPrice = currentPrice * (1 + momentum * 0.5);

        return {
            signal,
            confidence: Math.round(confidence),
            predictedPrice,
            reasoning,
            trend
        };
    }

    static analyzeTrend(prices, period = 7) {
        if (prices.length < period) return 'NEUTRAL';

        let upCount = 0, downCount = 0;
        for (let i = prices.length - period; i < prices.length - 1; i++) {
            if (prices[i] < prices[i + 1]) upCount++;
            else downCount++;
        }

        if (upCount > downCount * 1.5) return 'UPTREND';
        if (downCount > upCount * 1.5) return 'DOWNTREND';
        return 'NEUTRAL';
    }

    static calculateSupportResistance(prices) {
        const length = 20;
        if (prices.length < length) {
            return {
                resistance1: Math.max(...prices),
                support1: Math.min(...prices)
            };
        }

        const recentPrices = prices.slice(-length);
        const high = Math.max(...recentPrices);
        const low = Math.min(...recentPrices);
        const range = high - low;

        return {
            resistance1: high,
            resistance2: high + (range * 0.25),
            support1: low,
            support2: low - (range * 0.25)
        };
    }

    static recognizePatterns(prices) {
        const patterns = [];
        if (prices.length < 5) return patterns;

        const recent = prices.slice(-5);
        
        // Ascending Triangle
        if (recent[0] < recent[2] && recent[2] < recent[4] && 
            recent[1] > recent[3] && Math.abs(recent[3] - recent[1]) < range * 0.05) {
            patterns.push('Ascending Triangle - Bullish breakout expected');
        }

        // Double Bottom
        if (recent[0] === recent[4] && recent[2] < recent[0] && 
            recent[3] > recent[2]) {
            patterns.push('Double Bottom - Reversal signal');
        }

        // Head and Shoulders
        if (recent[1] < recent[3] && recent[3] > recent[1] && recent[2] > recent[1]) {
            patterns.push('Head and Shoulders - Potential reversal');
        }

        if (patterns.length === 0) {
            patterns.push('No distinctive patterns detected');
        }

        return patterns;
    }
}

// ==================== UI CONTROLLER ====================
class UIController {
    constructor() {
        this.dataEngine = new StockDataEngine();
        this.currentStock = null;
        this.chart = null;
        this.portfolio = this.loadPortfolio();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.startSimulation();
        setInterval(() => this.updateTime(), 1000);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
                this.updateNavActive(item);
            });
        });

        // Search
        document.getElementById('searchBtn').addEventListener('click', () => {
            const ticker = document.getElementById('tickerInput').value.toUpperCase();
            if (ticker) this.loadStock(ticker);
        });

        document.getElementById('tickerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const ticker = document.getElementById('tickerInput').value.toUpperCase();
                if (ticker) this.loadStock(ticker);
            }
        });

        // Chart Controls
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Calculator
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calculateInvestment();
        });

        // Portfolio
        document.getElementById('addStockBtn').addEventListener('click', () => {
            this.addToPortfolio();
        });

        // Live Updates
        setInterval(() => {
            if (this.currentStock) {
                this.dataEngine.simulateLiveUpdate(this.currentStock);
                this.updateDashboard();
            }
        }, 5000);

        // Initial Load
        this.loadStock('AAPL');
        this.updateMarketPage();
        this.updatePortfolioPage();
    }

    switchPage(pageName) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(`${pageName}-page`).classList.add('active');

        if (pageName === 'market') this.updateMarketPage();
        if (pageName === 'portfolio') this.updatePortfolioPage();
        if (pageName === 'insights') this.updateInsightsPage();
    }

    updateNavActive(item) {
        document.querySelectorAll('.nav-item').forEach(i => {
            i.classList.remove('active');
        });
        item.classList.add('active');
    }

    loadStock(ticker) {
        const stock = this.dataEngine.getStock(ticker);
        if (!stock) {
            alert('Stock not found. Try: AAPL, TSLA, GOOGL, MSFT, AMZN, RELIANCE, INFY, TCS, NVDA, META');
            return;
        }

        this.currentStock = ticker;
        document.getElementById('tickerInput').value = ticker;
        this.updateDashboard();
    }

    updateDashboard() {
        if (!this.currentStock) return;

        const stock = this.dataEngine.getStock(this.currentStock);
        const history = stock.priceHistory;
        const prices = history.map(h => h.close);
        const currentPrice = prices[prices.length - 1];
        const change = this.dataEngine.getPriceChange(this.currentStock);
        const changePercent = this.dataEngine.getPriceChangePercent(this.currentStock);

        // Update Price Card
        document.getElementById('stockTicker').textContent = this.currentStock;
        document.getElementById('companyName').textContent = stock.name;
        document.getElementById('currentPrice').textContent = `$${currentPrice.toFixed(2)}`;

        const changeElement = document.getElementById('priceChange');
        const percentElement = document.getElementById('changePercent');
        
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
        changeElement.className = change >= 0 ? 'change-amount' : 'change-amount negative';
        
        percentElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
        percentElement.className = changePercent >= 0 ? 'change-percent' : 'change-percent negative';

        const highs = history.map(h => h.high);
        const lows = history.map(h => h.low);
        const volumes = history.map(h => h.volume);

        document.getElementById('highPrice').textContent = `$${Math.max(...highs).toFixed(2)}`;
        document.getElementById('lowPrice').textContent = `$${Math.min(...lows).toFixed(2)}`;
        document.getElementById('volume').textContent = (volumes[volumes.length - 1] / 1000000).toFixed(1) + 'M';

        // Calculate Indicators
        const sma20 = TechnicalAnalysis.calculateSMA(prices, 20);
        const rsi = TechnicalAnalysis.calculateRSI(prices);
        const macd = TechnicalAnalysis.calculateMACD(prices);

        // Update Technical Indicators
        this.updateIndicators({ rsi, macd, sma20, currentPrice, prices });

        // Update Chart
        this.updateChart(history);

        // Generate Prediction
        const prediction = AIPredictionEngine.generatePrediction(this.currentStock, {
            rsi, macd, sma20, currentPrice, prices
        });

        this.updatePrediction(prediction);

        // Update Insights
        this.updateInsightsData({ rsi, macd, sma20, currentPrice, prices, history });
    }

    updateIndicators(indicators) {
        const { rsi, macd, sma20, currentPrice } = indicators;

        // RSI
        if (rsi !== null) {
            document.getElementById('rsiValue').textContent = rsi.toFixed(1);
            const rsiBar = document.getElementById('rsiBar');
            rsiBar.style.width = rsi + '%';
            rsiBar.style.background = rsi > 70 ? '#ff5252' : (rsi < 30 ? '#4caf50' : '#ffc107');
        }

        // MACD
        if (macd) {
            document.getElementById('macdValue').textContent = macd.histogram.toFixed(4);
            const macdStatus = document.getElementById('macdStatus');
            if (macd.histogram > 0) {
                macdStatus.textContent = 'Bullish';
                macdStatus.className = 'status-text';
            } else {
                macdStatus.textContent = 'Bearish';
                macdStatus.className = 'status-text negative';
            }
        }

        // SMA
        if (sma20) {
            document.getElementById('smaValue').textContent = `$${sma20.toFixed(2)}`;
            const smaStatus = document.getElementById('smaStatus');
            if (currentPrice > sma20) {
                smaStatus.textContent = 'Above';
                smaStatus.className = 'status-text';
            } else {
                smaStatus.textContent = 'Below';
                smaStatus.className = 'status-text negative';
            }
        }
    }

    updateChart(history) {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        const data = {
            labels: history.map(h => new Date(h.timestamp).toLocaleDateString()),
            datasets: [{
                label: 'Close Price',
                data: history.map(h => h.close),
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#4caf50',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1,
                pointHoverRadius: 6
            }]
        };

        if (this.chart) {
            this.chart.data = data;
            this.chart.update();
        } else {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#b0b8d4',
                                font: { size: 12 }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#b0b8d4',
                                font: { size: 11 }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#b0b8d4',
                                font: { size: 11 }
                            }
                        }
                    }
                }
            });
        }
    }

    updatePrediction(prediction) {
        const { signal, confidence, predictedPrice, reasoning } = prediction;

        const badge = document.getElementById('signalBadge');
        badge.textContent = signal;
        badge.className = `signal-badge ${signal.toLowerCase()}`;

        document.getElementById('confidence').textContent = `Confidence: ${confidence}%`;
        document.getElementById('predictedPrice').textContent = `$${predictedPrice.toFixed(2)}`;

        const currentPrice = this.dataEngine.getCurrentPrice(this.currentStock);
        const gap = ((predictedPrice - currentPrice) / currentPrice) * 100;
        const gapElement = document.getElementById('predictionGap');
        gapElement.textContent = `${gap >= 0 ? '+' : ''}${gap.toFixed(2)}%`;
        gapElement.className = gap >= 0 ? 'detail-value gap' : 'detail-value gap negative';

        const reasoningList = document.getElementById('reasoningList');
        reasoningList.innerHTML = '';
        reasoning.forEach(reason => {
            const li = document.createElement('li');
            li.className = 'reason-item';
            li.textContent = reason;
            reasoningList.appendChild(li);
        });
    }

    calculateInvestment() {
        const amount = parseFloat(document.getElementById('investAmount').value) || 0;
        const months = parseInt(document.getElementById('investMonths').value) || 12;
        const currentPrice = this.dataEngine.getCurrentPrice(this.currentStock);

        if (!amount || !currentPrice) return;

        const shares = amount / currentPrice;
        
        // Simulate growth based on momentum
        const stock = this.dataEngine.getStock(this.currentStock);
        const prices = stock.priceHistory.map(h => h.close);
        const momentum = (prices[prices.length - 1] - prices[0]) / prices[0];
        
        const annualReturn = Math.max(-20, Math.min(40, momentum * 100 * 1.5));
        const monthlyReturn = annualReturn / 12;
        const expectedFutureValue = amount * Math.pow(1 + monthlyReturn / 100, months);
        const expectedReturn = expectedFutureValue - amount;

        let riskLevel = 'Medium';
        const volatility = TechnicalAnalysis.calculateVolatility(prices);
        if (volatility < 1.5) riskLevel = 'Low';
        if (volatility > 2.5) riskLevel = 'High';

        document.getElementById('expectedReturn').textContent = `₹${expectedReturn.toFixed(0)}`;
        document.getElementById('riskLevel').textContent = riskLevel;
        document.getElementById('potentialProfit').textContent = `₹${expectedFutureValue.toFixed(0)}`;
    }

    updateMarketPage() {
        const allStocks = this.dataEngine.getAllStocks();
        const sorted = [...allStocks].sort((a, b) => b.changePercent - a.changePercent);
        const gainers = sorted.slice(0, 5);
        const losers = sorted.slice(-5).reverse();

        // Update Gainers
        const gainersHTML = gainers.map(stock =>
            `<div class="stock-item" onclick="ui.loadStock('${stock.ticker}')">
                <div class="stock-name">${stock.ticker}</div>
                <div class="stock-change">${stock.changePercent.toFixed(2)}%</div>
            </div>`
        ).join('');
        document.getElementById('gainersContainer').innerHTML = gainersHTML;

        // Update Losers
        const losersHTML = losers.map(stock =>
            `<div class="stock-item" onclick="ui.loadStock('${stock.ticker}')">
                <div class="stock-name">${stock.ticker}</div>
                <div class="stock-change negative">${stock.changePercent.toFixed(2)}%</div>
            </div>`
        ).join('');
        document.getElementById('losersContainer').innerHTML = losersHTML;

        // Market Sentiment
        const avgChange = allStocks.reduce((sum, s) => sum + s.changePercent, 0) / allStocks.length;
        const sentiment = avgChange > 1 ? 'Bullish' : (avgChange < -1 ? 'Bearish' : 'Neutral');
        const sentimentBar = document.getElementById('sentimentBar');
        const sentimentPercent = Math.max(0, Math.min(100, (avgChange + 5) * 10));
        sentimentBar.style.width = sentimentPercent + '%';
        document.getElementById('sentimentText').textContent = sentiment;

        // Market Breadth
        const advancing = allStocks.filter(s => s.changePercent > 0).length;
        const declining = allStocks.filter(s => s.changePercent < 0).length;
        const unchanged = allStocks.length - advancing - declining;

        document.getElementById('advancingBar').style.width = (advancing / allStocks.length * 100) + '%';
        document.getElementById('decliningBar').style.width = (declining / allStocks.length * 100) + '%';
        document.getElementById('unchangedBar').style.width = (unchanged / allStocks.length * 100) + '%';
        document.getElementById('advancingCount').textContent = advancing;
        document.getElementById('decliningCount').textContent = declining;
        document.getElementById('unchangedCount').textContent = unchanged;

        // Volatility
        const volatilities = allStocks.map(s => {
            const stock = this.dataEngine.getStock(s.ticker);
            const prices = stock.priceHistory.map(h => h.close);
            return TechnicalAnalysis.calculateVolatility(prices);
        });
        const avgVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
        document.getElementById('volatilityValue').textContent = avgVolatility.toFixed(2);
        
        let volStatus = 'Low';
        if (avgVolatility > 2) volStatus = 'Moderate';
        if (avgVolatility > 3) volStatus = 'High';
        document.getElementById('volatilityStatus').textContent = volStatus;
    }

    updatePortfolioPage() {
        let totalValue = 0;
        let totalCost = 0;

        const holdingsHTML = this.portfolio.map(holding => {
            const currentPrice = this.dataEngine.getCurrentPrice(holding.ticker);
            const value = holding.quantity * currentPrice;
            const cost = holding.quantity * holding.buyPrice;
            const gainLoss = value - cost;
            const gainLossPercent = (gainLoss / cost) * 100;

            totalValue += value;
            totalCost += cost;

            return `
                <tr>
                    <td>${holding.ticker}</td>
                    <td>${holding.quantity}</td>
                    <td>₹${holding.buyPrice.toFixed(2)}</td>
                    <td>₹${currentPrice.toFixed(2)}</td>
                    <td>₹${value.toFixed(2)}</td>
                    <td style="color: ${gainLoss >= 0 ? '#4caf50' : '#ff5252'}">${gainLoss >= 0 ? '+' : ''}₹${gainLoss.toFixed(2)}</td>
                    <td style="color: ${gainLossPercent >= 0 ? '#4caf50' : '#ff5252'}">${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%</td>
                    <td><button class="delete-btn" onclick="ui.removeFromPortfolio('${holding.ticker}')">Delete</button></td>
                </tr>
            `;
        }).join('');

        if (this.portfolio.length === 0) {
            document.getElementById('holdingsContainer').innerHTML = '<p class="empty-state">No stocks in portfolio. Add one to get started.</p>';
        } else {
            const table = `
                <table class="holdings-table">
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Quantity</th>
                            <th>Buy Price</th>
                            <th>Current Price</th>
                            <th>Current Value</th>
                            <th>Gain/Loss</th>
                            <th>Return %</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${holdingsHTML}
                    </tbody>
                </table>
            `;
            document.getElementById('holdingsContainer').innerHTML = table;
        }

        const totalGainLoss = totalValue - totalCost;
        const returnPercent = totalCost === 0 ? 0 : (totalGainLoss / totalCost) * 100;

        document.getElementById('totalValue').textContent = `₹${totalValue.toFixed(0)}`;
        document.getElementById('totalGainLoss').textContent = `${totalGainLoss >= 0 ? '+' : ''}₹${totalGainLoss.toFixed(0)}`;
        document.getElementById('returnPercent').textContent = `${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(2)}%`;
    }

    updateInsightsPage() {
        if (!this.currentStock) return;

        const stock = this.dataEngine.getStock(this.currentStock);
        const prices = stock.priceHistory.map(h => h.close);
        const currentPrice = prices[prices.length - 1];

        // Trend Analysis
        const trend = AIPredictionEngine.analyzeTrend(prices);
        document.getElementById('currentTrend').textContent = trend;

        const momentum = (prices[prices.length - 1] - prices[Math.max(0, prices.length - 5)]) / prices[Math.max(0, prices.length - 5)] * 100;
        document.getElementById('momentum').textContent = momentum > 0 ? 'Bullish' : 'Bearish';
        document.getElementById('strength').textContent = Math.abs(momentum).toFixed(1) + '%';

        // Risk Analysis
        const volatility = TechnicalAnalysis.calculateVolatility(prices);
        const volatilityMeter = document.getElementById('volatilityMeter');
        volatilityMeter.style.width = Math.min(volatility * 30, 100) + '%';
        document.getElementById('volValue').textContent = volatility.toFixed(1) + '%';

        const beta = 1 + ((volatility - 2) / 10);
        document.getElementById('betaValue').textContent = beta.toFixed(2);

        let riskRating = 'Medium';
        if (volatility < 1.5) riskRating = 'Low';
        if (volatility > 2.5) riskRating = 'High';
        document.getElementById('riskRating').textContent = riskRating;

        // Support & Resistance
        const sr = AIPredictionEngine.calculateSupportResistance(prices);
        document.getElementById('resistance1').textContent = `$${sr.resistance1.toFixed(2)}`;
        document.getElementById('srCurrent').textContent = `$${currentPrice.toFixed(2)}`;
        document.getElementById('support1').textContent = `$${sr.support1.toFixed(2)}`;

        // Patterns
        const patterns = AIPredictionEngine.recognizePatterns(prices);
        const patternHTML = patterns.map(p => `<div class="pattern-item">📍 ${p}</div>`).join('');
        document.getElementById('patternContent').innerHTML = patternHTML;

        // Recommendation
        const prediction = AIPredictionEngine.generatePrediction(this.currentStock, {
            rsi: TechnicalAnalysis.calculateRSI(prices),
            macd: TechnicalAnalysis.calculateMACD(prices),
            sma20: TechnicalAnalysis.calculateSMA(prices, 20),
            currentPrice,
            prices
        });

        const recommendationTexts = {
            BUY: `Strong buy signal for ${this.currentStock}. Technical indicators suggest upward momentum with RSI in oversold territory and MACD showing bullish crossover.`,
            SELL: `Sell recommendation for ${this.currentStock}. Overbought conditions detected with RSI > 70 and bearish MACD divergence. Consider taking profits.`,
            HOLD: `Hold position in ${this.currentStock}. Mixed signals suggest waiting for clearer directional bias before making new positions.`
        };

        document.getElementById('recommendationText').textContent = recommendationTexts[prediction.signal];
        document.getElementById('recommendationScore').textContent = `Score: ${prediction.confidence}/100`;

        // Performance Metrics
        const high52 = Math.max(...prices);
        const low52 = Math.min(...prices);
        const avgVolume = stock.priceHistory.map(h => h.volume).reduce((a, b) => a + b, 0) / stock.priceHistory.length;

        document.getElementById('highestPrice').textContent = `$${high52.toFixed(2)}`;
        document.getElementById('lowestPrice').textContent = `$${low52.toFixed(2)}`;
        document.getElementById('avgVolume').textContent = (avgVolume / 1000000).toFixed(1) + 'M';
        document.getElementById('peRatio').textContent = (15 + Math.random() * 10).toFixed(2);
    }

    updateInsightsData(data) {
        if (!this.currentStock) return;
        this.updateInsightsPage();
    }

    addToPortfolio() {
        const ticker = document.getElementById('portfolioTicker').value.toUpperCase();
        const quantity = parseInt(document.getElementById('portfolioQuantity').value) || 0;
        const buyPrice = parseFloat(document.getElementById('portfolioBuyPrice').value) || 0;

        if (!ticker || quantity <= 0 || buyPrice <= 0) {
            alert('Please fill all fields correctly');
            return;
        }

        const stock = this.dataEngine.getStock(ticker);
        if (!stock) {
            alert('Stock not found');
            return;
        }

        const existingIndex = this.portfolio.findIndex(h => h.ticker === ticker);
        if (existingIndex >= 0) {
            this.portfolio[existingIndex].quantity += quantity;
        } else {
            this.portfolio.push({ ticker, quantity, buyPrice });
        }

        this.savePortfolio();
        this.updatePortfolioPage();

        document.getElementById('portfolioTicker').value = '';
        document.getElementById('portfolioQuantity').value = '';
        document.getElementById('portfolioBuyPrice').value = '';
    }

    removeFromPortfolio(ticker) {
        this.portfolio = this.portfolio.filter(h => h.ticker !== ticker);
        this.savePortfolio();
        this.updatePortfolioPage();
    }

    savePortfolio() {
        localStorage.setItem('portfolio', JSON.stringify(this.portfolio));
    }

    loadPortfolio() {
        const saved = localStorage.getItem('portfolio');
        return saved ? JSON.parse(saved) : [];
    }

    updateTime() {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('timeDisplay').textContent = time;
    }

    startSimulation() {
        setInterval(() => {
            if (this.currentStock) {
                this.dataEngine.simulateLiveUpdate(this.currentStock);
                this.updateDashboard();
            }
        }, 5000);
    }
}

// Initialize Application
let ui;
document.addEventListener('DOMContentLoaded', () => {
    ui = new UIController();
});
