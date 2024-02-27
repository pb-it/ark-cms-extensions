async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/note/public";
    if (typeof NotePanel === 'undefined')
        resources.push(loadScript(publicDir + "/note-panel.js"));
    if (typeof BulletinBoard === 'undefined')
        resources.push(loadScript(publicDir + "/bulletin-board.js"));
    if (typeof BulletinBoardWrapper === 'undefined')
        resources.push(loadScript(publicDir + "/bulletin-board-wrapper.js"));
    await Promise.all(resources);

    controller.getPanelController().addPanelClass('NotePanel', NotePanel);

    const route = {
        "regex": "^/bulletin-board$",
        "fn": async function () {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);
                const board = new BulletinBoard();
                controller.getView().getCanvas().showPanels([board]);
                controller.setLoadingState(false);
            } catch (error) {
                controller.setLoadingState(false);
                controller.showError(error);
            }
            return Promise.resolve();
        }
    };
    controller.getRouteController().addRoute(route);

    return Promise.resolve();
}

export { init };