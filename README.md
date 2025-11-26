# TrendBot - AI Crypto Analytics Dashboard

A modern, responsive cryptocurrency analytics dashboard with AI-powered predictions and real-time market data.

## 🚀 Features

- **Real-time Market Data**: Live cryptocurrency prices, market caps, and trading volumes
- **AI Predictions**: Advanced technical analysis with price predictions
- **Interactive Charts**: Beautiful, responsive price charts with multiple timeframes
- **Market Sentiment**: Fear & Greed Index and market sentiment analysis
- **Smart Search**: Instant cryptocurrency search with suggestions
- **Trending Coins**: Real-time trending cryptocurrencies
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Dark Theme**: Modern, professional dark theme interface

## 🌐 Live Demo

Visit the live demo: [https://yourusername.github.io/trendbot-crypto-dashboard](https://yourusername.github.io/trendbot-crypto-dashboard)

## 📱 Screenshots

![TrendBot Dashboard](https://via.placeholder.com/800x400/0a0a0a/4a9eff?text=TrendBot+Dashboard)

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js with date adapters
- **APIs**: CoinGecko API, Alternative.me Fear & Greed API
- **Icons**: Font Awesome
- **Fonts**: Inter (Google Fonts)
- **Hosting**: GitHub Pages

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- Internet connection for API data

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/trendbot-crypto-dashboard.git
   cd trendbot-crypto-dashboard
   ```

2. **Open locally**
   - Simply open `index.html` in your web browser
   - Or use a local server like Live Server in VS Code

### Deploy to GitHub Pages

1. **Fork this repository** or create a new repository with this code

2. **Enable GitHub Pages**
   - Go to your repository settings
   - Scroll down to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

3. **Access your site**
   - Your site will be available at: `https://yourusername.github.io/repository-name`
   - It may take a few minutes to deploy

## 📁 Project Structure

```
trendbot-crypto-dashboard/
├── index.html              # Main HTML file
├── css/
│   ├── style.css           # Main styles
│   └── prediction-modal.css # Prediction modal styles
├── js/
│   ├── script.js           # Main application logic
│   ├── api.js              # API management
│   ├── cache.js            # Caching system
│   ├── prediction-engine.js # AI prediction engine
│   └── performance-optimizer.js # Performance optimizations
└── README.md               # This file
```

## 🔧 Configuration

The application works out of the box with no configuration needed. However, you can customize:

- **API Endpoints**: Modify the `convertToDirectAPI` method in `js/api.js`
- **Cache Settings**: Adjust cache TTL values in the API calls
- **Styling**: Customize colors and themes in `css/style.css`
- **Prediction Parameters**: Modify prediction algorithms in `js/prediction-engine.js`

## 📊 API Usage

This application uses the following free APIs:

- **CoinGecko API**: Cryptocurrency data (no API key required)
- **Alternative.me**: Fear & Greed Index (no API key required)

### Rate Limits

- CoinGecko: 50 calls/minute for free tier
- Alternative.me: No official limits

The application includes intelligent caching to minimize API calls and respect rate limits.

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `css/style.css`:

```css
:root {
  --accent-primary: #4a9eff;    /* Primary blue */
  --accent-secondary: #8b5cf6;  /* Purple */
  --accent-success: #00d4aa;    /* Green */
  --accent-warning: #ffb800;    /* Orange */
  --accent-error: #ff4757;      /* Red */
}
```

### Adding New Features

1. Add HTML structure to `index.html`
2. Add styles to `css/style.css`
3. Add functionality to `js/script.js`
4. Update API calls in `js/api.js` if needed

## 🔍 Features in Detail

### AI Predictions
- Technical analysis using multiple indicators (RSI, MACD, Bollinger Bands)
- Support and resistance level detection
- Price target calculations
- Risk assessment
- Trading signal generation

### Performance Optimization
- Intelligent caching system
- Request batching and debouncing
- Lazy loading for images
- Responsive design optimizations
- Memory management

### User Experience
- Smooth animations and transitions
- Loading states and error handling
- Mobile-first responsive design
- Accessibility features
- Keyboard navigation support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This application is for educational and informational purposes only. The AI predictions and analysis should not be considered as financial advice. Cryptocurrency investments are highly volatile and risky. Always do your own research and consult with financial advisors before making investment decisions.

## 🙏 Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for providing free cryptocurrency API
- [Alternative.me](https://alternative.me/) for the Fear & Greed Index
- [Chart.js](https://www.chartjs.org/) for beautiful charts
- [Font Awesome](https://fontawesome.com/) for icons
- [Inter Font](https://fonts.google.com/specimen/Inter) for typography

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/yourusername/trendbot-crypto-dashboard/issues) page
2. Create a new issue if your question isn't answered
3. Provide as much detail as possible about your problem

---

Made with ❤️ for the crypto community