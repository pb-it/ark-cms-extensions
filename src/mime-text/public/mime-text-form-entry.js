class MimeTextFormEntry extends FormEntry {

    static OPTIONS = [
        { 'value': '<auto>', 'disabled': true },
        { 'value': 'csv' },
        { 'value': 'xml' },
        { 'value': 'json', 'disabled': true },
        { 'value': 'plain' },
        { 'value': 'html' },
        { 'value': 'plain+html' },
        { 'value': 'markdown' },
        { 'value': 'javascript' },
        { 'value': 'bat' },
        { 'value': 'x-bat' },
        { 'value': 'x-sh' },
        { 'value': 'x-shellscript' },
        { 'value': '*custom*', 'disabled': true }
    ];

    _$input;
    _$syntax;
    _$formatButton;

    constructor(form, attribute) {
        super(form, attribute);
    }

    getInput() {
        return this._$input;
    }

    async renderValue(value) {
        if (this._$value)
            this._$value.empty();
        else
            this._$value = $('<div/>').addClass('value');

        var name = this._attribute.name;

        if (value == null || value == undefined) {
            if (this._attribute.hasOwnProperty('defaultValue'))
                value = this._attribute['defaultValue'];
            else
                value = '';
        }

        var syntax;
        if (this._attribute['bSyntaxPrefix']) {
            if (value.startsWith('data:')) {
                var index = value.indexOf(','); //data:text/plain;charset=utf-8,
                if (index > -1) {
                    syntax = DataView.getSyntax(value.substr(0, index));
                    value = value.substr(index + 1);
                }
            }
            if (!syntax)
                syntax = 'plain';

            this._$syntax = $('<select/>');
            var $option;
            for (var o of MimeTextFormEntry.OPTIONS) {
                $option = $('<option/>').attr('value', o['value']).text(o['value']);
                if (o.hasOwnProperty('disabled'))
                    $option.prop('disabled', o['disabled']);
                if (syntax === o['value'])
                    $option.prop('selected', true);
                this._$syntax.append($option);
            };
            this._$syntax.on('change', function () {
                if (this._$formatButton)
                    this._$formatButton.prop('disabled', !app.getController().getFormatter().isSupported(this._$syntax.val()))
            }.bind(this));
            this._$value.append(this._$syntax);
        } else
            syntax = this._attribute['view'];
        if (this._attribute['bSyntaxPrefix'] || (syntax && syntax !== 'plain')) {
            this._$formatButton = $('<button>')
                .text('format')
                .prop('disabled', !app.getController().getFormatter().isSupported(syntax))
                .click(async function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    try {
                        var syntax;
                        if (this._$syntax)
                            syntax = this._$syntax.val();
                        else
                            syntax = this._attribute['view'];
                        if (syntax) {
                            var val = this._$input.val();
                            const formatter = controller.getFormatter();
                            val = await formatter.formatText(val, syntax);
                            this._$input.val(val);
                        }
                    } catch (error) {
                        controller.showError(error);
                    }

                    return Promise.resolve();
                }.bind(this));
            this._$value.append(this._$formatButton);

            var $previewButton = $('<button>')
                .text('preview')
                .click(async function (event) {
                    event.stopPropagation();

                    var skeleton = [this._attribute];

                    var data = {};
                    data[name] = await this.readValue();

                    var panel = new Panel();
                    panel.setContent(await DataView.renderData(skeleton, data));
                    return app.getController().getModalController().openPanelInModal(panel);
                }.bind(this));
            this._$value.append($previewButton);

            /*if (this._$syntax.val() === 'markdown') {
                var $exportButton = $('<button>')
                    .text('Export PDF')
                    .click(async function (event) {
                        event.stopPropagation();

                        if (typeof markdownpdf === 'undefined') {
                            var buildUrl = "https://cdn.jsdelivr.net/npm/markdown-pdf";
                            await loadScript(buildUrl);
                        }

                        markdownpdf().from.string(this.readValue()).to("document.pdf", function () {
                            console.log("Done");
                        });
                    }.bind(this));
                this._$value.append($exportButton);
            }*/

            this._$value.append('<br/>');
        }

        var rows;
        var cols;
        if (this._attribute['size']) {
            var parts = this._attribute.size.split(',');
            if (parts.length > 0) {
                rows = parts[0];
            }
            if (parts.length > 1) {
                cols = parts[1];
            }
        }
        if (!rows) {
            var used;
            if (value)
                used = value.split('\n').length;
            if (used >= 5)
                rows = used;
            else
                rows = 5;
        }
        if (!cols)
            cols = 80;

        this._$input = $('<textarea/>')
            .attr('name', name)
            .attr('id', this._id)
            .attr('type', 'text')
            .attr('rows', rows)
            .attr('cols', cols)
            .val(value);
        this._$input.keydown(function (e) {
            if (e.keyCode == 9) { // TAB
                e.preventDefault();
                //TODO: ident selection
                var input = this._$input[0];
                if (input.selectionStart != undefined && input.selectionStart >= '0') {
                    var cursorPosition = input.selectionStart;
                    var txt = this._$input.val();
                    this._$input.val(txt.slice(0, cursorPosition) + '\t' + txt.slice(cursorPosition));
                    cursorPosition++;
                    input.selectionStart = cursorPosition;
                    input.selectionEnd = cursorPosition;
                    input.focus();
                }
                return false;
            } else if (e.keyCode == 13) { // ENTER
                e.stopPropagation(); //https://www.rockyourcode.com/assertion-failed-input-argument-is-not-an-htmlinputelement/
                if (this._$syntax && this._$syntax.val() === 'markdown') {
                    var input = this._$input[0];
                    if (input.selectionStart != undefined && input.selectionStart >= '0') {
                        var cursorPosition = input.selectionStart;
                        var txt = this._$input.val();
                        var index = txt.lastIndexOf('\n', cursorPosition - 1);
                        var line = txt.substring(index + 1, cursorPosition);
                        console.log(line);
                        if (line.startsWith('```')) {
                            var arr = txt.split('\n');
                            var count = 0;
                            for (line of arr) {
                                if (line.startsWith('```'))
                                    count++;
                            }
                            if (count % 2 == 1) {
                                e.preventDefault();
                                this._$input.val(txt.slice(0, cursorPosition) + '\n\n```' + txt.slice(cursorPosition));
                                cursorPosition++;
                                input.selectionStart = cursorPosition;
                                input.selectionEnd = cursorPosition;
                                input.focus();
                            }
                        }
                    }
                }
            }
        }.bind(this));


        if (this._$input) {
            if (!this.isEditable())
                this._$input.attr('disabled', true);

            if (this._attribute['changeAction'])
                this._$input.change(this._attribute['changeAction']);

            this._$value.append(this._$input);
        }
        return Promise.resolve(this._$value);
    }

    async readValue(bValidate = true) {
        var data;
        if (this._$input) {
            var value = this._$input.val();
            if (value) {
                if (this._$syntax && value) {
                    var syntax = this._$syntax.val();
                    if (syntax === '*custom*')
                        syntax = '*'; //TODO:
                    data = 'data:text/' + syntax + ';charset=utf-8,' + value;
                } else
                    data = value;
            }
        }

        if (bValidate && this._attribute['required'] && this.isEditable()) {
            if (!data) {
                this._$input.focus();
                throw new Error("Field '" + this._attribute['name'] + "' is required");
            }
        }
        return Promise.resolve(data);
    }
}