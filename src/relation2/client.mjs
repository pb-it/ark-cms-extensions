async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/relation2/public";
    if (typeof Relation2DataType === 'undefined')
        resources.push(loadScript(publicDir + "/relation2-data-type.js"));
    if (typeof Relation2FormEntry === 'undefined')
        resources.push(loadScript(publicDir + "/relation2-form-entry.js"));
    if (resources.length > 0)
        await Promise.all(resources);

    const dtc = controller.getDataTypeController();
    const dt = new Relation2DataType();
    dtc.addDataType(dt);

    return Promise.resolve();
}

export { init };