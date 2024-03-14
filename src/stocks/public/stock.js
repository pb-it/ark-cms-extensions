class Stock {

    static async initModel() {
        const controller = app.getController();
        const model = controller.getModelController().getModel('stock');

        const checkAction = {
            'name': 'Check',
            'fn': async function (data) {
                const controller = app.getController();
                controller.setLoadingState(true);
                try {
                    data = await Stock.checkData(data);
                    controller.setLoadingState(false);
                } catch (error) {
                    controller.setLoadingState(false);
                    app.getController().showError(error);
                }
                return Promise.resolve(data);
            }
        };
        model._crudDialogActions.push(checkAction);

        const lastPriceEntry = new ContextMenuEntry("Last Price", async function (event, target) {
            const controller = app.getController();
            controller.setLoadingState(true);
            try {
                const stock = target.getObject().getData();
                if (stock['symbol']) {
                    var value = await stockController.getLastPrice(target.getObject().getData());
                    controller.setLoadingState(false);
                    alert(value);
                } else
                    throw new Error('Missing stock symbol');
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        });

        const downloadEntry = new ContextMenuEntry("Download", async function (event, target) {
            const controller = app.getController();
            controller.setLoadingState(true);
            try {
                const stock = target.getObject().getData();
                if (stock['symbol']) {
                    var body;
                    /*var api = stockController.getDefaultApi();
                    if (api == 'Finnhub')
                        api = 'AlphaVantage';*/
                    const key = stockController.getKey('AlphaVantage');
                    if (key)
                        body = await StockController.getTimeSeriesAlphaVantage(stock, key);
                    else
                        body = await stockController.getTimeSeries(stock);
                    if (body) {
                        const values = body["Time Series (Daily)"];
                        if (values) {
                            var last;
                            var tmp = await controller.getDataService().fetchData('quote', null, 's=' + stock['id'], 't:desc', 1);
                            if (tmp && tmp.length == 1)
                                last = tmp[0]['t'];

                            var data;
                            var obj;
                            var datetime;
                            for (const [key, value] of Object.entries(values).reverse()) {
                                datetime = new Date(key).toISOString(); // key + 'T00:00:00.000Z';
                                if (!last || datetime > last) {
                                    data = {
                                        't': datetime,
                                        's': stock['id'],
                                        'o': value["1. open"],
                                        'h': value["2. high"],
                                        'l': value["3. low"],
                                        'c': value["4. close"],
                                        'v': value["5. volume"]
                                    };
                                    obj = new CrudObject('quote', data);
                                    await obj.create();
                                }
                            }
                        }
                    }
                    controller.setLoadingState(false);
                } else
                    throw new Error('Missing stock symbol');
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        });

        const compareEntry = new ContextMenuEntry("Compare", async function (event, target) {
            const controller = app.getController();
            controller.setLoadingState(true);
            try {
                const stock = target.getObject().getData();
                await StockController.compare(stock);
                controller.setLoadingState(false);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        });
        compareEntry.setEnabledFunction(async function (target) {
            const key = stockController.getKey('Polygon');
            return Promise.resolve(key != null);
        });

        const chartEntry = new ContextMenuEntry("Show Card", async function (event, target) {
            const controller = app.getController();
            controller.setLoadingState(true);
            try {
                const stock = target.getObject().getData();
                await StockController.showCard(stock);
                controller.setLoadingState(false);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        });

        const entries = model.getContextMenuEntries();
        if (entries) {
            var extGroup = null;
            for (var e of entries) {
                if (e.getName() === 'Extensions') {
                    extGroup = e;
                    break;
                }
            }
            if (extGroup) {
                extGroup.entries.push(lastPriceEntry);
                extGroup.entries.push(downloadEntry);
                extGroup.entries.push(compareEntry);
                extGroup.entries.push(chartEntry);
            } else {
                extGroup = new ContextMenuEntry('Extensions', null, [lastPriceEntry, downloadEntry, compareEntry, chartEntry]);
                extGroup.setIcon(new Icon('puzzle-piece'));
                entries.unshift(extGroup);
            }
        }

        return Promise.resolve();
    }

    static async checkData(data) {
        const controller = app.getController();
        var url = data['url'];
        if (url) {
            var bFinanzen;
            if (url.startsWith("https://www.finanzen.at/")) {
                url = "https://www.finanzen.net/" + url.substr("https://www.finanzen.at/".length);
                bFinanzen = true;
            } else if (url.startsWith("https://www.finanzen.net/")) {
                bFinanzen = true;
            }
            if (bFinanzen == true) {
                const res = await Scraper.scrape(url);
                if (res) {
                    if (res['name'] && !data['name'])
                        data['name'] = res['name'];
                    if (res['wkn'] && !data['wkn'])
                        data['wkn'] = res['wkn'];
                    if (res['isin'] && !data['isin'])
                        data['isin'] = res['isin'];
                    if (res['symbol'] && !data['symbol'])
                        data['symbol'] = res['symbol'];
                }
            }
        }
        const stocks = await controller.getDataService().fetchData('stock');
        for (var stock of stocks) {
            if (stock['name'] === data['name'] || stock['url'] === data['url'] || stock['wkn'] === data['wkn'])
                alert("Stock already exists");
        }
        return Promise.resolve(data);
    }
}