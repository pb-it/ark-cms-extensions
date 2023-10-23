const definition = {
    "name": "projects",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "attributes": [
        {
            "name": "name",
            "dataType": "string"
        },
        {
            "via": "project",
            "name": "user-stories",
            "model": "user-stories",
            "dataType": "relation",
            "multiple": true
        },
        {
            "name": "description",
            "size": "20",
            "dataType": "text"
        }
    ],
    "defaults": {
        "title": "name",
        "sort": "name:asc"
    },
    "extensions": {
    }
}

definition['extensions']['client'] = `function init() {
    this._doubleClickAction = function (panel) {
        var id = panel.getObject().getData()['id'];
        
        var state = new State();
        state.typeString = 'user-stories';
        state.where = 'project=' + id;
        app.getController().loadState(state, true);
    }
}

export { init };`;

module.exports = definition;