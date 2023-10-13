async function init() {
    var controller = app.getController();

    if (typeof ConsolePanel === 'undefined') {
        var apiController = controller.getApiController();
        await loadScript(apiController.getApiOrigin() + "/api/ext/console/public/console-panel.js");
    }

    var route = {
        "regex": "^/console$",
        "fn": async function () {
            return app.getController().getView().getCanvas().showPanels([new ConsolePanel()]);
        }
    };
    controller.getRouteController().addRoute(route);

    controller.getView().getSideNavigationBar().addIconBarItem(() => {
        var conf;
        if (app.getController().hasConnection() && app.getController().isInDebugMode()) {
            conf = {
                'style': 'iconbar',
                'icon': "terminal",
                'tooltip': "Console",
                'click': function (event, icon) {
                    var controller = app.getController();
                    controller.getView().getSideNavigationBar().close();

                    if (event.ctrlKey)
                        controller.getModalController().openPanelInModal(new ConsolePanel());
                    else
                        controller.loadState(new State({ customRoute: '/console' }), true);
                }
            };
        }
        return conf;
    }, false);

    return Promise.resolve();
}

export { init };