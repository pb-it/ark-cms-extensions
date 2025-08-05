async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/scraper/public";
    if (typeof Scraper === 'undefined')
        resources.push(loadScript(publicDir + "/scraper.js"));
    if (typeof TestScraperPanel === 'undefined')
        resources.push(loadScript(publicDir + "/test-scraper-panel.js"));
    await Promise.all(resources);

    const route = {
        "regex": "^/scraper$",
        "fn": async function () {
            return app.getController().getView().getCanvas().showPanels([new TestScraperPanel()]);
        }
    };
    controller.getRouteController().addRoute(route);

    await Scraper.initModel();

    var application = {
        'name': 'Scraper',
        'icon': new Icon('mosquito'),
        'start': async function (event, icon) {
            if (event.ctrlKey)
                await controller.getModalController().openPanelInModal(new ScraperPanel());
            else
                controller.loadState(new State({ customRoute: '/scraper' }), true);
            return Promise.resolve();
        }
    };
    controller.getAppController().addApp(application);

    return Promise.resolve();
}

export { init };