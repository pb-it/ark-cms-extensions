const definition = {
    "name": "playlist",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "attributes": [
        {
            "name": "title",
            "dataType": "string"
        },
        {
            "name": "list",
            "dataType": "string",
            "length": "2000"
        },
        {
            "name": "subtype",
            "dataType": "string",
            "persistent": false,
            "hidden": true
        }
    ],
    "defaults": {
        "collectionModel": "youtube",
        "collection": "list",
        "view": {
            "panelType": "CollectionPanel",
            "details": "title"
        }
    },
    "_sys": {
        "modules": {
            "client": `function init() {
    this._prepareDataAction = function (data) {
        data['subtype'] = 'playlist';
        return data;
    }
}

export { init };`
        }
    }
}

module.exports = definition;