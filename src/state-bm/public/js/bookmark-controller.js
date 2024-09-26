class BookmarkController {

    static CONFIG_BOKKMARK_IDENT = 'bookmarks';

    _apiClient;
    _bookmarks;

    constructor() {
        this._apiClient = app.getController().getApiController().getApiClient();
    }

    async init() {
        const entry = await this._apiClient.requestData("GET", "_registry?key=bookmarks");
        if (entry && entry.length === 1) {
            const value = entry[0]['value'];
            if (value)
                this._bookmarks = JSON.parse(value);
        }
        return Promise.resolve();
    }

    getBookmarks() {
        return this._bookmarks;
    }

    async setBookmarks(bookmarks) {
        this._bookmarks = bookmarks;
        return this._apiClient.requestData("PUT", "_registry", null, { 'key': 'bookmarks', 'value': JSON.stringify(this._bookmarks) });
    }

    async addBookmark(state) {
        this._bookmarks.push(state);
        return this.setBookmarks(this._bookmarks);
    }
}