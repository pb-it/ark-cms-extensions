class TableDataType extends DataType {

    constructor() {
        super();
        this._tag = 'table';
    }

    getSkeleton(attributes) {
        const skeleton = [
            {
                'name': 'length',
                'dataType': 'string',
                'tooltip': '**Info**: Constraints depend on database and character encoding. Default value is going to be 65,535.'
            },
            {
                'name': 'format',
                'tooltip': `**Info**: Format in which the table is stored in the database.`,
                'dataType': 'enumeration',
                'options': [
                    { 'label': 'HTML', 'value': 'html' },
                    { 'label': 'JSON', 'value': 'json' }
                ],
                'view': 'select',
                'required': true
            }
        ];
        return skeleton;
    }

    getFormEntryClass() {
        return TableFormEntry;
    }

    async renderView($value, attribute, data) {
        try {
            const name = attribute['name'];
            const value = data[name];
            if (value) {
                const format = attribute['format'];
                if (!format || format === 'html')
                    $value.html(value);
                else if (format === 'json') {
                    var nColumns;
                    var nRows = value['tbody'].length;
                    if (nRows > 0)
                        nColumns = value['tbody'][0].length;
                    if (nColumns > 0)
                        $value.append(TableFormEntry._createTable(nColumns, nRows, value));
                }
            } else
                $value.html('');
        } catch (error) {
            $value.html('&lt;ERROR&gt;');
            app.getController().showError(error);
        }
        return Promise.resolve();
    }

    getHasChangedFunction() {
        return async function (attribute, olddata, newdata) {
            const property = attribute['name'];
            const format = attribute['format'];
            const newValue = newdata[property];
            var oldValue;
            if (olddata)
                oldValue = olddata[property];
            else
                oldValue = null;

            if (!format || format === 'html') {
                if (oldValue) {
                    return Promise.resolve(newValue !== oldValue);
                } else {
                    if (newValue)
                        return Promise.resolve(true);
                }
            } else if (format === 'json') {
                if (oldValue) {
                    if (typeof Diff === 'undefined')
                        await loadScript("https://cdn.jsdelivr.net/npm/diff@5.1.0/dist/diff.min.js");
                    const diff = Diff.diffJson(oldValue, newValue);
                    return Promise.resolve(diff.length > 1);
                } else {
                    if (newValue && Object.keys(newValue) > 0)
                        return Promise.resolve(true);
                }
            }
            return Promise.resolve(false);
        }
    }
}