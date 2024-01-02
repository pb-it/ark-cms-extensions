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
            "width": "320",
            "format": "16/9",
            "height": 180,
            "details": "title",
            "panelType": "WikiPanel"
        }
    }
}

module.exports = definition;