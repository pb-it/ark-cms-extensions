async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + '/api/ext/console/public';
    if (typeof ConsolePanel === 'undefined')
        resources.push(loadScript(publicDir + '/console-panel.js'));
    resources.push(loadStyle(publicDir + '/css/custom-menu.css'));
    //if (resources.length > 0)
    await Promise.all(resources);

    var route = {
        "regex": "^/console$",
        "fn": async function () {
            return app.getController().getView().getCanvas().showPanels([new ConsolePanel()]);
        }
    };
    controller.getRouteController().addRoute(route);

    controller.getView().getSideNavigationBar().addIconBarItem({
        name: 'snippets',
        func: () => {
            var conf;
            const controller = app.getController();
            if (controller.hasConnection() && controller.isInDebugMode()) {
                conf = {
                    'style': 'iconbar',
                    'icon': new Icon('code'),
                    'tooltip': 'Snippets',
                    'click': function (event, icon) {
                        const controller = app.getController();
                        controller.getView().getSideNavigationBar().close();

                        if (event.ctrlKey)
                            controller.getModalController().openPanelInModal(new ConsolePanel());
                        else
                            controller.loadState(new State({ customRoute: '/console' }), true);
                    }
                };
            }
            return conf;
        }
    }, false);

    const extensions = controller.getView().getTopNavigationBar().getBreadcrumb().getBreadcrumbExtensions();
    var menu = {
        func: () => {
            var conf;
            const controller = app.getController();
            if (controller.hasConnection() && controller.isInDebugMode()) {
                const state = app.getController().getStateController().getState();
                if (state.typeString && !state.customRoute && !state.funcState && (!state.action || state.action == ActionEnum.read)) {
                    conf = {
                        //'style': 'iconbar',
                        'icon': new Icon('code'),
                        'root': true,
                        'tooltip': 'Code',
                        'click': function (event, icon) {
                            alert('TODO');
                        },
                        'style': 'custom-style'
                    };
                }
            }
            return conf;
        }
    }
    extensions.push(menu);

    return Promise.resolve();
}

export { init };