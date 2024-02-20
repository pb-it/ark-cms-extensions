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
                const items = [];
                const tasks = await controller.getDataService().fetchData('tasks');
                if (tasks && tasks.length > 0) {
                    for (var task of tasks) {
                        items.push(new KanbanBoardItem({ 'bSelectable': true, 'bContextMenu': true }, new CrudObject('tasks', task)));
                    }
                }
                const defects = await controller.getDataService().fetchData('defects');
                if (defects && defects.length > 0) {
                    for (var defect of defects) {
                        items.push(new KanbanBoardItem({ 'bSelectable': true, 'bContextMenu': true }, new CrudObject('defects', defect)));
                    }
                }

                const board = new KanbanBoard(items);
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