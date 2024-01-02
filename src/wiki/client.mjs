async function init() {
    const controller = app.getController();

    if (typeof WikiPanel === 'undefined') {
        const apiController = controller.getApiController();
        await loadScript(apiController.getApiOrigin() + "/api/ext/wiki/public/wiki-panel.js");
    }

    controller.getPanelController().addPanelClass('WikiPanel', WikiPanel);

    return Promise.resolve();
}

export { init };