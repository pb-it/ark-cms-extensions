class TableFormEntry extends FormEntry {

    static _editCell() {
        function close() {
            const newText = this.find('input').val();
            this.text(newText);
            this.removeClass("cellEditing");
        }

        const originalText = this.text();
        this.addClass("cellEditing");
        this.html("<input type='text' value='" + originalText + "' />");
        this.children().first().focus();
        this.children().first().keypress(function (e) {
            if (e.which == 13)
                close.call(this);
        }.bind(this));
        this.children().first().blur(function () {
            close.call(this);
        }.bind(this));
        this.find('input').dblclick(function (e) {
            e.stopPropagation();
        });
    }

    static _createTable(nColumns, nRows, data, bEditable) {
        const $table = $('<table/>')
            .addClass('value');
        const $head = $('<thead/>');
        var $row = $('<tr/>');
        var $cell;
        for (var j = 0; j < nColumns; j++) {
            $cell = $('<th/>');
            if (data && data['thead'])
                $cell.text(data['thead'][j]);
            if (bEditable)
                $cell.dblclick(TableFormEntry._editCell.bind($cell));
            $row.append($cell);
        }
        $head.append($row);
        $table.append($head);
        const $body = $('<tbody/>');
        for (var i = 0; i < nRows; i++) {
            $row = $('<tr/>');
            for (var j = 0; j < nColumns; j++) {
                $cell = $('<td/>');
                if (data && data['tbody'])
                    $cell.text(data['tbody'][i][j]);
                if (bEditable)
                    $cell.dblclick(TableFormEntry._editCell.bind($cell));
                $row.append($cell);
            }
            $body.append($row);
        }
        $table.append($body);
        return $table;
    }

    _$table;

    constructor(form, attribute) {
        super(form, attribute);
    }

    async renderValue(value) {
        this._value = value;

        if (this._$value)
            this._$value.empty();
        else
            this._$value = $('<div/>').addClass('value');

        const format = this._attribute['format'];
        if (!format || format === 'html') {
            if (this._value && (typeof (this._value) === 'string' || (this._value) instanceof String))
                this._$table = $($.parseHTML(this._value));
        } else if (format === 'json') {
            if (this._value && (typeof (this._value) === 'object')) {
                if (this._value['tbody']) {
                    var nColumns;
                    var nRows = this._value['tbody'].length;
                    if (nRows > 0)
                        nColumns = this._value['tbody'][0].length;
                    if (nColumns > 0)
                        this._$table = TableFormEntry._createTable(nColumns, nRows, this._value, true);
                }
            }
        }

        if (this._$table) {
            const cells = this._$table.find('thead > tr > th, tbody > tr > td');
            var $cell;
            for (var cell of cells) {
                $cell = $(cell);
                $cell.dblclick(TableFormEntry._editCell.bind($cell));
            }
            this._$value.append(this._$table);
            const $addRowButton = $('<button>')
                .text('Add Row')
                .click(function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    try {
                        controller.setLoadingState(true, false);
                        const nColumns = this._$table.find('thead > tr > th').length;
                        const $body = this._$table.find('tbody');
                        var $cell;
                        const $row = $('<tr/>');
                        for (var j = 0; j < nColumns; j++) {
                            $cell = $('<td/>');
                            $cell.dblclick(TableFormEntry._editCell.bind($cell));
                            $row.append($cell);
                        }
                        $body.append($row);
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                }.bind(this));
            this._$value.append($addRowButton);
        } else {
            this._$value.append('Columns: ');
            const $inputColumns = $('<input/>')
                .attr('type', 'text')
                .attr('size', '10')
            this._$value.append($inputColumns);
            this._$value.append('<br/>');
            this._$value.append('Rows: ');
            const $inputRows = $('<input/>')
                .attr('type', 'text')
                .attr('size', '10')
            this._$value.append($inputRows);
            this._$value.append('<br/>');
            const $createButton = $('<button>')
                .text('Create')
                .click(async function (event) {
                    event.stopPropagation();

                    const controller = app.getController();
                    try {
                        controller.setLoadingState(true, false);
                        var nRows;
                        var nColumns;
                        var tmp = $inputRows.val();
                        if (tmp)
                            nRows = parseInt(tmp);
                        tmp = $inputColumns.val();
                        if (tmp)
                            nColumns = parseInt(tmp);
                        if (nRows > 0 && nColumns > 0) {
                            this._$table = TableFormEntry._createTable(nColumns, nRows, true);
                            await this.renderValue();
                        } else
                            throw new Error('Invalid input');
                        controller.setLoadingState(false);
                    } catch (error) {
                        controller.setLoadingState(false);
                        controller.showError(error);
                    }
                    return Promise.resolve();
                }.bind(this));
            this._$value.append($createButton);
        }

        return Promise.resolve(this._$value);
    }

    async readValue() {
        var data;
        if (this._$table) {
            const format = this._attribute['format'];
            if (!format || format === 'html')
                data = this._$table[0].outerHTML;
            else if (format === 'json') {
                const obj = { 'tbody': [], 'thead': [] };
                var cells = this._$table.find('thead > tr > th');
                for (var cell of cells) {
                    obj['thead'].push(cell.innerHTML);
                }
                const rows = this._$table.find('tbody > tr');
                var arr;
                for (var row of rows) {
                    arr = [];
                    cells = $(row).find('td');
                    for (var cell of cells) {
                        arr.push(cell.innerHTML);
                    }
                    obj['tbody'].push(arr);
                }
                data = obj; // JSON.stringify(obj);
            }
        }
        return Promise.resolve(data);
    }
}