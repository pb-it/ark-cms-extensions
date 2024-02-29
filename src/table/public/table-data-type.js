class TableDataType extends DataType {

    constructor() {
        super();
        this._tag = 'table';
    }

    getSkeleton(attributes) {
        const skeleton = [
            { 'name': 'length', 'dataType': 'string', 'tooltip': '**Info**: Constraints depend on database and character encoding. Default value is going to be 65,535.' }
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
                $value.html(value);
            } else
                $value.html('');
        } catch (error) {
            $value.html('&lt;ERROR&gt;');
            app.getController().showError(error);
        }
        return Promise.resolve();
    }
}