async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/stocks/public";
    if (typeof Stock === 'undefined')
        resources.push(loadScript(publicDir + "/stock.js"));
    if (typeof Balance === 'undefined')
        resources.push(loadScript(publicDir + "/balance.js"));
    await Promise.all(resources);

    await Stock.initModel();

    const mTransaction = controller.getModelController().getModel('transaction');
    mTransaction._prepareDataAction = function (data) {
        if (data.type) {
            data.title = data.type;
            if (data.stock)
                data.title += "(" + data.stock.name + ")";
            if (data.total)
                data.title += ": " + data.total;
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