class BulletinBoardWrapper {

    _$board;
    _panel;

    _minBoundX;
    _minBoundY;
    _maxBoundX;
    _maxBoundY;

    _posX;
    _posY;

    _$div;

    constructor(board, panel, posX, posY) {
        this._$board = board;
        this._panel = panel;
        if (posX)
            this._posX = posX;
        else
            this._posX = 0;
        if (posY)
            this._posY = posY;
        else
            this._posY = 0;
    }

    getPanel() {
        return this._panel;
    }

    getPosX() {
        return this._$div[0].style.left;
    }

    getPosY() {
        return this._$div[0].style.top;
    }

    async render() {
        this._$div = $('<div/>')
            .css({
                'position': 'absolute',
                'background-color': 'white',
                'left': this._posX,
                'top': this._posY
            });

        this._$div.append(await this._panel.render());
        this._$div[0].onmousedown = this._dragMouseDown.bind(this);

        return Promise.resolve(this._$div);
    }

    _dragMouseDown(event) {
        event = event || window.event;
        event.preventDefault();

        var target;
        if (event.target != null)
            target = event.target;
        else
            target = event.srcElement;
        //const parent = target.parentNode;
        const parent = this._$board[0];

        this._minBoundX = parent.offsetLeft;
        this._minBoundY = parent.offsetTop;

        this._maxBoundX = this._minBoundX + parent.clientWidth - target.clientWidth;
        this._maxBoundY = this._minBoundY + parent.offsetHeight - target.offsetHeight;

        this._posX = event.clientX;
        this._posY = event.clientY;

        document.onmouseup = this._closeDragElement.bind(this);
        document.onmousemove = this._elementDrag.bind(this);
    }

    _elementDrag(event) {
        event = event || window.event;
        event.preventDefault();

        const element = this._$div[0];
        element.style.left = Math.max(this._minBoundX, Math.min(element.offsetLeft - (this._posX - event.clientX), this._maxBoundX)) + "px";
        element.style.top = Math.max(this._minBoundY, Math.min(element.offsetTop - (this._posY - event.clientY), this._maxBoundY)) + "px";

        this._posX = event.clientX;
        this._posY = event.clientY;
    }

    _closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}