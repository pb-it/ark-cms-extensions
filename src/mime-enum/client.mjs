async function init() {
    const controller = app.getController();

    const dtc = controller.getDataTypeController();
    var mimeEnum = {
        tag: 'mime-enum',
        baseDataType: {
            dataType: 'enumeration',
            view: 'select',
            options: [
                { 'value': 'text/csv' },
                { 'value': 'text/xml' },
                { 'value': 'text/json' },
                { 'value': 'text/plain' },
                { 'value': 'text/html' },
                { 'value': 'text/plain+html' },
                { 'value': 'text/markdown' },
                { 'value': 'text/javascript' },
                { 'value': 'text/bat' },
                { 'value': 'text/x-bat' },
                { 'value': 'text/x-sh' },
                { 'value': 'text/x-shellscript' }
            ],
        }
    };
    dtc.addDataType(mimeEnum);

    return Promise.resolve();
}

export { init };