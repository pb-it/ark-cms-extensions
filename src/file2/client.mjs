async function init() {
    const controller = app.getController();
    const apiController = controller.getApiController();

    const scripts = [];
    if (typeof File2DataType === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/file2/public/file2-data-type.js"));
    if (typeof File2FormEntry === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/file2/public/file2-form-entry.js"));
    if (scripts.length > 0)
        await Promise.all(scripts);

    const dtc = controller.getDataTypeController();
    const file2DataType = new File2DataType();
    dtc.addDataType(file2DataType);

    return Promise.resolve();
}

export { init };