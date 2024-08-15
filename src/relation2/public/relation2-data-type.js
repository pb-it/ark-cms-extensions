class Relation2DataType extends DataType {

    constructor() {
        super();
        this._tag = 'relation2';
    }

    getSkeleton(attributes) {
        const controller = app.getController();
        const models = controller.getModelController().getModels();
        const allModelNames = models.map(function (model) {
            return model.getDefinition()['name'];
        });
        var options = [];
        for (var name of allModelNames) {
            options.push({ 'value': name });
        }
        options = options.sort((a, b) => a['value'].localeCompare(b['value']));

        const skeleton = [
            {
                'name': 'model',
                'dataType': 'enumeration',
                'options': options,
                'view': 'select',
                'required': true
            },
            {
                'name': 'multiple',
                'dataType': 'boolean',
                'required': true,
                changeAction: async function (entry) {
                    const fData = await entry._form.readForm();
                    const tn = entry._form.getFormEntry('tableName');
                    const via = entry._form.getFormEntry('via');
                    if (fData['multiple']) {
                        await tn.enable();
                        await via.enable();
                    } else {
                        await tn.disable();
                        await via.disable();
                    }
                    return Promise.resolve();
                }.bind(this)
            },
            {
                'name': 'tableName',
                'dataType': 'string',
                'readonly': true
            },
            {
                'name': 'via',
                'dataType': 'string',
                'readonly': true
            }
        ];
        return skeleton;
    }

    applySkeleton(current, add) {
        const merged = { ...current };
        const baseDataType = {
            'name': current['name'],
            'dataType': 'relation',
            'model': add['model']
        };
        merged['model'] = add['model'];
        if (add['multiple']) {
            merged['multiple'] = add['multiple'];
            baseDataType['multiple'] = add['multiple'];
            if (add['tableName']) {
                merged['tableName'] = add['tableName'];
                baseDataType['tableName'] = add['tableName'];
            }
        }
        if (add['via']) {
            merged['via'] = add['via'];
            baseDataType['via'] = add['via'];
        }
        merged['baseDataType'] = baseDataType;

        if (merged['readonly'] === true)
            merged['readonly'] = true;
        if (merged['persistent'] === false)
            merged['persistent'] = false;
        return merged;
    }

    getFormEntryClass() {
        //return Relation2FormEntry;
        return SelectFormEntry;
    }

    async renderView($value, attribute, data) {
        try {
            const name = attribute['name'];
            if (data && data[name]) {
                const $list = await DataView.renderRelation(attribute, data[name]);
                $value.append($list);
            }
        } catch (error) {
            $value.html("&lt;ERROR&gt;");
            app.getController().showError(error);
        }
        return Promise.resolve();
    }

    getHasChangedFunction() {
        return async function (attribute, olddata, newdata) {
            var bChanged = false;
            const property = attribute['name'];
            if (attribute['baseDataType']['multiple']) {
                if (Array.isArray(newdata[property])) {
                    var newIds = newdata[property].map(function (item) {
                        if (isNaN(item))
                            return item['id'];
                        else
                            return item;
                    });
                    if (olddata && olddata[property] && olddata[property].length > 0) {
                        if (newIds.length == olddata[property].length) {
                            var oldIds = olddata[property].map(function (item) {
                                if (isNaN(item))
                                    return item['id'];
                                else
                                    return item;
                            });

                            for (var id of oldIds) {
                                if (newIds.indexOf(id) == -1) {
                                    bChanged = true;
                                    break;
                                }
                            }
                        } else
                            bChanged = true;
                    } else {
                        if (newIds.length > 0)
                            bChanged = true;
                    }
                } else
                    throw new Error("An unexpected error occurred");
            } else {
                var id;
                if (Number.isInteger(newdata[property]))
                    id = newdata[property];
                else if (newdata[property]['id'])
                    id = newdata[property]['id'];
                if (!olddata || !olddata[property] || (olddata[property] != id && olddata[property]['id'] != id))
                    bChanged = true;
            }
            return Promise.resolve(bChanged);
        }
    }
}