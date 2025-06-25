async function configure() {
    return app.getController().getModalController().openPanelInModal(new DlhConfigPanel());
}

async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + '/api/ext/dlh/public';
    if (typeof DlhConfigPanel === 'undefined')
        resources.push(loadScript(publicDir + '/dlh-config-panel.js'));
    if (typeof DlhOverview === 'undefined')
        resources.push(loadScript(publicDir + '/dlh-overview.js'));
    if (resources.length > 0)
        await Promise.all(resources);

    const route = {
        "regex": "^/dlh$",
        "fn": async function () {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);

                const panel = new DlhOverview();
                controller.getView().getCanvas().showPanels([panel]);

                controller.setLoadingState(false);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        }
    };
    controller.getRouteController().addRoute(route);

    controller.getView().getSideNavigationBar().addIconBarItem({
        name: 'dlh',
        func: () => {
            var conf;
            if (controller.hasConnection()) {
                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('download'),
                    'tooltip': 'DownloadHelper',
                    'click': function (event, icon) {
                        const controller = app.getController();
                        controller.getView().getSideNavigationBar().close();

                        controller.loadState(new State({ customRoute: '/dlh' }), true);
                    }
                };
            }
            return conf;
        }
    }, false);

    return Promise.resolve();
}

export { configure, init };