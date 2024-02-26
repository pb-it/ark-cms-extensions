async function init() {
    const controller = app.getController();
    const apiController = controller.getApiController();

    const scripts = [];
    if (typeof CrudPanelOverride === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/panel-override/public/crud-panel-override.js"));
    if (typeof MediaPanelOverride === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/panel-override/public/media-panel-override.js"));
    if (scripts.length > 0)
        await Promise.all(scripts);

    controller.getPanelController().addPanelClass('CrudPanel', CrudPanelOverride);
    controller.getPanelController().addPanelClass('MediaPanel', MediaPanelOverride);

    return Promise.resolve();
}

export { init };