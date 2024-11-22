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

    return Promise.resolve();
}

export { init };