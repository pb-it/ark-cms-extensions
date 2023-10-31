const definition = {
    "name": "scraper",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "defaults": {
        "title": "domain",
        "sort": "domain:asc",
        "view": {
            "details": "title",
            "panelType": "CrudPanel"
        }
    },
    "attributes": [
        {
            "name": "domain",
            "length": "250",
            "unique": true,
            "dataType": "string"
        },
        {
            "name": "function",
            "view": "javascript",
            "dataType": "mime-text"
        },
        {
            "name": "comment",
            "dataType": "text"
        }
    ]
}

module.exports = definition;