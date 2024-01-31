class File2FormEntry extends FormEntry {

    _$inputFilename;
    _$inputUrl;
    _$inputFile;
    _$delete;

    constructor(form, attribute) {
        super(form, attribute);
    }

    async renderValue(value) {
        if (value) {
            if (typeof (value) === 'string' || (value) instanceof String) {
                this._value = {};
                var data = this._form.getFormData();
                if (this._attribute['storage'] == 'filesystem')
                    this._value['filename'] = value;
                else if (attr['storage'] == 'base64')
                    this._value['base64'] = value;
                if (this._attribute['filename_prop'])
                    this._value['filename'] = data[this._attribute['filename_prop']];
                if (this._attribute['url_prop'])
                    this._value['url'] = data[this._attribute['url_prop']];
            } else
                this._value = value;
        } else
            this._value = value;

        if (this._$value)
            this._$value.empty();
        else
            this._$value = $('<div/>').addClass('value');

        var size;
        if (this._attribute.size)
            size = this._attribute.size;
        else
            size = "100";

        if (this._value) {
            var str = this._value['base64'];
            if (str) {
                if (str.length > size)
                    this._$value.append(str.substr(0, size) + "...<br/>");
                else
                    this._$value.append(str + "<br/>");
            }
        }

        if (this._attribute['storage'] == 'filesystem' || this._attribute['filename_prop']) {
            this._$delete = $('<input/>')
                .attr('type', 'checkbox')
                .prop('checked', this._value && this._value['delete'])
                .click(function () {
                    if (this._$delete.prop('checked'))
                        this._$inputFilename.val('');
                }.bind(this));
            var $label = $('<label/>');
            $label.append(this._$delete);
            $label.append('Delete');
            this._$value.append($label);
            this._$value.append("<br/>");
            this._$value.append('filename: ');
            this._$inputFilename = $('<input/>')
                .attr('type', 'text')
                .attr('size', size);
            if (this._value && this._value['filename'])
                this._$inputFilename.val(this._value['filename']);
            this._$value.append(this._$inputFilename);
            this._$value.append("<br/>");
        }

        this._$value.append('URL: ');
        this._$inputUrl = $('<input/>')
            .attr('type', 'text')
            .attr('size', size)
            .on('input', function () {
                var val = this._$inputUrl.val();
                if (val.startsWith('http')) {
                    try {
                        var pathname = new URL(val).pathname;
                        var index = pathname.lastIndexOf('/');
                        if (index !== -1)
                            this._$inputFilename.val(pathname.substring(index + 1));
                    } catch (error) {
                        ;
                    }
                }
            }.bind(this));
        if (this._value && this._value['url'])
            this._$inputUrl.val(this._value['url']);
        this._$value.append(this._$inputUrl);
        this._$value.append("<br/>");

        this._$inputFile = $('<input/>').attr({ 'type': 'file', 'id': this._id, 'name': this._attribute.name, 'value': '', 'multiple': false })
            .on('change', function () {
                var file;
                var input = this._$inputFile[0];
                if (input.files && input.files.length > 0)
                    file = input.files[0];
                if (file)
                    this._$inputFilename.val(file.name);
            }.bind(this));
        this._$value.append(this._$inputFile);

        if ((this._value && this._value['base64']) || (this._$inputFile && this._$inputFile[0] && this._$inputFile[0].files && this._$inputFile[0].length > 0)) {
            this._$value.append("<br/>");

            var $remove = $('<button>')
                .text('Remove')
                .click(async function (event) {
                    event.stopPropagation();

                    await this.renderValue(null);

                    return Promise.resolve();
                }.bind(this));
            this._$value.append($remove);
        }

        return Promise.resolve(this._$value);
    }

    async readValue() {
        var data = {};

        if (this._$inputFilename)
            data['filename'] = this._$inputFilename.val();

        if (this._$inputUrl)
            data['url'] = this._$inputUrl.val();

        var file;
        if (this._$inputFile && this._$inputFile[0] && this._$inputFile[0].files && this._$inputFile[0].files.length > 0)
            file = this._$inputFile[0].files[0];

        if (this._attribute['storage'] === "blob") {
            if (file) {
                data['blob'] = [new Uint8Array(await file.arrayBuffer())];
                //const fileToBlob = async (file) => new Blob([new Uint8Array(await file.arrayBuffer())], { type: file.type });
                //data[name] = await fileToBlob(value);
            }
        } else if (this._attribute['storage'] === "base64" || this._attribute['storage'] === "filesystem") {
            if (file)
                data['base64'] = await Base64.encodeObject(file);
            else if (this._value && this._value['base64'])
                data['base64'] = this._value['base64'];
            if (this._$delete && this._$delete.prop('checked'))
                data['delete'] = true;
        }
        return Promise.resolve(data);
    }
}