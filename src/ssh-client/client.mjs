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

    var application = {
        'name': 'SSH Client',
        'icon': new Icon('terminal'),
        'start': async function (event) {
            if (event.ctrlKey)
                app.getController().getModalController().openPanelInModal(new SshClientPanel());
            else
                app.getController().loadState(new State({ customRoute: '/ssh-client' }), true);
            return Promise.resolve();
        }
    };
    controller.getAppController().addApp(application);

    return Promise.resolve();
}

export { init };