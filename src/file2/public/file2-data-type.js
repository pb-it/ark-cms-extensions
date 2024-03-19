class File2DataType extends DataType {

    constructor() {
        super();
        this._tag = 'file2';
    }

    getSkeleton(attributes) {
        var options = [];
        var optionsUrl = [];
        var attr;
        if (attributes) {
            attr = attributes.filter(function (x) { return x['dataType'] === "string" });
            if (attr) {
                options = attr.map(function (x) {
                    return { 'value': x['name'] };
                });
                options = options.sort((a, b) => a['value'].localeCompare(b['value']));
            }
            attr = attributes.filter(function (x) { return x['dataType'] === "string" || x['dataType'] === "url" });
            if (attr) {
                optionsUrl = attr.map(function (x) {
                    return { 'value': x['name'] };
                });
                optionsUrl = optionsUrl.sort((a, b) => a['value'].localeCompare(b['value']));
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
                    const fData = await entry._form.readForm({ bSkipNullValues: false, bValidate: false });
                    const cdn = entry._form.getFormEntry('cdn');
                    const fn = entry._form.getFormEntry('filename_prop');
                    const cf = entry._form.getFormEntry('bCustomFilename');
                    const sf = entry._form.getFormEntry('bSuggestFilename');
                    if (fData['storage'] == 'filesystem') {
                        await cdn.show();
                        await fn.hide();
                        await cf.enable();
                        if (fData['bCustomFilename'])
                            await sf.enable();
                    } else {
                        await cdn.hide();
                        await fn.show();
                        if (fData['filename_prop'] == undefined) {
                            await cf.disable();
                            await sf.disable();
                        } else {
                            await cf.enable();
                            if (fData['bCustomFilename'])
                                await sf.enable();
                        }
                    }
                    return Promise.resolve();
                }
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
                'view': 'select',
                'hidden': true,
                changeAction: async function (entry) {
                    const fData = await entry._form.readForm({ bSkipNullValues: false, bValidate: false });
                    const cf = entry._form.getFormEntry('bCustomFilename');
                    if (fData['filename_prop'] == undefined)
                        await cf.disable();
                    else
                        await cf.enable();
                    const sf = entry._form.getFormEntry('bSuggestFilename');
                    if ((fData['filename_prop'] == undefined) || !fData['bCustomFilename'])
                        await sf.disable();
                    else
                        await sf.enable();
                    return Promise.resolve();
                }
            },
            {
                'name': 'bCustomFilename',
                'label': 'Custom Filename',
                'tooltip': '**Info**: Allow input of custom filename. Otherwise the backend will generate a name with a free unique identifier(UID).',
                'dataType': 'boolean',
                'required': true,
                'defaultValue': true,
                'readonly': true,
                changeAction: async function (entry) {
                    const fData = await entry._form.readForm({ bSkipNullValues: false, bValidate: false });
                    const sf = entry._form.getFormEntry('bSuggestFilename');
                    if (fData['bCustomFilename'])
                        await sf.enable();
                    else
                        await sf.disable();
                    return Promise.resolve();
                }
            },
            {
                'name': 'bSuggestFilename',
                'label': 'Suggest Filename',
                'tooltip': '**Info**: Suggest filename based on given URL or file.',
                'dataType': 'boolean',
                'required': true,
                'defaultValue': true,
                'readonly': true
            },
            {
                'name': 'url_prop',
                'label': 'URL attribute',
                'tooltip': '**Info**: Attribute for storing the URL information given for downloading the file.',
                'dataType': 'enumeration',
                'options': optionsUrl,
                'view': 'select'
            }
        ];
        return skeleton;
    }

    applySkeleton(current, add) {
        const merged = { ...current, ...add };
        if (merged['storage'] == 'filesystem') {
            if (!merged.hasOwnProperty('unique'))
                merged['unique'] = true;
            if (merged['unique']) {
                if (!merged.hasOwnProperty('length'))
                    merged['length'] = 250;
                else if (merged['length'] > 250)
                    throw new Error('Length of unique properties must not be exceed 250 character');
            }
        }
        return merged;
    }

    getFormEntryClass() {
        return File2FormEntry;
    }

    async renderView($value, attribute, data) {
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

    getHasChangedFunction() {
        return async function (attribute, olddata, newdata) {
            const property = attribute['name'];
            var newValue = newdata[property];
            var oldValue;
            if (olddata)
                oldValue = olddata[property];
            else
                oldValue = null;
            if (oldValue) {
                if (attribute['storage'] == 'filesystem') {
                    if (typeof oldValue === 'string' || oldValue instanceof String) {
                        if ((newValue['filename'] || oldValue) && newValue['filename'] != oldValue)
                            return Promise.resolve(true);
                        if (newValue['base64'])
                            return Promise.resolve(true);
                    } else {
                        if ((newValue['filename'] || oldValue['filename']) && newValue['filename'] != oldValue['filename'])
                            return Promise.resolve(true);
                    }
                } else if (attribute['storage'] == 'base64') {
                    if (typeof oldValue === 'string' || oldValue instanceof String) {
                        if (newValue['base64'] != oldValue)
                            return Promise.resolve(true);
                    } else {
                        if (newValue['base64'] != oldValue['base64'])
                            return Promise.resolve(true);
                    }
                }
            } else {
                if (newValue['filename'] || newValue['base64'])
                    return Promise.resolve(true);
            }
            if (newValue['url']) {
                if (olddata && Object.keys(olddata).length > 0 && attribute['url_prop']) {
                    var val = olddata[attribute['url_prop']];
                    if (!val || val != newValue['url'])
                        return Promise.resolve(true);
                } else
                    return Promise.resolve(true);
            }
            return Promise.resolve(false);
        }
    }
}