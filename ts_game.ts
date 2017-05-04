/**
 * @author Luis Pablo
 * @copyright 2017
 * @version 2.1.0
 */
namespace Tetris {
    let GAME_LOOP = null;
    let BLOCK_SIZE = 0;
    let DEBUG = false;

    enum GameStatus {stopped, started}
    enum GridCell {empty, filled}
    enum KeyCodes {
        left = 37,
        up = 38,
        right = 39,
        down = 40,
        space = 32,
        lshift = 16,
        esc = 27
    }

    let availability = document.getElementById("availability");
    let piecemap = document.getElementById("piece");

    if (!DEBUG) {
        availability.setAttribute("class", "hidden");
        piecemap.setAttribute("class", "hidden")
    }

    const Colors = {
        red: "#BE2727",
        blue: "#3163A3",
        green: "#31A348",
        orange: "#D67D41",
        purple: "#9A41D6",
        yellow: "#D6C441",
        cyan: "#3EA7AC",
        magenta: "#AF3AAA",
        black: "#000000",
        white: "#FFFFFF",
        smoke: "#EDEDED",
        grey: "#999999"
    };

    const ColorMap = {
        "TBlock": Colors.purple, "IBlock": Colors.cyan,
        "LBlock": Colors.orange, "JBlock": Colors.blue,
        "SBlock": Colors.green, "ZBlock": Colors.red,
        "OBlock": Colors.yellow
    };
    const TetrominoLayout = {
        "IBlock": [
            [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
            [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
            [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
            [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]],
        "JBlock": [
            [[0,0,0,0],[0,1,0,0],[0,1,1,1],[0,0,0,0]],
            [[0,0,0,0],[0,0,1,1],[0,0,1,0],[0,0,1,0]],
            [[0,0,0,0],[0,0,0,0],[0,1,1,1],[0,0,0,1]],
            [[0,0,0,0],[0,0,1,0],[0,0,1,0],[0,1,1,0]]],
        "LBlock": [
            [[0,0,0,0],[0,0,0,1],[0,1,1,1],[0,0,0,0]],
            [[0,0,0,0],[0,0,1,0],[0,0,1,0],[0,0,1,1]],
            [[0,0,0,0],[0,0,0,0],[0,1,1,1],[0,1,0,0]],
            [[0,0,0,0],[0,1,1,0],[0,0,1,0],[0,0,1,0]]],
        "OBlock": [
            [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
            [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
            [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
            [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]]],
        "SBlock": [
            [[0,0,0,0],[0,0,1,1],[0,1,1,0],[0,0,0,0]],
            [[0,0,0,0],[0,0,1,0],[0,0,1,1],[0,0,0,1]],
            [[0,0,0,0],[0,0,0,0],[0,0,1,1],[0,1,1,0]],
            [[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,0,1,0]]],
        "TBlock": [
            [[0,0,0,0],[0,0,1,0],[0,1,1,1],[0,0,0,0]],
            [[0,0,0,0],[0,0,1,0],[0,0,1,1],[0,0,1,0]],
            [[0,0,0,0],[0,0,0,0],[0,1,1,1],[0,0,1,0]],
            [[0,0,0,0],[0,0,1,0],[0,1,1,0],[0,0,1,0]]],
        "ZBlock": [
            [[0,0,0,0],[0,1,1,0],[0,0,1,1],[0,0,0,0]],
            [[0,0,0,0],[0,0,0,1],[0,0,1,1],[0,0,1,0]],
            [[0,0,0,0],[0,0,0,0],[0,1,1,0],[0,0,1,1]],
            [[0,0,0,0],[0,0,1,0],[0,1,1,0],[0,1,0,0]]]
    };
    const ROWS = 20;
    const COLS = 10;

    type TetrominoType = "IBlock" | "JBlock" | "LBlock" | "OBlock" | "SBlock" | "TBlock" | "ZBlock";
    type TetrominoID = string;
    interface Position {
        x: number, y: number
    }

    interface Drawable {
        draw(ctx);
    }

    class Tetromino implements Drawable {
        private id: TetrominoID = null;
        private color: string;
        private orientation: number;
        private _type: TetrominoType;
        private position: Position;
        private blockLayout;
        private isGhost: boolean;
        private isSplit: boolean;

        constructor(_type: TetrominoType, posX: number = 0, posY: number = 0, layout: any[] = [], isSplit = false, isGhost = false) {
            this._type = _type;
            this.color = ColorMap[_type];
            this.orientation = 0;
            this.position = {
                x: posX,
                y: posY
            };
            this.blockLayout = layout;
            this.isSplit = isSplit;
            this.isGhost = isGhost;
        }
        draw(ctx) {
            let layout, shadowWidth, LINE_WIDTH = 4;
            if (this.blockLayout.length === 0) {
                layout = TetrominoLayout[this._type][this.orientation];
            } else {
                layout = this.blockLayout;
            }

            for (let i = layout.length; i--; ) {
                for (let j = layout[i].length; j--; ) {
                    if (layout[i][j] === GridCell.filled) {
                        // draw the box background
                        ctx.globalAlpha = 1;
                        ctx.beginPath();
                        ctx.fillStyle = this.isGhost ? Colors.grey : this.color;
                        ctx.fillRect(
                            ( j * BLOCK_SIZE ) + this.position.x,
                            ( i * BLOCK_SIZE ) + this.position.y, BLOCK_SIZE, BLOCK_SIZE );

                        ctx.globalAlpha = 0.4;


                        if (!this.isGhost) {
                            // draw shadows
                            ctx.strokeStyle = Colors.black;
                            ctx.lineWidth = shadowWidth = LINE_WIDTH - 1;
                            ctx.lineJoin = "miter";
                            ctx.beginPath();
                            ctx.moveTo(
                                this.position.x + ( j * BLOCK_SIZE ) + shadowWidth,
                                this.position.y + ( i * BLOCK_SIZE ));
                            ctx.lineTo(
                                this.position.x + ( j * BLOCK_SIZE ) + shadowWidth,
                                this.position.y + ( i * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ));
                            ctx.lineTo(
                                this.position.x + ( j * BLOCK_SIZE ) + BLOCK_SIZE,
                                this.position.y + ( i * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ));
                            ctx.lineTo(
                                this.position.x + ( j * BLOCK_SIZE  ) + shadowWidth,
                                this.position.y + ( i * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ));
                            ctx.stroke();
                            ctx.closePath();

                            // draw highlights
                            ctx.strokeStyle = Colors.white;
                            ctx.beginPath();
                            ctx.moveTo(
                                this.position.x + ( j * BLOCK_SIZE ),
                                this.position.y + ( i * BLOCK_SIZE ) + shadowWidth);
                            ctx.lineTo(
                                this.position.x + ( j * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ),
                                this.position.y + ( i * BLOCK_SIZE ) + shadowWidth);
                            ctx.lineTo(
                                this.position.x + ( j * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ),
                                this.position.y + ( i * BLOCK_SIZE ) + BLOCK_SIZE);
                            ctx.lineTo(
                                this.position.x + ( j * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ),
                                this.position.y + ( i * BLOCK_SIZE ) + shadowWidth);
                            ctx.stroke();
                            ctx.closePath();

                            // draw middle circle
                            ctx.fillStyle = Colors.black;
                            if (DEBUG) {
                                ctx.fillText(this.id,
                                    this.position.x + ( j * BLOCK_SIZE ) + ( BLOCK_SIZE / 5 ),
                                    this.position.y + ( i * BLOCK_SIZE ) + ( BLOCK_SIZE / 3 ));
                            } else {
                                ctx.fillStyle = Colors.black;
                                ctx.arc(
                                    this.position.x + ( j * BLOCK_SIZE ) + ( BLOCK_SIZE / 2 ),
                                    this.position.y + ( i * BLOCK_SIZE ) + ( BLOCK_SIZE / 2 ),
                                    shadowWidth, 0, 2 * Math.PI);
                                ctx.fill();
                            }
                        }

                        // draw outline
                        ctx.lineWidth = this.isGhost ? LINE_WIDTH - 2 : LINE_WIDTH;
                        ctx.strokeStyle = Colors.smoke;
                        ctx.lineJoin = "bevel";
                        ctx.globalAlpha = 1;
                        ctx.strokeRect(
                            this.position.x + ( j * BLOCK_SIZE ),
                            this.position.y + ( i * BLOCK_SIZE ),
                            BLOCK_SIZE, BLOCK_SIZE);
                    }
                }
            }
        }
        getId() { return this.id; }
        setId(i) { this.id = i; }
        getType() { return this._type; }
        getColor() { return this.color; }
        getOrientation() { return this.orientation; }
        setOrientation(o) { this.orientation = o % 4; }
        getPosition(): Position { return this.position; }

        setPosition(p) {
            this.position = p;
        }
        getGridPosition(): Position { return {x: this.position.x / BLOCK_SIZE, y: this.position.y / BLOCK_SIZE }}
        getLayout() { return this.blockLayout; }
        setLayout(l) { this.blockLayout = l; }

        moveX(delta: number) {
            this.position.x += delta;
        }

        moveY(delta: number) {
            this.position.y += delta;
        }

        rotate() {
            this.setOrientation(this.getOrientation() + 1)
        }

        /**
         * Checks if the tetromino still has any blocks remaining in the game grid.
         * @returns {boolean}
         */
        checkIsIntact() {
            if (this.blockLayout.length === 0) {
                return false;
            } else {
                let numFilled = 0;

                for (let i = 0, len = this.blockLayout.length; i < len; i++) {
                    for (let j = 0, len2 = this.blockLayout[i].length; j < len2; j++) {
                        numFilled += this.blockLayout[i][j];
                    }
                }

                return numFilled > 0;
            }
        }

        /**
         * Checks if any rows of the tetromino block layout is separated by any empty row.
         * @returns {boolean}
         */
        checkCanSplit(): boolean {
            DEBUG && console.debug("Checking if " + this.id + " is separable");
            if (this.blockLayout.length === 0) {
                return false;
            } else {
                let indices: number[] = [],
                    i: number,
                    len = this.blockLayout.length;

                // select all row indices that are non-empty
                for (i = 0; i < len; i++) {
                    let sum: number = this.blockLayout[i].reduceRight(function(a, b){ return a + b; });
                    if (sum > 0) {
                        indices.push(i);
                    }
                }

                // if there aren't 2 or more rows, no point splitting them
                if (indices.length <= 1) {
                    return false;
                } else {
                    // check if any of the row indexes are separated by 1 or more empty rows
                    let last = indices[0];
                    for (let rowIndex of indices) {
                        if ((rowIndex - last) > 1) {
                            return true;
                        }
                        last = rowIndex;
                    }
                }
                return false;
            }
        }

        split(separationIndex: number) {
            let newLayout = [[], [], [], []],
                pristine = [0, 0, 0, 0];

            for (let i = 0, len = this.blockLayout.length; i < len; i++) {
                if (i < separationIndex) {
                    newLayout[i] = this.blockLayout[i].slice();
                    this.blockLayout[i] = pristine.slice();
                } else {
                    newLayout[i] = pristine.slice();
                }
            }

            let newTetromino = new Tetromino(this._type, this.position.x, this.position.y, newLayout, true);
            newTetromino.setId(this.id + 's' + 1);

            DEBUG && console.debug("Splitting " + this.id + " into new piece " + newTetromino.getId());
            return newTetromino
        }

        clone() {
            let newTetromino = new Tetromino(this._type, this.position.x, this.position.y, this.blockLayout, false, true);
            newTetromino.setId(this.id + 'g' + 1);

            return newTetromino;
        }

    }

    class TetrominoFactory {
        private currId = -1;
        private tetrominoQueue: TetrominoType[] = [];
        private tetrominoTypes: TetrominoType[] = ["IBlock", "JBlock", "LBlock",
            "OBlock", "SBlock", "TBlock", "ZBlock"];

        private static getRandom(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        private generateID(tetrominoType: TetrominoType): TetrominoID {
            return tetrominoType[0] + ++this.currId;
        }
        private fillTetrominoQueue() {
            DEBUG && console.debug("Filling up tetromino queue");
            let numList = [0, 1, 2, 3, 4, 5, 6],
                generated = [],
                newQueue: TetrominoType[] = [];

            for (let i of numList) {
                while (true) {
                    let r = TetrominoFactory.getRandom(0, 6);
                    if (generated.indexOf(numList[r]) === -1) {
                        generated.push(numList[r]);
                        newQueue.push(this.tetrominoTypes[numList[r]]);
                        break;
                    }
                }
            }

            this.tetrominoQueue = newQueue;
        }
        next(): Tetromino {
            DEBUG && console.debug("Popping out next tetromino");
            if (this.tetrominoQueue.length <= 1) {
                // by only generating a new set of tetrominos when the queue is empty,
                // we ensure that each tetromino exists in every permutation
                // i.e. any given piece will exist every seven pieces, a.k.a. Bag of 7
                this.fillTetrominoQueue();
            }
            let next: Tetromino = new Tetromino(this.tetrominoQueue.pop(), 0, 0);
            next.setId(this.generateID(next.getType()));
            return next
        }
    }


    class GameGrid {
        private pieceMap;
        private availabilityGrid: GridCell[][];
        private lockedPieces: Tetromino[];

        constructor() {
            // indicates cells are filled in or not
            this.availabilityGrid = <GridCell[][]> GameGrid.generateGrid();

            // indicates which pieces occupy which cells
            this.pieceMap = GameGrid.generateGrid();
            this.lockedPieces = [];
        }

        htmlGrid() {
            let strRepr = '';
            for (let i = 0, len = this.availabilityGrid.length; i < len; i++) {
                strRepr += "[" + i + "]";
                strRepr += (this.availabilityGrid[i].join("").replace(/0/g, ' ').replace(/1/g, '*'));
                strRepr += '<br>';
            }

            return strRepr;
        }

        htmlGrid2() {
            let strRepr = '';
            for (let i = 0, len = this.pieceMap.length; i < len; i++) {
                let row = this.pieceMap[i].map(function(x) { return x.toString()[0]});
                strRepr += "[" + i + "]";
                strRepr += (row.join("").replace(/0/g, ' '));
                strRepr += '<br>';
            }

            return strRepr;
        }

        /**
         *
         * @param isFilled
         * @returns {Array}
         */
        static generateRow(isFilled = false): (number|TetrominoID)[] {
            let row = [];
            row.push(GridCell.filled); // left wall
            for (let i = 0; i < COLS; i++) {
                row.push(isFilled ? GridCell.filled : GridCell.empty); // middle space
            }
            row.push(GridCell.filled); // right wall
            return row;
        }

        /**
         * Generates a ROWSxCOLS sized two-dimensional array
         * @returns {Array}
         */
        static generateGrid(): (number|TetrominoID)[][] {
            let grid = [];

            for (let i = 0; i < ROWS; i++) {
                grid.push(GameGrid.generateRow())
            }

            // bottom wall
            grid.push(GameGrid.generateRow(true));
            return grid;
        }

        static cloneGrid(oldGrid) {
            let newGrid = [];
            for (let x = 0, len = oldGrid.length; x < len; x++) {
                newGrid.push(oldGrid[x].slice());
            }
            return newGrid;
        }


        private getTetrominoById(tetrominoId: TetrominoID) {
            for (let tetromino of this.lockedPieces) {
                if (tetromino.getId() === tetrominoId) {
                    return tetromino;
                }
            }
            return undefined;
        }

        /**
         * Removes the tetromino's "footprint" on the game grid. This gives the impression of an empty
         * spot, allowing the game to attempt a one-line downshift.
         * @param tetrominoId
         */
        private hidePiece(tetrominoId: TetrominoID) {
            DEBUG && console.debug("Hiding: " + tetrominoId);
            for (let i = 0, len = this.availabilityGrid.length; i < len; i++) {
                for (let j = 0, len2 = this.availabilityGrid[i].length; j < len2; j++) {
                    if (this.pieceMap[i][j] === tetrominoId) {
                        this.availabilityGrid[i][j] = GridCell.empty;
                    }
                }
            }
        }

        /**
         * The opposite of hidePiece. It returns a tetromino's footprint/place on the
         * game grid using the ID and pieceMap as reference.
         * @param tetrominoId
         */
        private restorePiece(tetrominoId: TetrominoID) {
            DEBUG && console.debug("Restoring: " + tetrominoId);
            for (let i = 0, len = this.availabilityGrid.length; i < len; i++) {
                for (let j = 0, len2 = this.availabilityGrid[i].length; j < len2; j++) {
                    if (this.pieceMap[i][j] === tetrominoId) {
                        this.availabilityGrid[i][j] = GridCell.filled;
                    }
                }
            }
        }

        /**
         * This shifts a tetromino (using its ID on the piece map) down one row.
         * It does it by copying the tetromino shape in the piece map into a temporary
         * grid, but one row down. Then, using the temporary grid, copying the shifted
         * locations to the piece map and availability grid.
         * @param tetrominoId
         */
        private shiftDownInGrid(tetrominoId: TetrominoID) {
            DEBUG && console.debug("Shifting " + tetrominoId + " down in grid");
            let freeGrid = GameGrid.generateGrid();

            for (let row = 0, len = this.pieceMap.length; row < len; row++) {
                for (let col = 0, len2 = this.pieceMap[row].length; col < len2; col++) {
                    if (this.pieceMap[row][col] === tetrominoId) {
                        freeGrid[row + 1][col] = tetrominoId;
                        this.pieceMap[row][col] = GridCell.empty;
                        this.availabilityGrid[row][col] = GridCell.empty;
                    }
                }
            }

            for (let row = 0, len = this.pieceMap.length; row < len; row++) {
                for (let col = 0, len2 = this.pieceMap[row].length; col < len2; col++) {
                    if (freeGrid[row][col] === tetrominoId) {
                        this.pieceMap[row][col] = tetrominoId;
                        this.availabilityGrid[row][col] = GridCell.filled;
                    }
                }
            }
        }

        /**
         * Replace a given row index with a "fresh" unfilled row on both
         * the availabilityGrid and pieceMap
         * @param rowIndex
         */
        private clearRow(rowIndex: number) {
            let pristine = GameGrid.generateRow();

            this.availabilityGrid[rowIndex] = <GridCell[]>pristine.slice();
            this.pieceMap[rowIndex] = pristine.slice();
        }

        private clearTetrominoRow(tetrominoId: TetrominoID, rowIndex: number) {
            DEBUG && console.debug("Clearing " + tetrominoId + " from row#" + rowIndex);
            let tetromino = this.getTetrominoById(tetrominoId);
            let gridPosition = tetromino.getGridPosition();
            let tetrominoBlockRow = rowIndex - gridPosition.y;

            let currentLayout = tetromino.getLayout();
            currentLayout[tetrominoBlockRow] = [0, 0, 0, 0].slice();
            tetromino.setLayout(currentLayout);

            if (!tetromino.checkIsIntact()) {
                DEBUG && console.debug("Piece is not intact; delete from list");
                let pos = this.lockedPieces.indexOf(tetromino);
                this.lockedPieces.splice(pos, 1);
            } else if (tetromino.checkCanSplit()) {
                DEBUG && console.debug("Piece can be split");
                let other = tetromino.split(tetrominoBlockRow);
                this.lockedPieces.push(other);
                this.updatePieceMapIds(tetromino.getId(), other.getId(), rowIndex);
            }
        }

        /**
         * Replaces all instances of the old ID with new ID in the piece map
         * @param oldId
         * @param newId
         * @param cutoff
         */
        private updatePieceMapIds(oldId, newId, cutoff = this.pieceMap.length) {
            DEBUG && console.debug("Replacing all instances of " + oldId + " with " + newId);
            for (let i = 0, len = cutoff; i < len; i++) {
                for (let j = 0, len2 = this.pieceMap[i].length; j < len2; j++) {
                    if (this.pieceMap[i][j] === oldId) {
                        this.pieceMap[i][j] = newId;
                    }
                }
            }
        }

        clearRows(rows: number[]) {
            for (let rowIndex of rows) {
                let affectedTetrominos = this.getTetrominosByRow(rowIndex);

                for (let tetrominoIndex of affectedTetrominos) {
                    this.clearTetrominoRow(tetrominoIndex, rowIndex)
                }

                this.clearRow(rowIndex);
            }

            this.attemptShiftAllDown();
        }

        /**
         * Given a row, returns the IDs of Tetromino instances that have at least one of
         * their blocks exist in said row.
         * @param rowIndex
         * @returns {TetrominoID[]}
         */
        private getTetrominosByRow(rowIndex: number): TetrominoID[] {
            let row = this.pieceMap[rowIndex],
                idList: TetrominoID[] = [];

            for (let i = 1, len = row.length - 1; i < len; i++) {
                let id: GridCell | TetrominoID = <TetrominoID>row[i];
                if (id !== GridCell.empty && id !== GridCell.filled){
                    if (idList.indexOf(<TetrominoID>id) === -1) {
                        idList.push(<TetrominoID>id)
                    }
                }
            }

            return idList;
        }


        /**
         * Attempts to lock the piece in place. First, by copying the tetromino ID
         * onto each of the cells it occupies -- doing so allows the game to keep track
         * of colours even after lock.
         * Second, it copies the current configuration into the tetromino instance, instead
         * of using the default layout from TetrominioLayout object. This will allow the
         * game to manipulate specific blocks later on as lines get cleared and blocks
         * of the same piece get separated from each other.
         *
         * Returns true unless the current tetromino overlaps with something else. This
         * should never happen until end game. Consequently, this will trigger a game over.
         * @param tetromino
         * @returns {boolean}
         */
        registerTetromino(tetromino: Tetromino) {
            DEBUG && console.debug("Attempt to register: " + tetromino.getId());
            let layout = TetrominoLayout[tetromino.getType()][tetromino.getOrientation()];
            let position = tetromino.getGridPosition();

            // calculate x for the walls
            let posX = position.x + 1;
            let posY = position.y;

            for (let i = layout.length; i--; ) {
                for (let j = layout[i].length; j--; ) {
                    if (layout[i][j] === GridCell.filled) {
                        this.pieceMap[posY + i][posX + j] = tetromino.getId();
                        if (this.availabilityGrid[posY + i][posX + j] === GridCell.empty) {
                            this.availabilityGrid[posY + i][posX + j] = GridCell.filled;
                        } else {
                            return false;
                        }
                    }
                }
            }

            // store current configuration layout to the tetromino instance
            // so that we can manipulate individual blocks later
            let newLayout = [];
            for (let i = 0, len = layout.length; i < len; i++) {
                let temp = layout[i].slice();
                newLayout.push(temp);
            }
            tetromino.setLayout(newLayout);
            this.lockedPieces.push(tetromino);


            return true;
        }

        /**
         * Loops through the availabilityGrid to check for any rows that are completely
         * filled, or in Tetris terms, ready to be cleared. Returns the row indices.
         * @returns {number[]}
         */
        scanGrid() {
            DEBUG && console.debug("Scanning game grid for clears");
            let rowsToClear: number[] = [];
            for (let i = 0; i < ROWS; i++) {
                let sum = 0;
                for (let j = 0; j < COLS + 2; j++) {
                    sum += this.availabilityGrid[i][j];
                }
                if (sum === 12) {
                    rowsToClear.push(i);
                }
            }
            return rowsToClear;
        }

        /**
         * Given a block layout (2d array that describes which cells are filled) and
         * coordinates in the game grid, determine if there is a possible collision with
         * the current game grid for such configuration.
         * @param blockLayout
         * @param pos
         * @returns {boolean}
         */
        private checkForCollision(blockLayout, pos: Position) {
            let gridCopy = GameGrid.cloneGrid(this.availabilityGrid),
                xBlockPosition = (pos.x / BLOCK_SIZE) + 1,
                yBlockPosition = pos.y / BLOCK_SIZE;

            availability.innerHTML = this.htmlGrid();
            piecemap.innerHTML = this.htmlGrid2();

            for (let i = 0, len = blockLayout.length; i < len; i++) {
                for (let j = 0, len2 = blockLayout[i].length; j < len2; j++) {
                    if (blockLayout[i][j] === GridCell.filled) {
                        let gameGridCellFilled = gridCopy[yBlockPosition + i][xBlockPosition + j] >= GridCell.filled;

                        if (gameGridCellFilled) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        /**
         * Attempts to rotate the tetromino object by first attempting to rotate it in place
         * without collision. If that doesn't work, attempts to shift it either left,
         * right, or up (in that order) after the desired rotation. The piece doesn't
         * get rotated if it collides in any of the 4 configurations.
         */
        attemptRotation(tetromino: Tetromino){
            const desiredOrientation = (tetromino.getOrientation() + 1) % 4,
                desiredPosition: Position = {
                    x: tetromino.getPosition().x,
                    y: tetromino.getPosition().y
                };
            let canRotate = true;

            // attempt for in-place rotation
            const layout = TetrominoLayout[tetromino.getType()][desiredOrientation];
            const hasCollision = this.checkForCollision(layout, desiredPosition);


            if (hasCollision) {
                const _shiftedPosition = {x: desiredPosition.x, y: desiredPosition.y},
                    shiftedUp: Position = {x: _shiftedPosition.x, y: _shiftedPosition.y - BLOCK_SIZE},
                    shiftedLeft: Position = {x: _shiftedPosition.x - BLOCK_SIZE, y: _shiftedPosition.y},
                    shiftedRight: Position = {x: _shiftedPosition.x + BLOCK_SIZE, y: _shiftedPosition.y};

                // attempt to shift left before rotate
                if (!this.checkForCollision(layout, shiftedLeft)) {
                    tetromino.moveX(-BLOCK_SIZE);
                } else if (!this.checkForCollision(layout, shiftedRight)) {
                    // attempt to shift right before rotate
                    tetromino.moveX(BLOCK_SIZE);
                } else if (!this.checkForCollision(layout, shiftedUp)) {
                    // attempt to shift up before rotate
                    tetromino.moveY(-BLOCK_SIZE);
                } else {
                    canRotate = false
                }
            }

            if (canRotate) {
                tetromino.rotate();
            }

            return canRotate;
        }

        attemptShiftRight(tetromino: Tetromino) {
            let curr = tetromino;
            let currentPosition = tetromino.getPosition();
            let newPosition = {x: currentPosition.x + BLOCK_SIZE, y: currentPosition.y};
            let layout = TetrominoLayout[curr.getType()][curr.getOrientation()];

            let hasCollision = this.checkForCollision(layout, newPosition);

            if(!hasCollision) {
                tetromino.moveX(BLOCK_SIZE);
            }

            return !hasCollision;
        };

        attemptShiftLeft(tetromino: Tetromino) {
            let curr = tetromino;
            let currentPosition = tetromino.getPosition();
            let newPosition = {x: currentPosition.x - BLOCK_SIZE, y: currentPosition.y};
            let layout = TetrominoLayout[curr.getType()][curr.getOrientation()];

            let hasCollision = this.checkForCollision(layout, newPosition);

            if(!hasCollision) {
                tetromino.moveX(-BLOCK_SIZE);
            }

            return !hasCollision;
        }

        attemptShiftDown(tetromino: Tetromino) {
            let curr = tetromino;
            let currentPosition = tetromino.getPosition();
            let newPosition = {x: currentPosition.x, y: currentPosition.y + BLOCK_SIZE};
            let blockLayout = tetromino.getLayout();

            let layout = blockLayout.length === 0 ?
                TetrominoLayout[curr.getType()][curr.getOrientation()] :
                blockLayout;

            let hasCollision = this.checkForCollision(layout, newPosition);

            if(!hasCollision) {
                tetromino.moveY(BLOCK_SIZE);
            }

            return !hasCollision;
        }

        private attemptShiftAllDown() {
            let count = 0;

            for (let tetromino of this.lockedPieces) {
                this.hidePiece(tetromino.getId());
                let success = this.attemptShiftDown(tetromino);

                if (success) {
                    count++;
                    this.shiftDownInGrid(tetromino.getId());
                } else {
                    this.restorePiece(tetromino.getId());
                }
            }

            if (count > 0) {
                this.attemptShiftAllDown();
            }
        }

        redrawLockedPieces(ctx) {
            for (let tetromino of this.lockedPieces) {
                tetromino.draw(ctx);
            }
        }


    }

    class Game {
        currentLevel;
        levelTotal;
        linesPerLevel;
        gameStatus = GameStatus.stopped;
        private currentTetromino: Tetromino = null;
        private ghostPiece: Tetromino = null;

        private holdLock = false;
        private holdTetromino;
        private score = 0;
        private gameGrid = new GameGrid();
        private tetrominoFactory = new TetrominoFactory();

        private gameCanvas;
        private bgCanvas;
        private inactiveCanvas;
        private uiCanvas;

        private gameCtx;
        private bgCtx;
        private inactiveCtx;
        private uiCtx;

        private NUM_ROWS = ROWS + 1;

        constructor(_gameCv: HTMLCanvasElement,
                    _bgCv: HTMLCanvasElement,
                    _inactCv: HTMLCanvasElement,
                    _uiCv: HTMLCanvasElement) {
            this.gameCanvas = _gameCv;
            this.bgCanvas = _bgCv;
            this.inactiveCanvas = _inactCv;
            this.uiCanvas = _uiCv;

            this.gameCtx = this.gameCanvas.getContext && this.gameCanvas.getContext("2d");
            this.bgCtx = this.bgCanvas.getContext && this.bgCanvas.getContext("2d");
            this.inactiveCtx = this.inactiveCanvas.getContext && this.inactiveCanvas.getContext("2d");
            this.uiCtx = this.uiCanvas.getContext && this.uiCanvas.getContext("2d");

            this.resetGame();
            this.resizeCanvas();
            this.attachListeners();

            this.currentTetromino = this.tetrominoFactory.next();
            this.ghostPiece = this.currentTetromino.clone();
            this.updateGhostPiece(this.currentTetromino);
        }

        attachListeners() {
            let _game = this;
            window.addEventListener("keydown", function(ev) {
                _game.keyboardHandler(ev)
            });
            window.addEventListener("resize", function() {
                // _game.resizeCanvas()
            });
        }

        detachListeners() {

        }

        resetGame() {
            this.currentLevel = 1;
            this.levelTotal = 10;
            this.score = 0;
        }

        updateUI(){
            this.uiCtx.clearRect(0, 0, canvas.width, canvas.height);
            this.uiCtx.fillStyle = Colors.yellow;
            this.uiCtx.font = "bold 30px Helvetica Neue,Arial";
            this.uiCtx.fillText(this.currentLevel, BLOCK_SIZE * 12, BLOCK_SIZE * 17);
            this.uiCtx.fillText(this.score, BLOCK_SIZE * 12, BLOCK_SIZE * 19);
        }

        updateBG() {
            let i,
                ctx = this.bgCtx,
                WELL_WIDTH = BLOCK_SIZE * COLS,
                WELL_HEIGHT = BLOCK_SIZE * ROWS;

            ctx.fillStyle = Colors.black;
            ctx.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);

            var yGrid = Math.floor(this.bgCanvas.height / BLOCK_SIZE);
            ctx.strokeStyle = Colors.white;
            ctx.globalAlpha = 0.3;
            for (i = 0; i < yGrid; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * BLOCK_SIZE);
                ctx.lineTo(WELL_WIDTH, i * BLOCK_SIZE);
                ctx.stroke();
            }
            for (i = 0; i < 11; i++) {
                ctx.beginPath();
                ctx.moveTo(i * BLOCK_SIZE, 0);
                ctx.lineTo(i * BLOCK_SIZE, WELL_HEIGHT);
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
            ctx.font = "20pt Helvetica Neue, Arial";
            ctx.fillStyle = Colors.white;
            ctx.fillText("Next Piece", BLOCK_SIZE * 12, BLOCK_SIZE * 3);
            ctx.strokeRect(
                (BLOCK_SIZE * 12) - (BLOCK_SIZE / 2),
                (BLOCK_SIZE * 3) + (BLOCK_SIZE / 2),
                (BLOCK_SIZE * 4) + BLOCK_SIZE,
                (BLOCK_SIZE * 3) + (BLOCK_SIZE / 2));

            ctx.fillText("Hold Piece", BLOCK_SIZE * 12, BLOCK_SIZE * 9);
            ctx.strokeRect(
                (BLOCK_SIZE * 12) - (BLOCK_SIZE / 2),
                (BLOCK_SIZE * 9) + (BLOCK_SIZE / 2),
                (BLOCK_SIZE * 4) + BLOCK_SIZE,
                (BLOCK_SIZE * 3) + (BLOCK_SIZE / 2));

            ctx.fillText("Level", BLOCK_SIZE * 12, BLOCK_SIZE * 16);
            ctx.fillText("Score", BLOCK_SIZE * 12, BLOCK_SIZE * 18);
        }

        updateGhostPiece(parent: Tetromino) {
            let newPos = parent.getPosition();
            this.ghostPiece.setPosition({x: newPos.x, y: newPos.y});
            this.ghostPiece.setOrientation(parent.getOrientation());
            while (this.gameGrid.attemptShiftDown(this.ghostPiece)) {
            }
        }


        keyboardHandler(ev: KeyboardEvent) {
            let success: boolean;
            switch(ev.keyCode) {
                case KeyCodes.right:
                    this.gameGrid.attemptShiftRight(this.currentTetromino);
                    this.updateGhostPiece(this.currentTetromino);

                    break;
                case KeyCodes.left:
                    this.gameGrid.attemptShiftLeft(this.currentTetromino);
                    this.updateGhostPiece(this.currentTetromino);
                    break;
                case KeyCodes.down:
                    this.gameGrid.attemptShiftDown(this.currentTetromino);
                    break;
                case KeyCodes.up:
                    success = this.gameGrid.attemptRotation(this.currentTetromino);
                    this.updateGhostPiece(this.currentTetromino);

                    break;
                case KeyCodes.space:
                    // pause game, push piece down until it hits something, resume game
                    clearTimeout(GAME_LOOP);
                    while(this.gameGrid.attemptShiftDown(this.currentTetromino)){}
                    this.loop();
                    // extra score for hard dropping
                    this.score += 5;
                    break;
                case KeyCodes.lshift:
                    this.handlePieceHold();
                    break;
                case KeyCodes.esc:
                    if (GAME_LOOP) {
                        DEBUG && console.log("Paused.");
                        this.gameStatus = GameStatus.stopped;
                        clearTimeout(GAME_LOOP);
                        GAME_LOOP = null;
                    } else {
                        DEBUG && console.log("Resumed.");
                        this.gameStatus = GameStatus.started;
                        this.loop();
                    }

                    break;
                default:
                    break;
            }
        }

        handlePieceHold() {
            DEBUG && console.debug("Holding piece");
            if (typeof this.holdTetromino === 'undefined') {
                // reset position
                this.holdTetromino = this.currentTetromino;
                this.currentTetromino = this.tetrominoFactory.next();
            } else if (!this.holdLock) {
                let temp = this.currentTetromino;
                this.currentTetromino = this.holdTetromino;
                this.holdTetromino = temp;
            }

            this.ghostPiece = this.currentTetromino.clone();
            this.updateGhostPiece(this.currentTetromino);
            this.holdLock = true;
        }

        /**
         * Window onresize handler. Sets the canvas elements to fullscreen
         * and recalculates how big to make the blocks. Then triggers a redraw of UI elements
         */
        resizeCanvas() {
            // Resize the canvases to be full-size
            this.gameCanvas.height = this.bgCanvas.height = this.uiCanvas.height = this.inactiveCanvas.height = window.innerHeight;
            this.gameCanvas.width = this.bgCanvas.width = this.uiCanvas.width = this.inactiveCanvas.width = window.innerWidth;

            console.log("Canvas height changed to: " + this.gameCanvas.height);
            console.log("Canvas width changed to: " + this.gameCanvas.width);

            BLOCK_SIZE = Math.floor(this.gameCanvas.height / this.NUM_ROWS);
            this.updateUI();
            this.updateBG();
        }

        private updateScore(clearRows: number[]) {
            if (clearRows.length > 0) {
                switch(clearRows.length) {
                    case 1:
                        DEBUG && console.debug("Scoring single");
                        this.score += (this.currentLevel * 100);
                        break;
                    case 2:
                        DEBUG && console.debug("Scoring double");
                        this.score += (this.currentLevel * 300);
                        break;
                    case 3:
                        DEBUG && console.debug("Scoring triple");
                        this.score += (this.currentLevel * 500);
                        break;
                    case 4:
                        DEBUG && console.debug("Scoring tetris");
                        this.score += (this.currentLevel * 800);
                        break;
                    default:
                        break;
                }
            }
        }

        updateState() {
            DEBUG && console.debug("Updating game state");
            let rowsToClear = this.gameGrid.scanGrid();

            this.updateScore(rowsToClear);
            if (rowsToClear.length > 0) {
                DEBUG && console.debug("Found " + rowsToClear.length + " rows to clear");
                this.gameGrid.clearRows(rowsToClear);
                this.updateState();
            }
        }

        loop() {
            let _game = this;

            let attemptSuccessful = this.gameGrid.attemptShiftDown(this.currentTetromino);

            // if it stops moving, it must've hit something
            if (!attemptSuccessful) {
                let flag = this.gameGrid.registerTetromino(this.currentTetromino);

                if (flag) {
                    this.updateState();

                    // default score for placing a piece
                    this.score += 5;

                    this.holdLock = false;
                    this.currentTetromino = this.tetrominoFactory.next();
                    this.ghostPiece = this.currentTetromino.clone();
                    this.updateGhostPiece(this.currentTetromino);

                    this.linesPerLevel += 1;
                    if (this.linesPerLevel === this.levelTotal) {
                        this.currentLevel++;
                        this.linesPerLevel = 0;
                    }
                } else {
                    this.end();
                    return false;
                }
            }


            if (this.gameStatus === GameStatus.started) {
                GAME_LOOP = setTimeout(function() {
                    _game.loop()
                }, 1100 - ((_game.currentLevel * 0.9) * 50));
            }
        }

        render() {
            let _game = this;
            this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
            this.inactiveCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);

            this.ghostPiece.draw(this.inactiveCtx);
            this.currentTetromino.draw(this.gameCtx);
            this.gameGrid.redrawLockedPieces(this.inactiveCtx);

            this.updateUI();

            if (this.gameStatus === GameStatus.started) {
                requestAnimationFrame(function () {
                    _game.render();
                });
            }
        }

        run() {
            this.gameStatus = GameStatus.started;
            this.render();
            this.loop();
        }

        end() {

        }
    }

    // Canvases
    const canvas = <HTMLCanvasElement> document.getElementById("active"),
        backCanvas = <HTMLCanvasElement> document.getElementById("background"),
        inactive = <HTMLCanvasElement> document.getElementById("inactive"),
        uiCanvas = <HTMLCanvasElement> document.getElementById("ui");

    const game = new Game(canvas, backCanvas, inactive, uiCanvas);
    game.run();
}