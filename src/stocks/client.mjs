async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/stocks/public";
    if (typeof StockController === 'undefined')
        resources.push(loadScript(publicDir + "/stock-controller.js"));
    if (typeof Stock === 'undefined')
        resources.push(loadScript(publicDir + "/stock.js"));
    if (typeof Balance === 'undefined')
        resources.push(loadScript(publicDir + "/balance.js"));
    if (typeof StockCard === 'undefined')
        resources.push(loadScript(publicDir + "/stock-card.js"));
    await Promise.all(resources);

    window.stockController = new StockController();
    await stockController.init();

    await Stock.initModel();

    const mQuote = controller.getModelController().getModel('quote');
    mQuote._prepareDataAction = function (data) {
        if (data['t'] && data['s'])
            data['title'] = new Date(data['t']).toISOString().split('T')[0] + ' - ' + data['s']['name'];
        return data;
    }

    const mTransaction = controller.getModelController().getModel('transaction');
    mTransaction._prepareDataAction = function (data) {
        if (data['type']) {
            data['title'] = data['type'];
            if (data['stock'])
                data['title'] += "(" + data['stock']['name'] + ")";
            if (data['total'])
                data['title'] += ": " + data['total'];
        }
        return data;
    }

    const route = {
        "regex": "^/balance$",
        "fn": async function () {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);
                const balance = new Balance();
                controller.getView().getCanvas().showPanels([balance]);
                controller.setLoadingState(false);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        }
    };
    controller.getRouteController().addRoute(route);

    return Promise.resolve();
}

export { init };