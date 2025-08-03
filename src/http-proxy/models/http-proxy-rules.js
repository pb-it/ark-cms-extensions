const definition = {
    "name": "http-proxy-rules",
    "tableName": "http_proxy_rules",
    "options": {
        "increments": true,
        "timestamps": true
    },
    "attributes": [
        {
            "name": "url",
            "length": "2000",
            "dataType": "string"
        },
        {
            "name": "options",
            "dataType": "json"
        },
        {
            "name": "fn",
            "dataType": "text"
        }
    ],
    "defaults": {
        "title": "url"
    }
}

module.exports = definition;