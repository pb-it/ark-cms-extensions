async function configure() {
    return app.getController().getModalController().openPanelInModal(new ConfigureDashboardPanel());
}

async function init() {
    const controller = app.getController();

    const scripts = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/dashboard/public";
    if (typeof DashboardController === 'undefined')
        scripts.push(loadScript(publicDir + "/dashboard-controller.js"));
    if (typeof DashboardConfigTab === 'undefined')
        scripts.push(loadScript(publicDir + "/dashboard-config-tab.js"));
    if (typeof ConfigureDashboardPanel === 'undefined')
        scripts.push(loadScript(publicDir + "/configure-dashboard-panel.js"));
    await Promise.all(scripts);

    const route = {
        "regex": "^/dashboard/.*$",
        "fn": async function (path) {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);
                var panels;
                const parts = path.split('/');
                if (parts.length == 3) {
                    const model = controller.getModelController().getModel(parts[2]);
                    if (model && typeof model['createDashboard'] === 'function')
                        panels = await model.createDashboard();
                }
                if (panels)
                    await controller.getView().getCanvas().showPanels(panels);
                else
                    throw new Error("No dashboard defined");
                controller.setLoadingState(false);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        }
    };
    controller.getRouteController().addRoute(route);

    const models = controller.getModelController().getModels();
    for (var model of models) {
        await initModel(model);
    }
    return Promise.resolve();
}

async function initModel(model) {
    DashboardController.initDashboard(model);
    return Promise.resolve();
}

export { configure, init, initModel };