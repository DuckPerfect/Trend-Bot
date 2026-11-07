from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import logging
import time
import os

app = Flask(__name__, static_folder='public', static_url_path='/')
CORS(app)
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    try:
        return send_from_directory(app.static_folder, path)
    except:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': int(time.time()),
        'version': '3.0.0',
        'uptime': time.time() - start_time
    })

@app.route('/api/trends', methods=['GET'])
def get_trends():
    try:
        timeframe = request.args.get('timeframe', '24h')
        market = request.args.get('market', 'crypto')
        limit = request.args.get('limit', '10')
        
        url = "https://api.coingecko.com/api/v3/coins/markets"
        
        category_mapping = {
            'crypto': None,
            'all': None,
            'defi': 'decentralized-finance-defi',
            'nft': 'non-fungible-tokens-nft',
            'gaming': 'gaming',
            'layer-1': 'layer-1',
            'layer-2': 'layer-2'
        }
        
        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': int(limit),
            'page': 1,
            'sparkline': False,
            'locale': 'en',
            'price_change_percentage': '1h,24h,7d,30d'
        }
        
        if market != 'crypto' and market != 'all' and category_mapping.get(market):
            params['category'] = category_mapping[market]
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'TrendBot/3.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        trends = []
        price_change_key_map = {
            '1h': 'price_change_percentage_1h_in_currency',
            '24h': 'price_change_percentage_24h_in_currency',
            '7d': 'price_change_percentage_7d_in_currency',
            '30d': 'price_change_percentage_30d_in_currency'
        }
        
        selected_timeframe_key = price_change_key_map.get(timeframe, price_change_key_map['24h'])
        
        for coin in data:
            price_change = coin.get(selected_timeframe_key)
            if price_change is None:
                price_change = coin.get('price_change_percentage_24h', 0.0)
            
            trends.append({
                'id': coin['id'],
                'name': coin['name'],
                'symbol': coin['symbol'].upper(),
                'price': coin.get('current_price', 0),
                'change_24h': round(float(price_change), 2),
                'market_cap': coin.get('market_cap', 0),
                'trend': 'up' if price_change > 0 else ('down' if price_change < 0 else 'flat'),
                'volume_24h': coin.get('total_volume', 0),
                'image': coin.get('image', ''),
                'market_cap_rank': coin.get('market_cap_rank', 0),
                'ath': coin.get('ath', 0),
                'ath_change_percentage': coin.get('ath_change_percentage', 0),
                'circulating_supply': coin.get('circulating_supply', 0),
                'total_supply': coin.get('total_supply', 0),
                'max_supply': coin.get('max_supply', 0)
            })
        
        return jsonify({
            'success': True,
            'data': trends,
            'timestamp': int(time.time()),
            'count': len(trends),
            'timeframe': timeframe,
            'market': market
        })
        
    except Exception as e:
        logging.error(f"Error in get_trends: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch trends data'}), 500

@app.route('/api/coin/<coin_id>')
def get_coin_details(coin_id):
    try:
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
        params = {
            'localization': 'false',
            'tickers': 'false',
            'market_data': 'true',
            'community_data': 'true',
            'developer_data': 'true',
            'sparkline': 'false'
        }
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'TrendBot/3.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        market_data = data.get('market_data', {})
        community_data = data.get('community_data', {})
        developer_data = data.get('developer_data', {})
        
        current_price = market_data.get('current_price', {}).get('usd', 0)
        market_cap = market_data.get('market_cap', {}).get('usd', 0)
        volume_24h = market_data.get('total_volume', {}).get('usd', 0)
        description_en = data.get('description', {}).get('en', '')
        
        coin_data = {
            'id': data.get('id'),
            'name': data.get('name'),
            'symbol': data.get('symbol', '').upper(),
            'current_price': current_price,
            'market_cap': market_cap,
            'price_change_percentage_1h': market_data.get('price_change_percentage_1h', 0),
            'price_change_percentage_24h': market_data.get('price_change_percentage_24h', 0),
            'price_change_percentage_7d': market_data.get('price_change_percentage_7d', 0),
            'price_change_percentage_30d': market_data.get('price_change_percentage_30d', 0),
            'volume_24h': volume_24h,
            'market_cap_rank': data.get('market_cap_rank', market_data.get('market_cap_rank', 0)),
            'ath': market_data.get('ath', {}).get('usd', 0),
            'ath_change_percentage': market_data.get('ath_change_percentage', {}).get('usd', 0),
            'atl': market_data.get('atl', {}).get('usd', 0),
            'atl_change_percentage': market_data.get('atl_change_percentage', {}).get('usd', 0),
            'circulating_supply': market_data.get('circulating_supply', 0),
            'total_supply': market_data.get('total_supply', 0),
            'max_supply': market_data.get('max_supply', 0),
            'description': description_en[:500] + '...' if description_en and len(description_en) > 500 else (description_en or 'No description available.'),
            'image': data.get('image', {}).get('large', ''),
            'homepage': data.get('links', {}).get('homepage', [''])[0] if data.get('links', {}).get('homepage') else '',
            'blockchain_site': data.get('links', {}).get('blockchain_site', [''])[0] if data.get('links', {}).get('blockchain_site') else '',
            'twitter_screen_name': data.get('links', {}).get('twitter_screen_name', ''),
            'telegram_channel_identifier': data.get('links', {}).get('telegram_channel_identifier', ''),
            'subreddit_url': data.get('links', {}).get('subreddit_url', ''),
            # Community metrics
            'twitter_followers': community_data.get('twitter_followers', 0),
            'reddit_subscribers': community_data.get('reddit_subscribers', 0),
            'telegram_channel_user_count': community_data.get('telegram_channel_user_count', 0),
            # Developer metrics
            'forks': developer_data.get('forks', 0),
            'stars': developer_data.get('stars', 0),
            'subscribers': developer_data.get('subscribers', 0),
            'total_issues': developer_data.get('total_issues', 0),
            'closed_issues': developer_data.get('closed_issues', 0),
            'pull_requests_merged': developer_data.get('pull_requests_merged', 0),
            'commit_count_4_weeks': developer_data.get('commit_count_4_weeks', 0)
        }
        
        return jsonify({'success': True, 'data': coin_data, 'timestamp': int(time.time())})
        
    except Exception as e:
        logging.error(f"Error fetching coin details for {coin_id}: {str(e)}")
        return jsonify({'success': False, 'error': f'Failed to fetch details for {coin_id}'}), 500

@app.route('/api/search')
def search_cryptocurrencies():
    try:
        query = request.args.get('q', '').strip()
        if not query or len(query) < 2:
            return jsonify({'success': False, 'error': 'Search query must be at least 2 characters long'}), 400
        
        url = "https://api.coingecko.com/api/v3/search"
        params = {'query': query}
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'TrendBot/3.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for coin in data.get('coins', [])[:10]:
            results.append({
                'id': coin.get('id'),
                'name': coin.get('name'),
                'api_symbol': coin.get('api_symbol'),
                'symbol': coin.get('symbol', '').upper(),
                'market_cap_rank': coin.get('market_cap_rank'),
                'thumb': coin.get('thumb', ''),
                'large': coin.get('large', '')
            })
        
        return jsonify({'success': True, 'data': results, 'query': query, 'count': len(results), 'timestamp': int(time.time())})
        
    except Exception as e:
        logging.error(f"Error searching cryptocurrencies: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to search cryptocurrencies'}), 500

@app.route('/api/chart/<coin_id>')
def get_chart_data(coin_id):
    try:
        days = request.args.get('days', '7')
        vs_currency = request.args.get('vs_currency', 'usd')
        
        try:
            if days == 'max':
                num_days = 'max'
            else:
                num_days = int(days)
                if num_days <= 0:
                    num_days = 1
        except ValueError:
            num_days = 7
        
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
        params = {
            'vs_currency': vs_currency,
            'days': str(num_days),
        }
        
        # Only add interval if days == 1 or days > 90
        if num_days == 1:
            params['interval'] = 'hourly'
        elif isinstance(num_days, int) and num_days > 90:
            params['interval'] = 'daily'
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'TrendBot/3.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        prices = []
        for price_point in data.get('prices', []):
            prices.append({
                'timestamp': price_point[0],
                'price': price_point[1]
            })
        
        volumes = []
        for volume_point in data.get('total_volumes', []):
            volumes.append({
                'timestamp': volume_point[0],
                'volume': volume_point[1]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'prices': prices,
                'volumes': volumes,
                'coin_id': coin_id,
                'days': str(num_days),
                'vs_currency': vs_currency
            },
            'timestamp': int(time.time())
        })
        
    except Exception as e:
        logging.error(f"Error fetching chart data for {coin_id}: {str(e)}")
        return jsonify({'success': False, 'error': f'Failed to fetch chart data for {coin_id}'}), 500

@app.route('/api/trending')
def get_trending():
    try:
        url = "https://api.coingecko.com/api/v3/search/trending"
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'TrendBot/3.0'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        trending_coins = []
        for coin_item in data.get('coins', []):
            coin_data = coin_item.get('item', {})
            trending_coins.append({
                'id': coin_data.get('id'),
                'name': coin_data.get('name'),
                'symbol': coin_data.get('symbol', '').upper(),
                'market_cap_rank': coin_data.get('market_cap_rank'),
                'thumb': coin_data.get('thumb'),
                'score': coin_item.get('score', coin_data.get('score', 0)),
                'price_btc': coin_data.get('price_btc', 0)
            })
        
        return jsonify({'success': True, 'data': trending_coins, 'timestamp': int(time.time())})
        
    except Exception as e:
        logging.error(f"Error fetching trending data: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch trending data'}), 500

@app.route('/api/global')
def get_global_data():
    try:
        url = "https://api.coingecko.com/api/v3/global"
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'TrendBot/3.0'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        global_data = data.get('data', {})
        
        return jsonify({
            'success': True,
            'data': {
                'total_market_cap': global_data.get('total_market_cap', {}).get('usd', 0),
                'total_volume': global_data.get('total_volume', {}).get('usd', 0),
                'market_cap_percentage': global_data.get('market_cap_percentage', {}),
                'active_cryptocurrencies': global_data.get('active_cryptocurrencies', 0),
                'upcoming_icos': global_data.get('upcoming_icos', 0),
                'ongoing_icos': global_data.get('ongoing_icos', 0),
                'ended_icos': global_data.get('ended_icos', 0),
                'markets': global_data.get('markets', 0),
                'market_cap_change_percentage_24h_usd': global_data.get('market_cap_change_percentage_24h_usd', 0)
            },
            'timestamp': int(time.time())
        })
        
    except Exception as e:
        logging.error(f"Error fetching global data: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch global market data'}), 500

@app.route('/api/fear-greed')
def get_fear_greed_index():
    try:
        url = "https://api.alternative.me/fng/"
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'TrendBot/3.0'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return jsonify({
            'success': True,
            'data': data.get('data', [{}])[0],
            'timestamp': int(time.time())
        })
        
    except Exception as e:
        logging.error(f"Error fetching Fear & Greed Index: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch Fear & Greed Index'}), 500

@app.route('/api/gainers-losers')
def get_gainers_losers():
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            'vs_currency': 'usd',
            'order': 'price_change_percentage_24h_desc',
            'per_page': 50,
            'page': 1,
            'sparkline': False,
            'price_change_percentage': '24h'
        }
        
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'TrendBot/3.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        gainers = []
        for coin in data[:10]:
            gainers.append({
                'id': coin['id'],
                'name': coin['name'],
                'symbol': coin['symbol'].upper(),
                'price': coin['current_price'],
                'change_24h': coin['price_change_percentage_24h'],
                'image': coin['image']
            })
        
        losers = []
        for coin in reversed(data[-10:]):
            losers.append({
                'id': coin['id'],
                'name': coin['name'],
                'symbol': coin['symbol'].upper(),
                'price': coin['current_price'],
                'change_24h': coin['price_change_percentage_24h'],
                'image': coin['image']
            })
        
        return jsonify({
            'success': True,
            'data': {
                'gainers': gainers,
                'losers': losers
            },
            'timestamp': int(time.time())
        })
        
    except Exception as e:
        logging.error(f"Error fetching gainers/losers: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to fetch gainers and losers data'}), 500

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({
        'success': False,
        'error': 'API endpoint not found. Please check the URL.',
        'code': 'ENDPOINT_NOT_FOUND'
    }), 404

@app.errorhandler(500)
def internal_server_error(error):
    logging.error(f"Internal Server Error: {error}")
    return jsonify({
        'success': False,
        'error': 'An unexpected internal server error occurred.',
        'code': 'INTERNAL_SERVER_ERROR'
    }), 500

# Track server start time
start_time = time.time()

if __name__ == '__main__':
    print("🚀 Starting TrendBot API Server v3.0...")
    print("🌐 Server running on http://localhost:5000")
    print("✨ Enhanced with additional crypto features!")
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        threaded=True
    )
