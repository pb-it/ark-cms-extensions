const definition = {
    "name": "youtube",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "attributes": [
        {
            "name": "youtube_id",
            "length": 11,
            "unique": true,
            "dataType": "string"
        },
        {
            "name": "title",
            "dataType": "string"
        },
        {
            "cdn": "/cdn",
            "name": "thumbnail",
            "dataType": "file",
            "storage": "filesystem"
        },
        {
            "cdn": "/cdn",
            "name": "file",
            "dataType": "file",
            "storage": "filesystem"
        }
    ],
    "defaults": {
        "title": "title",
        "thumbnail": "thumbnail",
        "sort": "title:asc",
        "view": {
            "panelType": "MediaPanel",
            "details": "title",
            "float": "left",
            "format": "16/9",
            "width": 320
        }
    }
}

module.exports = definition;