class StockController {

    static CACHE = true;

    static async showCard(stock) {
        if (stock['symbol']) {
            var chartConfig;
            const labels = [];
            const datapoints = [];

            const body = await stockController.getTimeSeries(stock);
            const values = body["Time Series (Daily)"];
            if (values) {
                for (const [key, value] of Object.entries(values)) {
                    labels.push(key);
                    datapoints.push(value["4. close"]);
                }
            }
            if (labels.length > 0) {
                const data = {
                    labels: labels.reverse(),
                    datasets: [
                        {
                            label: stock['name'],
                            data: datapoints.reverse(),
                            borderColor: "rgba(0,0,255,1.0)",
                            backgroundColor: "rgba(0,0,255,1)",
                        }
                    ]
                };
                chartConfig = {
                    type: 'line',
                    data: data,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Chart.js Line Chart'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                }
            }
            if (chartConfig) {
                const panel = new StockCard(chartConfig);
                await app.getController().getModalController().openPanelInModal(panel);
            } else
                throw new Error('Fetching stock data failed');
        } else
            throw new Error('Missing stock symbol');
        return Promise.resolve();
    }

    static async compare(stock) {
        if (stock['symbol']) {
            const key = stockController.getKey('Polygon');
            if (key) {
                const body = await StockController.getTimeSeriesPolygon(stock, key);
                if (body && body['results']) {
                    var date;
                    var timestamp;
                    const data = await app.getController().getDataService().fetchData('quote', null, 's=' + stock['id'], 't:asc', -1);
                    if (data && data.length > 0) {
                        var index = -1;
                        var match;
                        for (var entry of body['results']) {
                            date = new Date(entry['t']);
                            if ([5, 6].includes(date.getHours()) && date.getMinutes() == 0 && date.getSeconds() == 0) {
                                timestamp = date.toISOString().split('T')[0] + 'T00:00:00.000Z';
                                match = null;
                                if (index != -1) {
                                    index++;
                                    if (data[index]['t'] == timestamp)
                                        match = data[index];
                                    else {
                                        console.log(data[index]['t']);
                                        if (new Date(data[index]['t']) < new Date(timestamp)) {
                                            for (var i = index + 1; i < data.length; i++) {
                                                if (data[i]['t'] == timestamp) {
                                                    index = i;
                                                    match = data[index];
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                if (index == -1) {
                                    var i;
                                    for (var i = 0; i < data.length; i++) {
                                        if (data[i]['t'] == timestamp) {
                                            index = i;
                                            match = data[index];
                                            break;
                                        } else {
                                            if (new Date(data[i]['t']) > new Date(timestamp))
                                                break;
                                        }
                                    }
                                }

                                if (match) {
                                    if (match['o'] == entry['o'] && match['c'] == entry['c']) {
                                        if (match['h'] != entry['h'] || match['l'] != entry['l']) { // match['v'] != entry['v']
                                            console.error('Missmatch');
                                            console.log(match);
                                            console.log(entry);
                                        }
                                    } else
                                        throw new Error('Missmatch');
                                } else
                                    console.log('Missing match for timestamp \'' + timestamp + '\'');
                            } else
                                throw new Error('Unexpected timestamp');
                        }
                    }
                }
            }
        } else
            throw new Error('Missing stock symbol');
        return Promise.resolve();
    }

    static async getTimeSeriesAlphaVantage(stock, key) {
        var symbol;
        var index = stock['symbol'].indexOf('.');
        if (index == -1)
            symbol = stock['symbol'];
        else
            symbol = stock['symbol'].substring(0, index);

        const url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + symbol + "&apikey=" + key;
        const response = await HttpProxy.request(url, { 'bCache': StockController.CACHE });
        var body;
        if (typeof response === 'string' || response instanceof String)
            body = JSON.parse(response);
        else
            body = response;
        return Promise.resolve(body);
    }

    static async getTimeSeriesPolygon(stock, key) {
        var symbol;
        var index = stock['symbol'].indexOf('.');
        if (index == -1)
            symbol = stock['symbol'];
        else
            symbol = stock['symbol'].substring(0, index);

        const from = "2023-10-10";
        const to = new Date().toISOString().split('T')[0];
        const url = "https://api.polygon.io/v2/aggs/ticker/" + symbol + "/range/1/day/" + from + "/" + to + "?adjusted=true&sort=asc&apiKey=" + key;
        const response = await HttpProxy.request(url, { 'bCache': StockController.CACHE });
        var body;
        if (typeof response === 'string' || response instanceof String)
            body = JSON.parse(response);
        else
            body = response;
        return Promise.resolve(body);
    }

    static async getLastPriceAlphaVantage(stock, key) {
        var value;
        if (stock['symbol'] && key) {
            const body = await StockController.getTimeSeriesAlphaVantage(stock);
            const values = body["Time Series (Daily)"];
            //const values = body["Time Series (5min)"];
            if (values) {
                const last = Object.keys(values)[0];
                if (last)
                    value = values[last]["4. close"];
            }
        }
        return Promise.resolve(value);
    }

    static async getLastPriceFinnhub(stock, key) {
        var value;
        if (stock['symbol'] && key) {
            var symbol;
            var index = stock['symbol'].indexOf('.');
            if (index == -1)
                symbol = stock['symbol'];
            else
                symbol = stock['symbol'].substring(0, index);

            const url = "https://finnhub.io/api/v1/quote?symbol=" + symbol + "&token=" + key;
            const body = await HttpProxy.request(url);
            value = body["pc"];
        }
        return Promise.resolve(value);
    }

    _conf;
    _api;
    _key;

    constructor() {
    }

    async init() {
        const controller = app.getController();
        const ds = controller.getDataService();
        var tmp = await ds.fetchData('_registry', null, 'key=defaultStockAPI');
        if (tmp && tmp.length == 1)
            this._api = tmp[0]['value'];
        if (this._api) {
            tmp = await ds.fetchData('_registry', null, 'key=availableStockAPI');
            if (tmp && tmp.length == 1)
                this._conf = JSON.parse(tmp[0]['value']);
            if (this._conf)
                this._key = this.getKey(this._api);
        }
        return Promise.resolve();
    }

    getDefaultApi() {
        return this._api;
    }

    getKey(api) {
        var key;
        if (this._conf) {
            for (var entry of this._conf) {
                if (entry['name'] === api) {
                    key = entry['key'];
                    break;
                }
            }
        }
        return key;
    }

    async getTimeSeries(stock) {
        var value;
        if (this._api && this._key) {
            if (this._api === 'AlphaVantage')
                value = await StockController.getTimeSeriesAlphaVantage(stock, this._key);
            else if (this._api === 'Finnhub')
                throw new Error('NotImplementedException'); //TODO:
            else if (this._api === 'Polygon')
                value = await StockController.getTimeSeriesPolygon(stock, this._key);
        }
        return Promise.resolve(value);
    }

    async getLastPrice(stock) {
        var value;
        if (this._api && this._key) {
            if (this._api === 'AlphaVantage')
                value = await StockController.getLastPriceAlphaVantage(stock, this._key);
            else if (this._api === 'Finnhub')
                value = await StockController.getLastPriceFinnhub(stock, this._key);
            else if (this._api === 'Polygon')
                throw new Error('NotImplementedException'); //TODO:
        }
        return Promise.resolve(value);
    }
}