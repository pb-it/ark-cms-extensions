async function init() {

    const resources = [];
    const controller = app.getController();
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    resources.push(loadScript(origin + "/api/ext/ssh-client/socket.io/socket.io.js"));
    const publicDir = origin + "/api/ext/ssh-client/public";
    if (typeof SshClientPanel === 'undefined')
        resources.push(loadScript(publicDir + "/ssh-client-panel.js"));
    //if (resources.length > 0)
    await Promise.all(resources);

    const route = {
        "regex": "^/ssh-client$",
        "fn": async function () {
            return app.getController().getView().getCanvas().showPanels([new SshClientPanel()]);
        }
    };
    controller.getRouteController().addRoute(route);

    controller.getView().getSideNavigationBar().addIconBarItem({
        name: 'ssh-client',
        func: () => {
            var conf;
            if (app.getController().hasConnection() && app.getController().isInDebugMode()) {
                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('terminal'),
                    'tooltip': 'SSH Client',
                    'click': function (event, icon) {
                        var controller = app.getController();
                        controller.getView().getSideNavigationBar().close();

                        if (event.ctrlKey)
                            controller.getModalController().openPanelInModal(new SshClientPanel());
                        else
                            controller.loadState(new State({ customRoute: '/ssh-client' }), true);
                    }
                };
            }
            return conf;
        }
    }, false);

    return Promise.resolve();
}

export { init };