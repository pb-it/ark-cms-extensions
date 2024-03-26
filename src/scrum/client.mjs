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
        "fn": async function (path) {
            const controller = app.getController();
            try {
                controller.setLoadingState(true);
                var data;
                var index = path.indexOf('?');
                if (index != -1) {
                    data = {};
                    var tmp = path.substring(index);
                    const urlParams = new URLSearchParams(tmp);
                    tmp = urlParams.getAll('project');
                    if (tmp.length == 1)
                        data['project'] = tmp[0];
                    tmp = urlParams.getAll('artifacts');
                    if (tmp.length == 1)
                        data['artifacts'] = tmp[0].split(',');
                    else if (tmp.length > 1)
                        data['artifacts'] = tmp;
                    tmp = urlParams.getAll('assignee');
                    if (tmp.length == 1)
                        data['assignee'] = tmp[0];
                } else {
                    var tmp = controller.getStorageController().loadLocal('scrumFilter');
                    if (tmp)
                        data = JSON.parse(tmp);
                }
                const board = new KanbanBoard(data);
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