class TemplateDataType extends DataType {

    constructor() {
        super();
        this._tag = 'template';
    }

    getSkeleton(attributes) {
        const skeleton = null;
        return skeleton;
    }

    /**
     * *OPTIONAL*
     * @param {*} current 
     * @param {*} add 
     * @returns 
     */
    applySkeleton(current, add) {
        const merged = { ...current, ...add };
        if (merged['readonly'] === false)
            delete merged['readonly'];
        if (merged['persistent'] === true)
            delete merged['persistent'];
        return merged;
    }

    getFormEntryClass() {
        return BasicFormEntry;
    }

    async renderView($value, attribute, data) {
        try {
            var value;
            const name = attribute['name'];
            if (data && data[name]) {
                if (typeof data[name] === 'string' || data[name] instanceof String)
                    value = encodeText(data[name]);
                else
                    value = data[name];
            } else
                value = "";
            $value.html(value);
        } catch (error) {
            $value.html("&lt;ERROR&gt;");
            app.getController().showError(error);
        }
        return Promise.resolve();
    }

    /**
     * *OPTIONAL*
     * @returns 
     */
    /*getHasChangedFunction() {
        return async function (attribute, olddata, newdata) {
            var bChanged = false;
            const property = attribute['name'];
            var newValue = newdata[property];
            var oldValue;
            if (olddata)
                oldValue = olddata[property];
            else
                oldValue = null;
            if (oldValue != newValue)
                bChanged = true;
            return Promise.resolve(bChanged);
        }
    }*/

    /**
     * *OPTIONAL*
     * @returns 
     */
    /*getSortFunction()  {
        return function (arr, criteria) {
            return arr;
        }
    }*/

    /**
     * *OPTIONAL*
     * @returns 
     */
    /*getFilterFunction()  {
        return function (items, template, property) {
            return items;
        }
    }*/
}