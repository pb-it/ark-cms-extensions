async function configure() {
    const controller = app.getController();
    const ds = controller.getDataService();
    const skeleton = [
        { name: 'api', dataType: 'json' },
        { name: 'default', dataType: 'string' }
    ];
    const data = {};
    var api;
    var tmp = await ds.fetchData('_registry', null, 'key=availableStockAPI');
    if (tmp && tmp.length == 1)
        api = JSON.parse(tmp[0]['value']);
    if (api)
        data['api'] = api;
    else
        data['api'] = [];
    var defaultApi;
    tmp = await ds.fetchData('_registry', null, 'key=defaultStockAPI');
    if (tmp && tmp.length == 1)
        defaultApi = tmp[0]['value'];
    if (defaultApi)
        data['default'] = defaultApi;
    else
        data['default'] = '';

    const panel = new FormPanel(null, skeleton, data);
    panel.setApplyAction(async function () {
        try {
            controller.setLoadingState(true);
            const changed = await panel.getChanges();
            if (changed) {
                if (changed['api'])
                    await ds.request('_registry', ActionEnum.update, null, { 'key': 'availableStockAPI', 'value': changed['api'] });
                if (changed['default'])
                    await ds.request('_registry', ActionEnum.update, null, { 'key': 'defaultStockAPI', 'value': changed['default'] });
            }
            panel.dispose();
            controller.setLoadingState(false);
        } catch (error) {
            controller.setLoadingState(false);
            controller.showError(error);
        }
        return Promise.resolve();
    });
    return controller.getModalController().openPanelInModal(panel);
}

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

export { init, configure };