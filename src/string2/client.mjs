async function init() {
    const controller = app.getController();

    const resources = [];
    const apiController = controller.getApiController();
    const origin = apiController.getApiOrigin();
    const publicDir = origin + "/api/ext/string2/public";
    if (typeof String2DataType === 'undefined')
        resources.push(loadScript(publicDir + "/string2-data-type.js"));
    if (typeof String2FormEntry === 'undefined')
        resources.push(loadScript(publicDir + "/string2-form-entry.js"));
    if (resources.length > 0)
        await Promise.all(resources);

    const dtc = controller.getDataTypeController();
    const dt = new String2DataType();
    dtc.addDataType(dt);

    return Promise.resolve();
}

export { init };