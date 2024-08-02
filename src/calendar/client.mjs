async function teardown() {
    var bConfirm = confirm("Delete extension 'backup'?");
    if (bConfirm && confirm("Also delete models?")) {
        const controller = app.getController();
        var model = controller.getModelController().getModel('calendar-entries');
        if (model)
            await model.deleteModel();
    }
    return Promise.resolve(bConfirm);
}

async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/calendar/public";
    if (typeof Calendar === 'undefined')
        resources.push(loadScript(publicDir + "/calendar.js"));
    if (resources.length > 0)
        await Promise.all(resources);

    const route = {
        "regex": "^/calendar$",
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
                    //TODO: parse date
                } else {
                    ;
                }
                const calendar = new Calendar(data);
                controller.getView().getCanvas().showPanels([calendar]);
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