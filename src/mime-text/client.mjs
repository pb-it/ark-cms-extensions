async function init() {
    const controller = app.getController();

    if (typeof MimeTextFormEntry === 'undefined') {
        const apiController = controller.getApiController();
        await loadScript(apiController.getApiOrigin() + "/api/ext/mime-text/public/mime-text-form-entry.js");
    }

    const dtc = controller.getDataTypeController();
    var mimeText = {
        tag: 'mime-text',
        //skeleton: skeleton,
        getSkeleton: function (attributes) {
            var stringAttrNames;
            if (attributes) {
                var stringAttr = attributes.filter(function (x) { return (x['dataType'] === 'string' || x['dataType'] === 'text' || x['dataType'] === 'enumeration' || x['dataType'] === 'url') });
                stringAttrNames = stringAttr.map(function (x) { return { 'value': x['name'] } });
            } else
                stringAttrNames = [];

            var skeleton = [
                { 'name': 'length', 'dataType': 'string', 'tooltip': '**Info**: Constraints depend on database and character encoding. Default is 255 for \'string\' and 65,535 for \'text\'' }
            ];
            var info = controller.getApiController().getApiInfo();
            var client = info['db']['client'];
            if (client === 'mysql' || client === 'mysql2') {
                skeleton.push(
                    {
                        'name': 'charEncoding',
                        'label': 'Encoding',
                        'tooltip': `**Info**: The default character encoding for the column will be taken from its table.`,
                        'dataType': 'enumeration',
                        'options': [
                            { 'value': 'default' },
                            { 'value': 'latin1' },
                            { 'value': 'utf8' },
                            { 'value': 'utf8mb4' }
                        ],
                        'view': 'select'
                    }
                );
            }
            skeleton.push(
                {
                    'name': 'view',
                    'label': 'syntax',
                    'dataType': 'enumeration',
                    'options': MimeTextFormEntry.OPTIONS,
                    'tooltip': `Default behavior is as \'plain\' which may result in WYSIWYG.
\'plain+html\' enables you to mix preformatted plain text with interpret and rendered html-code between \<html\>/\</html\> tags.`,
                    'view': 'select'
                },
                {
                    'name': 'bSyntaxPrefix',
                    'label': 'individual syntax',
                    'tooltip': `Choose syntax individual for every entry.
An media / MIME type string will be prepended to your data.
You will not see this information in forms, but it is stored with your actual string in the database and consumes space.`,
                    'dataType': 'boolean',
                    'required': true,
                    'defaultValue': false
                },
                {
                    'name': 'syntaxProp',
                    'dataType': 'enumeration',
                    'options': stringAttrNames,
                    'view': 'select'
                },
                { 'name': 'size', 'dataType': 'string' },
                { 'name': 'defaultValue', 'dataType': 'string' }
            );
            return skeleton;
        },
        /*applySkeleton: function (data, change) {
            if (change.length) //TODO: MEDIUMTEXT / LONGTEXT
                data.length = change.length;
            if (change.charEncoding)
                data.charEncoding = change.charEncoding;
            if (change.view) {
                if (change.view === '*custom*')
                    data.view = '*';
                else
                    data.view = change.view;
            }
            if (change.bSyntaxPrefix)
                data.bSyntaxPrefix = change.bSyntaxPrefix;
            if (change.size)
                data.size = change.size;
            if (change.defaultValue)
                data.defaultValue = change.defaultValue;
        },*/
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
        formEntryClass: MimeTextFormEntry,
        renderView: async function ($value, attribute, data) {
            try {
                var view;
                $value.addClass('text');
                if (data) {
                    var value = data[attribute['name']]
                    if (typeof value === 'string' || value instanceof String) {
                        if (attribute['syntaxProp']) {
                            view = data[attribute['syntaxProp']];
                        } else if (attribute['bSyntaxPrefix']) {
                            var index = value.indexOf(','); //data:text/plain;charset=utf-8,
                            if (index > -1) {
                                view = DataView.getSyntax(value.substr(0, index));
                                value = value.substr(index + 1);
                            }
                        } else
                            view = attribute['view'];
                        if (view) {
                            if (view.startsWith('text/'))
                                view = view.substring(5);
                            switch (view) {
                                case 'html':
                                    break;
                                case 'markdown':
                                    $value.addClass('markdown');
                                    value = await DataView.parseMarkdown(value);
                                    break;
                                case 'javascript':
                                case 'bat':
                                case 'x-bat':
                                case 'x-sh':
                                case 'x-shellscript':
                                    $value.addClass('pre');
                                    if (['javascript'].includes(view))
                                        value = await DataView.highlightCode(value, view);
                                    else
                                        value = await DataView.highlightCode(value);
                                    break;
                                case 'plain+html':
                                    $value.addClass('pre');
                                    value = DataView._parseText(value);
                                    break;
                                case 'csv':
                                case 'xml':
                                case 'plain': //preformatted / WYSIWYG
                                default:
                                    $value.addClass('pre');
                                    value = encodeText(value);
                            }
                        } else {
                            $value.addClass('pre');
                            value = encodeText(value);
                        }
                    }
                } else
                    value = "";
                $value.html(value);
                if (view) {
                    if (view === 'markdown')
                        await DataView.highlightBlock($value[0]);
                }
            } catch (error) {
                $value.html("&lt;ERROR&gt;");
                app.getController().showError(error);
            }
            return Promise.resolve();
        }
    };
    dtc.addDataType(mimeText);

    return Promise.resolve();
}

export { init };