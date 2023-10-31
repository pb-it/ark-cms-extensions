async function init() {
    const controller = app.getController();

    if (typeof Scraper === 'undefined') {
        const apiController = controller.getApiController();
        await loadScript(apiController.getApiOrigin() + "/api/ext/scraper/public/scraper.js");
    }
    await Scraper.initModel();

    return Promise.resolve();
}

export { init };