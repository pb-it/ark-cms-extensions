class KanbanBoardItem extends CrudPanel {

    constructor(config, obj) {
        super(config, obj);

        this._$panel.addClass('kanban-board-item');
    }

    async _renderContent() {
        var $div = $('<div/>')
            .css({
                'padding': '5px',
                'margin': '5px',
                'background-color': 'white',
                'overflow': 'auto'
            });

        /*$div.attr({
            "draggable": "true"
        });
        $div.on("dragstart.kanban-board-item", this._drag.bind(this));
        $div.on("dragend.kanban-board-item", function () {
            ;//alert("drag ended");
        });*/

        $div.append(this._obj.getData()['title']);

        return Promise.resolve($div);
    }

    /*async _drag(event) {
        event.stopPropagation();
        event.originalEvent.dataTransfer.setData("text/plain", DataService.getUrlForObjects([this._obj]));
        event.originalEvent.dataTransfer.dropEffect = 'copy'; // 'move'
        return Promise.resolve();
    }*/
}