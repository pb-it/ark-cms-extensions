class KanbanBoardColumn {

    _board;
    _state;
    _items;

    _$div;

    constructor(board, state, items) {
        this._board = board;
        this._state = state;
        if (items)
            this._items = items;
        else
            this._items = [];
    }

    async render(color) {
        if (!this._$div) {
            this._$div = $('<div/>')
                .addClass('kanban-board-column')
                .css({
                    'padding-top': '1px',
                    'min-width': '200px',
                    'max-width': '400px',
                    'min-height': '400px',
                    'overflow': 'auto'
                });
            if (color)
                this._$div.css({ 'background-color': color });
        } else
            this._$div.empty(); //this._$div.children().remove(); //also removes events

        this._$div.on("dragover.kanban-board-column", function (event) {
            event.preventDefault();
        });
        this._$div.on("dragleave.kanban-board-column", function () {
        });
        this._$div.on("drop.kanban-board-column", this._drop.bind(this));

        if (this._items.length > 0) {
            for (var item of this._items) {
                this._$div.append(await item.render());
            }
        }

        return Promise.resolve(this._$div);
    }

    setItems(items) {
        this._items = items;
    }

    async _drop(event) {
        event.preventDefault();
        event.stopPropagation();
        const dT = event.originalEvent.dataTransfer;
        if (dT) {
            const str = dT.getData("text/plain").trim();
            if (str) {
                const url = new URL(str);
                const state = State.getStateFromUrl(url);
                if (state) {
                    const droptype = state['typeString'];
                    if (droptype === 'tasks' || droptype === 'defect') {
                        var data = await app.getController().getDataService().fetchDataByState(state);
                        if (data) {
                            if (Array.isArray(data)) {
                                if (data.length == 1)
                                    return this._board.apply(droptype, data[0]['id'], this._state);
                            } else
                                return this._board.apply(droptype, data['id'], this._state);
                        }
                    }
                }
            }
        }
        return Promise.resolve();
    }
}