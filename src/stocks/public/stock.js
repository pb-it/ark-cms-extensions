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

        const entry = new ContextMenuEntry("Last Price", async function (event, target) {
            const controller = app.getController();
            controller.setLoadingState(true);
            try {
                var value = await Stock.getLastPrice(target.getObject().getData());
                controller.setLoadingState(false);
                alert(value);
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
            if (extGroup)
                extGroup.entries.push(entry);
            else {
                entries.unshift(new ContextMenuEntry("Extensions", null, [entry]));
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

    static async getLastPrice(stock) {
        var value;
        if (stock['symbol']) {
            const key = "xxxxxxdemoxxxx";
            const url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + stock['symbol'] + "&apikey=" + key;

            const info = await HttpProxy.request(url);
            const values = info["Time Series (Daily)"];
            //const values = info["Time Series (5min)"];
            const last = Object.keys(values)[0];

            value = values[last]["4. close"];
        }
        return Promise.resolve(value);
    }
}