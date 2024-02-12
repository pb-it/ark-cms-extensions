const definition = {
    "name": "browser-bookmarks",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "attributes": [
        {
            "name": "profile",
            "dataType": "string"
        },
        {
            "name": "dump",
            "dataType": "json",
            "size": "15"
        }
    ],
    "tableName": "browser_bookmarks"
}

module.exports = definition;