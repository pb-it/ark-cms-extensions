const definition = {
    "name": "browser-bookmarks",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "attributes": [
        {
            "name": "profile",
            "dataType": "string",
            "required": true
        },
        {
            "name": "dump",
            "dataType": "json",
            "size": "15"
        },
        {
            "name": "title",
            "dataType": "string",
            "persistent": false,
            "hidden": true
        }
    ],
    "tableName": "browser_bookmarks",
    "defaults": {
        "title": "title"
    },
    "extensions": {}
}

definition['extensions']['client'] = `function init() {
    this._prepareDataAction = function (data) {
        data['title'] = data['profile'] + ' - ' + new Date(data['created_at']).toISOString().split('T')[0];
        return data;
    }
}
export { init };`;

module.exports = definition;