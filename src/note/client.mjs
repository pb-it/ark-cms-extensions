async function init() {
    const controller = app.getController();

    if (typeof NotePanel === 'undefined') {
        const apiController = controller.getApiController();
        await loadScript(apiController.getApiOrigin() + "/api/ext/note/public/note-panel.js");
    }

    controller.getPanelController().addPanelClass('NotePanel', NotePanel);

    return Promise.resolve();
}

export { init };