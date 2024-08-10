class String2FormEntry extends FormEntry {

    _$input;

    constructor(form, attribute) {
        super(form, attribute);
    }

    async renderValue(value) {
        this._value = value;

        if (this._$value)
            this._$value.empty();
        else
            this._$value = $('<div/>').addClass('value');

        const name = this._attribute['name'];

        if (value == null || value == undefined) {
            if (this._attribute.hasOwnProperty('defaultValue'))
                value = this._attribute['defaultValue'];
            else
                value = '';
        }

        var size;
        if (this._attribute.size)
            size = this._attribute.size;
        else
            size = 100;

        this._$input = $('<input/>')
            .attr('type', 'text')
            .attr('size', size)
            .attr('name', name)
            .attr('id', this._id)
            .val(value);

        if (!this.isEditable())
            this._$input.attr('disabled', true);

        this._$value.append(this._$input);

        return Promise.resolve(this._$value);
    }

    async readValue() {
        const value = this._$input.val();
        return Promise.resolve(value);
    }
}