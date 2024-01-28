async function init() {
    const controller = app.getController();

    if (typeof File2FormEntry === 'undefined') {
        const apiController = controller.getApiController();
        await loadScript(apiController.getApiOrigin() + "/api/ext/file2/public/file2-form-entry.js");
    }

    const dtc = controller.getDataTypeController();
    const file2 = {
        tag: 'file2',
        getSkeleton: function (attributes) {
            var options = [];
            var strAttr;
            if (attributes) {
                strAttr = attributes.filter(function (x) { return x['dataType'] === "string" });
                if (strAttr) {
                    options = strAttr.map(function (x) {
                        return { 'value': x['name'] };
                    });
                    options = options.sort((a, b) => a['value'].localeCompare(b['value']));
                }
            }
            var cdn;
            const info = app.getController().getApiController().getApiInfo();
            if (info['cdn'] && info['cdn'].length > 0)
                cdn = info['cdn'].map(function (x) { return { 'value': x['url'] }; });
            const skeleton = [
                {
                    'name': 'storage',
                    'dataType': 'enumeration',
                    'options': [
                        { 'value': 'filesystem' },
                        { 'value': 'database(base64)' },
                        { 'value': 'database(blob)', 'disabled': true }
                    ],
                    'view': 'select',
                    'required': true,
                    changeAction: async function (entry) {
                        var fData = await entry._form.readForm(false, false);
                        var cdn = entry._form.getFormEntry('cdn');
                        var fn = entry._form.getFormEntry('filename_prop');
                        if (fData['storage'] == 'filesystem') {
                            await cdn.show();
                            fn.hide();
                        } else {
                            cdn.hide();
                            await fn.show();
                        }
                        return Promise.resolve();
                    },
                },
                {
                    'name': 'cdn',
                    'label': 'CDN',
                    'tooltip': '**INFO**: Available CDNs have to be configured at your backend server(API).',
                    'dataType': 'enumeration',
                    'view': 'select',
                    'options': cdn,
                    'required': true,
                    'hidden': true
                },
                {
                    'name': 'filename_prop',
                    'label': 'Filename attribute',
                    'tooltip': '**Info**: Attribute for storing the filename.',
                    'dataType': 'enumeration',
                    'options': options,
                    'view': 'select'
                },
                {
                    'name': 'url_prop',
                    'label': 'URL attribute',
                    'tooltip': '**Info**: Attribute for storing the URL information given for downloading the file.',
                    'dataType': 'enumeration',
                    'options': options,
                    'view': 'select'
                }
            ];
            return skeleton;
        },
        sort: function (arr, criteria) {
            if (criteria === "asc")
                arr.sort(function (a, b) {
                    if (a[prop] === "" || a[prop] === null) return 1;
                    if (b[prop] === "" || b[prop] === null) return -1;
                    if (a[prop] === b[prop]) return 0;
                    return a[prop].localeCompare(b[prop]);
                });
            else if (criteria === "desc")
                arr.sort(function (a, b) {
                    if (a[prop] === "" || a[prop] === null) return 1;
                    if (b[prop] === "" || b[prop] === null) return -1;
                    if (a[prop] === b[prop]) return 0;
                    return b[prop].localeCompare(a[prop]);
                });
        },
        filter: function (items, template, property) {
            return Filter.filterString(items, template, property, FilterEnum.contains);
        },
        hasChanged: function (oldValue, newValue) {
            return !oldValue || (newValue !== oldValue);
        },
        formEntryClass: File2FormEntry,
        renderView: async function ($value, attribute, data) {
            try {
                const name = attribute['name'];
                if (data && data[name]) {
                    if (attribute['storage'] == 'filesystem') {
                        var fileName;
                        var x = data[name];
                        var value = null;
                        if (typeof (x) === 'string' || (x) instanceof String)
                            fileName = x;
                        else {
                            if (x['filename'])
                                fileName = x['filename'];
                            else if (x['url']) {
                                fileName = x['url'];
                                value = x['url'];
                            }
                        }
                        if (!value) {
                            if (attribute['cdn'])
                                value = CrudObject._buildUrl(attribute['cdn'], fileName);
                            else
                                value = fileName;
                        }
                        $value.html("<a href='" + value + "' target='_blank'>" + fileName + "</a><br>");
                    } else if (attribute['storage'] == 'base64') {
                        var filename;
                        if (attribute['filename_prop'] && data[attribute['filename_prop']])
                            filename = data[attribute['filename_prop']];
                        else
                            filename = 'undefined';
                        var $button = $("<button/>")
                            .text("download")
                            .click(function (event) {
                                event.stopPropagation();
                                const a = document.createElement('a');
                                a.href = data[name];
                                a.download = filename;
                                a.click();
                                URL.revokeObjectURL(a.href);
                            });
                        $value.append($button);
                    } else if (attribute['storage'] == 'blob') {
                        var filename;
                        if (attribute['filename_prop'] && data[attribute['filename_prop']])
                            filename = data[attribute['filename_prop']];
                        else
                            filename = 'undefined';
                        var $button = $("<button/>")
                            .text("download")
                            .click(function (event) {
                                event.stopPropagation();
                                const a = document.createElement('a');
                                //const file = new Blob(data[name].data, { type: "text/plain" });
                                const file = new Blob(data[name].data, { type: data[name].type });
                                //const file = new File(data[name], 'hello_world.txt', { type: 'text/plain' });
                                a.href = URL.createObjectURL(file);
                                a.download = filename;
                                a.click();
                                URL.revokeObjectURL(a.href);
                            });
                        $value.append($button);
                    } else
                        $value.html("");
                } else
                    $value.html("");
            } catch (error) {
                $value.html("&lt;ERROR&gt;");
                app.getController().showError(error);
            }
            return Promise.resolve();
        }
    };
    dtc.addDataType(file2);

    return Promise.resolve();
}

export { init };