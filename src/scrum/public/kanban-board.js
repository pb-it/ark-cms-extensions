class KanbanBoard extends Panel {

    _items;

    _backlogColumn;
    _todoColumn;
    _inProgressColumn;
    _reviewColumn;
    _doneColumn;

    constructor(items) {
        super();

        if (items)
            this._items = items;
        else
            this._items = [];
    }

    /*async _init() {
        await super._init();
        return Promise.resolve();
    }*/

    async _renderContent() {
        var $div = $('<div/>')
            .css({ 'padding': '10' });

        for (var item of this._items) {
            item.dispose();
            item._$panel = $('<div/>')
                .addClass('panel')
                .hide();
        }

        $div.append('<h2>Kanban-Board</h2>');

        var $table = $('<table>').addClass('kanban-board');
        var $row = $('<tr>');
        $row.append($('<th>').text('Backlog'));
        $row.append($('<th>').text('Open / To Do'));
        $row.append($('<th>').text('Work in Progress'));
        $row.append($('<th>').text('Test / Review'));
        $row.append($('<th>').text('Done'));
        $table.append($row);
        $row = $('<tr>');
        if (!this._backlogColumn)
            this._backlogColumn = new KanbanBoardColumn(this);
        this._backlogColumn.setItems(this._items.filter(function (x) { return !x._obj.getData()['state'] }));
        $row.append($('<td>').append(await this._backlogColumn.render('#ffb480')));
        if (!this._todoColumn)
            this._todoColumn = new KanbanBoardColumn(this, 'open');
        this._todoColumn.setItems(this._items.filter(function (x) { return x._obj.getData()['state'] == 'open' }));
        $row.append($('<td>').append(await this._todoColumn.render('#f8f38d')));
        if (!this._inProgressColumn)
            this._inProgressColumn = new KanbanBoardColumn(this, 'in progress');
        this._inProgressColumn.setItems(this._items.filter(function (x) { return x._obj.getData()['state'] == 'in progress' }));
        $row.append($('<td>').append(await this._inProgressColumn.render('#42d6a4')));
        if (!this._reviewColumn)
            this._reviewColumn = new KanbanBoardColumn(this, 'in review');
        this._reviewColumn.setItems(this._items.filter(function (x) { return x._obj.getData()['state'] == 'in review' }));
        $row.append($('<td>').append(await this._reviewColumn.render('#59adf6 ')));
        if (!this._doneColumn)
            this._doneColumn = new KanbanBoardColumn(this, 'closed');
        this._doneColumn.setItems(this._items.filter(function (x) { return x._obj.getData()['state'] == 'closed' }));
        $row.append($('<td>').append(await this._doneColumn.render('#c780e8')));
        $table.append($row);
        $div.append($table);

        var $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    async apply(typeString, id, state) {
        const items = this._items.filter(function (x) { return x._obj.getTypeString() === typeString && x._obj.getData()['id'] == id });
        if (items.length == 1) {
            const obj = items[0]._obj;
            /*const data = obj.getData();
            data['state'] = state;
            obj.setData(data);*/
            await obj.update({ 'state': state });
        }
        return this.render();
    }
}