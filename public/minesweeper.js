let div = document.getElementById("minesweeper");

function makeCellButton (x, y, handleClick, handleRightClick) {
    let button = document.createElement("button");
    button.setAttribute("class", "cell");
    button.setAttribute("id", `cell-${x}-${y}`);
    button.addEventListener("click", (e) => handleClick(e, x, y));
    button.addEventListener("contextmenu", (e) => handleRightClick(e, x, y));

    return button;
}

function makeRow (y, width, handleClick, handleRightClick) {
    let row = document.createElement("div");
    row.setAttribute("class", "row");

    for (let i = 0; i < width; i++) {
        row.appendChild(makeCellButton(i, y, handleClick, handleRightClick));
    }

    return row;
}

function makeGrid (height, width, handleClick, handleRightClick) {
    let grid = document.createElement("div");
    grid.setAttribute("class", "grid");

    for (let i = 0; i < height; i++) {
        grid.appendChild(makeRow(i, width, handleClick, handleRightClick));
    }

    return grid;
}

class Minesweeper {
    constructor (height, width, mines, div) {
        this.height = height;
        this.width = width;
        this.mines = mines;

        this.validateArgs();

        this.board = new Board(this.height, this.width);
        this.board.initMines(mines);
        this.board.initContent();

        this.div = div;

        this.isGameOver = false;
    }

    initDiv () {
        this.div.innerHTML = "";

        let gameHeader = document.createElement("div");
        gameHeader.setAttribute("class", "game-header");

        let minesCount = document.createElement("div");
        minesCount.setAttribute("class", "mines-count");
        minesCount.setAttribute("id", "mines-count");
        minesCount.innerHTML = "💣 " + this.mines;

        let flagCount = document.createElement("div");
        flagCount.setAttribute("class", "flag-count");
        flagCount.setAttribute("id", "flag-count");
        flagCount.innerHTML = "🚩 " + this.mines + " / " + this.mines;

        gameHeader.appendChild(minesCount);
        gameHeader.appendChild(flagCount);

        let gameBody = document.createElement("div");
        gameBody.appendChild(makeGrid(
            this.height,
            this.width,
            this.handleClick.bind(this),
            this.handleRightClick.bind(this)
        ));

        let resetBtn = document.createElement("button");
        resetBtn.innerHTML = "Reset";
        resetBtn.addEventListener("click", this.initDiv.bind(this));

        let gameFooter = document.createElement("div");
        gameFooter.setAttribute("class", "game-footer");
        gameFooter.appendChild(resetBtn);

        this.div.appendChild(gameHeader);
        this.div.appendChild(gameBody);
        this.div.appendChild(gameFooter);
    }

    updateFlagCount () {
        let flagCount = this.getFlagCount();

        let flagCountDiv = document.getElementById("flag-count");
        flagCountDiv.innerHTML = "🚩 " + flagCount + " / " + this.mines;
    }

    getFlagCount () {
        let count = 0;
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                let cell = this.board.get(i, j);
                if (cell.isFlag) {
                    count++;
                }
            }
        }

        return count;
    }

    updateMinesCount () {
        let minesCountDiv = document.getElementById("mines-count");
        minesCountDiv.innerHTML = "💣 " + this.mines;
    }

    handleClick(e, x, y) {
        if (this.isGameOver) {
            return;
        }

        let cell = this.board.get(x, y);

        let result = this.board.open(x, y);
        this.refreshDiv();

        if (result.finished) {
            this.isGameOver = true;
            if (result.success) {
                setTimeout(() => alert("You win!"), 500);
            } else {
                setTimeout(() => alert("Game over!"), 500);
            }
            // disable all cells
            let cells = document.getElementsByClassName("cell");
            for (let i = 0; i < cells.length; i++) {
                cells[i].disabled = true;
            }
        }

        return;
    }

    handleRightClick(e, x, y) {
        e.preventDefault();

        if (this.isGameOver) {
            return;
        }

        let cell = this.board.get(x, y);

        if (!cell.isOpen) {
            cell.setFlag(!cell.isFlag);
        }

        this.refreshDiv();

        return;
    }

    refreshDiv () {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                let cell = this.board.get(i, j);
                let button = document.getElementById(`cell-${i}-${j}`);

                if (cell.isFlag) {
                    button.innerHTML = "🚩";
                } else if (cell.isOpen) {
                    button.innerHTML = cell.content;
                } else {
                    button.innerHTML = "";
                }
            }
        }

        this.updateMinesCount();
        this.updateFlagCount();
    }

    enclosePre (str) {
        return "<pre>" + str + "</pre>";
    }

    validateArgs () {
        if (this.mines > this.width * this.height) {
            throw new Error("mines is greater than the number of tiles");
        }
    }
}


class Board {
    constructor (height, width) {
        this.height = height;
        this.width = width;
        this.board = [];

        for (let i = 0; i < this.height; i++) {
            let row = [];
            this.board.push(row);
            for (let j = 0; j < this.width; j++) {
                row.push(new Cell(false, false, false));
            }
        }
    }

    get(x, y) {
        return this.board[y][x];
    }

    initMines (mines){
        // set initial mines
        let positions = getUniqueRandomPairs(this.width, this.height, mines);

        for (const [i, j] of positions) {
            this.get(i, j).setMine(true);
        }
    }

    initContent () {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                let cell = this.get(i, j);
                let content = null;
                if (cell.isMine) {
                    content = "💣";
                } else {
                    // content = getNumberEmoji(this.getNeighbouringMines(i, j));

                    content = "" + this.getNeighbouringMines(i, j);
                }

                cell.setContent(content);
            }
        }
    }

    getNeighbouringMines (x, y) {
        let neighbours = this.getNeighbours(x, y);

        return neighbours
            .map(([i, j]) => this.get(i, j).isMine ? 1 : 0)
            .reduce((acc, val) => acc + val, 0);
    }

    getNeighbours(x, y) {
        return [
            [x-1,y+1], [ x ,y+1], [x+1,y+1],
            [x-1, y ], [ x , y ], [x+1, y ],
            [x-1,y-1], [ x, y-1], [x+1,y-1],
        ].filter(([i, j]) => this.isWithinBounds(i, j));
    }

    isMine (x, y) {
        return this.get(x, y).isMine;
    }

    isWithinBounds(x, y) {
        return 0 <= x && x < this.width && 0 <= y && y < this.height;
    }

    open (x, y) {
        if (!this.isWithinBounds(x, y)) {
            throw new Error(`position out of bounds [${x}, ${y}]`);
        }

        if (this.get(x, y).isOpen) {
            throw new Error("[x, y] is already open!")
        }
        if (this.get(x, y).isFlag) {
            throw new Error("[x, y] is flagged!")
        }

        let cell = this.get(x, y);
        cell.setOpen(true);

        if (cell.isMine) {
            /* opened a mine */
            return {finished: true, success: false}
        }
        else if (this.isGameWon()) {
            return {finished: true, success: true}
        }
        else if (cell.content === "0") {
            /* opened a zero */
            let lastResult = {finished: false, success: false};

            let neighbours = this.getNeighbours(x, y);
            for (const [i, j] of neighbours) {
                if (!this.get(i, j).isOpen) {
                    lastResult = this.open(i, j);
                }
            }

            return lastResult;
        }
        else {
            return {finished: false, success: false}
        }
    }

    isGameWon () {
        return this.getRemainingSafeCells() === 0;
    }

    getRemainingSafeCells() {
        let countSafe = 0;
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                countSafe += !this.get(i, j).isOpen && !this.get(i, j).isMine ? 1 : 0;
            }
        }
        return countSafe;
    } 

    toString () {
        let result = "";
        result += "+-".repeat(this.width);
        result += "+\n";
        for (let i = 0; i < this.width; i++) {
            result += "|";
            for (let j = 0; j < this.height; j++) {
                let cell = this.get(i, j);
                result += cell.isOpen ? cell.content : '.';
                result += "|";
            }
            result += "\n";
            result += "+-".repeat(this.width);
            result += "+\n";
        }

        return result;
    }
}

class Cell {
    constructor (isMine, isOpen, isFlag, content='') {
        this.isMine = isMine;
        this.isOpen = isOpen;
        this.isFlag = isFlag;

        this.setContent(content);

        this.validate();
    }

    validate () {
        if (this.isOpen && this.isFlag) {
            throw new Error("flag is open!");
        }
    } 

    setFlag(value) {
        let old = this.isFlag;
        this.isFlag = value;

        try {
            this.validate();
        } catch (e) {
            this.isFlag = old;
            throw e;
        }
    }

    setMine(value) {
        console.log("setmine");
        let old = this.isMine;
        this.isMine = value;

        try {
            this.validate();
        } catch (e) {
            this.isMine = old;
            throw e;
        }
    }

    setOpen(value) {
        let old = this.isOpen;
        this.isOpen = value;

        try {
            this.validate();
        } catch (e) {
            this.isOpen = old;
            throw e;
        }
    }

    setContent(value) {
        this.content = value;
    }
}

function getUniqueRandomPairs(xmax, ymax, n) {
    let xmin = 0;
    let ymin = 0;

    let xdelta = xmax - xmin;
    let ydelta = ymax - ymin;

    let maxdelta = xdelta * ydelta - 1;
    let rawNumbers = getUniqueRandomNumbers(0, maxdelta, n);

    let result = [];
    for (const num of rawNumbers) {
        let x = Math.floor(num / ydelta);
        let y = num % ydelta;
        result.push([x, y]);
    }

    return result;
}

function getUniqueRandomNumbers(min, max, n) {
    let result = [];    

    while (result.length < n) {
        let candidate = getRandomInt(min, max);
        if (!result.includes(candidate)) {
            result.push(candidate);
        }
    }

    return result;
}

function getRandomInt(min, max) {
    // include of min-max

    return Math.floor(Math.random() * (max - min + 1) + min);
}

function getNumberEmoji(num) {
    switch (num) {
        case 0:
            return "0️⃣";
        case 1:
            return "1️⃣";
        case 2:
            return "2️⃣";
        case 3:
            return "3️⃣";
        case 4:
            return "4️⃣";
        case 5:
            return "5️⃣";
        case 6:
            return "6️⃣";
        case 7:
            return "7️⃣";
        case 8:
            return "8️⃣";
        default:
            throw new Error(`invalid number: ${num}`);
    }
}

// div.innerHTML = getUniqueRandomPairs(10, 10, 10).sort().map(
//     ([x, y]) => "[" + x + ", " + y + "]"
// );

let board = new Board(10, 10);
board.initMines(10);

board.initContent();

// div.innerHTML = getUniqueRandomPairs(board.height, board.width, 10)
//     .map(([x,y]) => board.getNeighbouringMines(x, y))
//     .sort();

function setDiv() {
    div.innerHTML = "<pre>" + board.toString() + "</pre>";
}

// setDiv();

function init () {
    let ms = new Minesweeper (10, 10, 10, div);
    ms.initDiv();
}

init ();
// 
// let resetBtn = document.getElementById("reset");
// resetBtn.addEventListener("click", () => init() );
