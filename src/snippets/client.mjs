async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + '/api/ext/snippets/public';
    if (typeof ConsolePanel === 'undefined')
        resources.push(loadScript(publicDir + '/js/console-panel.js'));
    if (typeof SnippetController === 'undefined')
        resources.push(loadScript(publicDir + '/js/snippet-controller.js'));
    if (typeof SelectSnippetPanel === 'undefined')
        resources.push(loadScript(publicDir + '/js/select-snippet-panel.js'));
    if (typeof CrudSnippetPanel === 'undefined')
        resources.push(loadScript(publicDir + '/js/crud-snippet-panel.js'));
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

    var application = {
        'name': 'Snippets',
        'icon': new Icon('code'),
        'start': async function (event) {
            if (event.ctrlKey)
                app.getController().getModalController().openPanelInModal(new ConsolePanel());
            else
                app.getController().loadState(new State({ customRoute: '/console' }), true);
            return Promise.resolve();
        }
    };
    controller.getAppController().addApp(application);

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
                        'click': async function (event, icon) {
                            const controller = app.getController();
                            try {
                                controller.setLoadingState(true);
                                await controller.getModalController().openPanelInModal(new SelectSnippetPanel(state.typeString));
                                controller.setLoadingState(false);
                            } catch (error) {
                                controller.setLoadingState(false);
                                controller.showError(error);
                            }
                            return Promise.resolve();
                        },
                        'style': 'custom-style'
                    };
                }
            }
            return conf;
        }
    }
    extensions.push(menu);

    const models = controller.getModelController().getModels(true);
    for (var model of models) {
        await initModel(model);
    }
    return Promise.resolve();
}

async function initModel(model) {
    SnippetController.initSideMenu(model);
    return Promise.resolve();
}

export { init, initModel };