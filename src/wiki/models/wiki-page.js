const definition = {
    "name": "wiki-page",
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
            "name": "content",
            "size": "15",
            "dataType": "text"
        }
    ],
    "tableName": "wiki_page",
    "defaults": {
        "view": {
            "panelType": "WikiPanel",
            "details": "title"
        }
    }
}

module.exports = definition;