async function init() {
    const controller = app.getController();

    const scripts = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/scraper/public";
    if (typeof Scraper === 'undefined')
        scripts.push(loadScript(publicDir + "/scraper.js"));
    if (typeof EditScraperPanel === 'undefined')
        scripts.push(loadScript(publicDir + "/edit-scraper-panel.js"));
    await Promise.all(scripts);

    await Scraper.initModel();

    return Promise.resolve();
}

export { init };