async function init() {
    const controller = app.getController();
    const apiController = controller.getApiController();

    const scripts = [];
    if (typeof MimeEnumDataType === 'undefined')
        scripts.push(loadScript(apiController.getApiOrigin() + "/api/ext/mime-enum/public/mime-enum-data-type.js"));
    if (scripts.length > 0)
        await Promise.all(scripts);

    const dtc = controller.getDataTypeController();
    const mimeEnum = new MimeEnumDataType();
    dtc.addDataType(mimeEnum);

    return Promise.resolve();
}

export { init };