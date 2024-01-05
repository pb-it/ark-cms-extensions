const definition = {
    "name": "note",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "attributes": [
        {
            "name": "note",
            "size": "15",
            "dataType": "text"
        }
    ],
    "defaults": {
        "view": {
            "panelType": "NotePanel",
            "details": "title"
        }
    }
}

module.exports = definition;