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
            "float": "none",
            "width": 320,
            "format": "16/9",
            "height": 180,
            "details": "title",
            "panelType": "NotePanel"
        }
    }
}

module.exports = definition;