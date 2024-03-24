async function teardown() {
    const controller = app.getController();
    if (confirm("Also delete models?")) {
        var model = controller.getModelController().getModel('projects');
        if (model)
            await model.deleteModel();
        model = controller.getModelController().getModel('user-stories');
        if (model)
            await model.deleteModel();
        model = controller.getModelController().getModel('tasks');
        if (model)
            await model.deleteModel();
        model = controller.getModelController().getModel('defects');
        if (model)
            await model.deleteModel();
    }
    return Promise.resolve(true);
}

async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/scrum/public";
    if (typeof KanbanBoard === 'undefined') {
        resources.push(loadScript(publicDir + "/kanban-board.js"));
        resources.push(loadScript(publicDir + "/kanban-board-column.js"));
        resources.push(loadScript(publicDir + "/kanban-board-item.js"));
        resources.push(loadStyle(publicDir + "/kanban-board.css"));
    }
    await Promise.all(resources);

    const route = {
        "regex": "^/kanban-board$",
        "fn": async function () {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);
                const board = new KanbanBoard();
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

export { teardown, init };