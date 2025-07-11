async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/browser-bookmarks/public";
    if (typeof BrowserBookmarks === 'undefined')
        resources.push(loadScript(publicDir + "/browser-bookmarks.js"));
    if (resources.length > 0)
        await Promise.all(resources);

    await BrowserBookmarks.initModel();

    return Promise.resolve();
}

export { init };