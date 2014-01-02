/**
 * @author Luis Pablo
 * @copyright 2013
 * @version 1.0
 */
var Tetris = (function () {
    "use strict";
    window.requestAnimationFrame = window.requestAnimationFrame ||
                                window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                window.msRequestAnimationFrame;

    var canvas = document.getElementById("active"),
        backCanvas = document.getElementById("background"),
        inactive = document.getElementById("inactive"),
        uiCanvas = document.getElementById("ui"),
        // CONTEXT VARIABLES
        ctx = canvas.getContext && canvas.getContext("2d"),
        inactiveCtx = inactive.getContext && inactive.getContext("2d"),
        bgContext = backCanvas.getContext && backCanvas.getContext("2d"),
        uiCtx = uiCanvas.getContext && uiCanvas.getContext("2d"),
        // CONSTANTS
        KEYCODE = {
            "left": 37, "up": 38, "right": 39, "down": 40,
            "space": 32, "lshift": 16, "esc": 27
        }, BLOCK_SIZE, LINE_WIDTH = 4,
        COLORS = {
            "red"    : "#BE2727",
            "blue"   : "#3163A3",
            "green"  : "#31A348",
            "orange" : "#D67D41",
            "purple" : "#9A41D6",
            "yellow" : "#D6C441",
            "cyan"   : "#3EA7AC",
            "magenta": "#AF3AAA",
            "black"  : "#000000",
            "white"  : "#FFFFFF",
            "smoke"  : "#EDEDED"
        }, COLOR_MAP = {
            "TBlock": COLORS.purple, "IBlock": COLORS.cyan,
            "LBlock": COLORS.orange, "JBlock": COLORS.blue,
            "SBlock": COLORS.green, "ZBlock": COLORS.red,
            "OBlock": COLORS.yellow
        }, TETROMINO = {
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
        },
        WELL_WIDTH = 0,
        WELL_HEIGHT = 0,
        GAME_STATUS = {
            "started": 1, "stopped": 0
        },
        // GAME ELEMENTS
        currentLevel = 1,
        levelTotal = 0,
        linesPerLevel = 0,
        holdLock = false,
        currentTetromino = {},
        holdTetromino,
        gameStatus = 0,
        score = 0,
        tetrominoQueue = [],        // queue of upcoming tetrominos
        lockedTetrominos = [],      // list of all locked tetrominos (i.e. no longer movable)
        gameGrid = [],          // a text-based grid representation of all locked tetrominos
        tetrominoMap = [],          // a grid that maps which locked tetrominos are in which position
        idGenerator;


    /**
     * A constructor for an ID generator.
     */
    var IDGenerator = function() {
        var currId = -1;

        /**
         * Generates an ID based on the tetromino type and the count of how many existing tetrominos there
         * are at this point
         * @param  {string} tetrominoType A string representation of the tetromino type
         * @return {number} An ID automatically generated
         */
        this.generateNextID = function(tetrominoType) {
            currId += 1;
            return tetrominoType[0] + currId;
        };
    };


    /**
     * Constructor for Tetromino object. 
     * @param {String} type   Tetromino's classification -- IBlock, LBlock, etc.
     * @param {number} posX   The tetromino's starting X position
     * @param {number} posY   The tetromino's starting Y position
     * @param {Array.Array} layout An optional parameter that defines the layout of the blocks
     */
    var Tetromino = function (type, posX, posY, layout) {
        var color = COLOR_MAP[type],
            orientation = 0,
            tetrominoType = type;

        this.id = "";
        // refers to [0,0] of the tetromino's bounding grid
        this.position = {
            "x": posX || 0,
            "y": posY || 0
        };
        this.blockLayout = layout || [];

        /*
        Getter and Setters
         */
        this.getType = function() { return tetrominoType; };
        this.getColor = function() { return color; };
        this.getOrientation = function() { return orientation; };
        this.setOrientation = function(o) { orientation = (o < 4 && o > 0) ? o : 0; };
    };


    /**
     * Rotates the tetromino object. After rotating 3 times, its position is reset to its 
     * default position (0). Before applying the rotation, it checks if the rotation will
     * cause any collision with other pieces or against the play field's walls.
     * @return {boolean} true if rotation was successful, false if not
     */
    Tetromino.prototype.rotate = function() {
        var newOrientation = this.getOrientation() + 1,
            position = this.position,
            newPos = {},
            hasCollision = false;

        // reset after 3 rotations
        newOrientation = (newOrientation > 3) ? 0 : newOrientation;

        newPos.x = position.x;
        newPos.y = position.y;

        hasCollision = checkForCollision(TETROMINO[this.getType()][newOrientation], newPos);

        // if it has collision, try moving across x-axis, both ways
        // if it still doesn't work, try moving up the y-axis
        // if neither works, don't rotate
        if (hasCollision) {
            var shiftToLeftCollided = false,
                shiftToRightCollided = false,
                shiftToUpCollided = false;

            shiftToLeftCollided = checkForCollision(
                TETROMINO[this.getType()][newOrientation],
                {"x": position.x - BLOCK_SIZE, "y": position.y});
            shiftToRightCollided = checkForCollision(
                TETROMINO[this.getType()][newOrientation],
                {"x": position.x + BLOCK_SIZE, "y": position.y});
            shiftToUpCollided = checkForCollision(
                TETROMINO[this.getType()][newOrientation],
                {"x": position.x, "y": position.y - BLOCK_SIZE});

            if(!shiftToLeftCollided) {
                this.position.x -= BLOCK_SIZE;
            } else if (!shiftToRightCollided) {
                this.position.x += BLOCK_SIZE;
            } else if (!shiftToUpCollided) {
                this.position.y -= BLOCK_SIZE;
            } else if (shiftToLeftCollided && shiftToRightCollided && shiftToUpCollided) {
                return false;
            }
        }

        this.setOrientation(newOrientation);
        return true;
    };


    Tetromino.prototype.moveX = function(delta) {
        var position = this.position,
            deltaX = position.x + delta,
            newPos = {},
            hasCollision = false;

        newPos.x = deltaX;
        newPos.y = position.y;

        hasCollision = checkForCollision(TETROMINO[this.getType()][this.getOrientation()], newPos);

        if (!hasCollision) {
            this.position.x += delta;
        }
    };

    Tetromino.prototype.moveY = function(delta) {
        var position = this.position,
            deltaY = position.y + delta,
            newPos = {},
            hasCollision = false,
            layout;

        if (this.blockLayout.length === 0) {
            layout = TETROMINO[this.getType()][this.getOrientation()];
        } else {
            layout = this.blockLayout;
        }

        newPos.x = position.x;
        newPos.y = deltaY;

        hasCollision = checkForCollision(layout, newPos);

        if (!hasCollision) {
            this.position.y += delta;
            return true;
        }

        return false;
    };

    Tetromino.prototype.isIntact = function() {
        var i = 0,
            j = 0,
            len = 0,
            len2 = 0,
            blockCount = 0;

        if (this.blockLayout.length === 0) {
            return false;
        } else {
            blockCount = 0;
            
            for (i = 0, len = this.blockLayout.length; i < len; i++ ) {
                for (j = 0, len2 = this.blockLayout[i].length; j < len2; j++) {
                    blockCount += this.blockLayout[i][j];
                }
            }

            if (blockCount > 0) {
                return true;
            } else {
                return false;
            }
        }
    };

    Tetromino.prototype.isSeparable = function() {
        var diff = 0,
            i = 0,
            indices = [],
            len = 0,
            sum = 0;

        // if there is an empty gap between any two lines, this is considered separable
        if (this.blockLayout.length === 0) {
            return false;
        } else {
            sum = 0;
            indices = [];

            for (i = 0, len = this.blockLayout.length; i < len; i++) {
                sum = getSum(this.blockLayout[i]);
                if (sum > 0) {
                    indices.push(i);
                }
            }

            if (indices.length > 1) {
                for (i = 0, len = indices.length - 1; i < len; i++) {
                    diff = indices[i + 1] - indices[i];
                    if (diff > 1) {
                        return true;
                    }
                }
            } else {
                return false;
            }
        }
    };


    ////////////////////
    // Misc Functions //
    ////////////////////
    /**
     * Generates a random Integer within the interval min and max (inclusive)
     * @param  {number} min
     * @param  {number} max
     * @return {number} A random number
     */
    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getSum(arr) {
        var sum = 0;
        for (var i = 0, len = arr.length; i < len; i++) {
            sum += arr[i];
        }
        return sum;
    }

    ////////////////////
    // Draw Functions //
    ////////////////////
    /**
     * Function for drawing the background. This function is ran once by the init() function.
     */
    function drawBg() {
        var i = 0;

        bgContext.fillStyle = COLORS.black;
        bgContext.fillRect(0, 0, backCanvas.width, backCanvas.height);

        var yGrid = Math.floor(backCanvas.height / BLOCK_SIZE);
        bgContext.strokeStyle = COLORS.white;
        bgContext.globalAlpha = 0.3;
        for (i = 0; i < yGrid; i++) {
            bgContext.beginPath();
            bgContext.moveTo(0, i * BLOCK_SIZE);
            bgContext.lineTo(WELL_WIDTH, i * BLOCK_SIZE);
            bgContext.stroke();
        }
        for (i = 0; i < 11; i++) {
            bgContext.beginPath();
            bgContext.moveTo(i * BLOCK_SIZE, 0);
            bgContext.lineTo(i * BLOCK_SIZE, WELL_HEIGHT);
            bgContext.stroke();
        }

        bgContext.globalAlpha = 1;
        bgContext.font = "20pt Calibri";
        bgContext.fillStyle = COLORS.white;
        bgContext.fillText("Next Piece", BLOCK_SIZE * 12, BLOCK_SIZE * 3);
        bgContext.strokeRect(
            (BLOCK_SIZE * 12) - (BLOCK_SIZE / 2), 
            (BLOCK_SIZE * 3) + (BLOCK_SIZE / 2), 
            (BLOCK_SIZE * 4) + BLOCK_SIZE, 
            (BLOCK_SIZE * 3) + (BLOCK_SIZE / 2));

        bgContext.fillText("Hold Piece", BLOCK_SIZE * 12, BLOCK_SIZE * 9);
        bgContext.strokeRect(
            (BLOCK_SIZE * 12) - (BLOCK_SIZE / 2), 
            (BLOCK_SIZE * 9) + (BLOCK_SIZE / 2), 
            (BLOCK_SIZE * 4) + BLOCK_SIZE, 
            (BLOCK_SIZE * 3) + (BLOCK_SIZE / 2));

        bgContext.fillText("Level", BLOCK_SIZE * 12, BLOCK_SIZE * 16);
        bgContext.fillText("Score", BLOCK_SIZE * 12, BLOCK_SIZE * 18);
    }


    function drawTetromino (glyph, context) {
        var startX = glyph.position.x,
            startY = glyph.position.y,
            orientation = glyph.getOrientation(),
            tetrominoType = glyph.getType(),
            tetrominoGrid = [],
            shadowWidth;

        if (glyph.blockLayout.length === 0) {
            tetrominoGrid = TETROMINO[tetrominoType][orientation];
        } else {
            tetrominoGrid = glyph.blockLayout;
        }

        for (var i = tetrominoGrid.length; i--; ) {
            for (var j = tetrominoGrid[i].length; j--; ) {
                if (tetrominoGrid[i][j] === 1) {
                    // draw the box background
                    context.globalAlpha = 1;
                    context.beginPath();
                    context.fillStyle = glyph.getColor();
                    context.fillRect(
                        ( j * BLOCK_SIZE ) + startX,
                        ( i * BLOCK_SIZE ) + startY, BLOCK_SIZE, BLOCK_SIZE );

                    //  draw shadows 
                    context.globalAlpha = 0.4;
                    context.strokeStyle = COLORS.black;
                    context.lineWidth = shadowWidth = LINE_WIDTH - 1;
                    context.lineJoin = "miter";
                    context.beginPath();
                        context.moveTo(
                            startX + ( j * BLOCK_SIZE ) + shadowWidth,
                            startY + ( i * BLOCK_SIZE ));
                        context.lineTo(
                            startX + ( j * BLOCK_SIZE ) + shadowWidth,
                            startY + ( i * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ));
                        context.lineTo(
                            startX + ( j * BLOCK_SIZE ) + BLOCK_SIZE,
                            startY + ( i * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ));
                        context.lineTo(
                            startX + ( j * BLOCK_SIZE  ) + shadowWidth,
                            startY + ( i * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ));
                        context.stroke();
                    context.closePath();

                    // draw highlights
                    context.strokeStyle = COLORS.white;
                    context.beginPath();
                        context.moveTo(
                            startX + ( j * BLOCK_SIZE ),
                            startY + ( i * BLOCK_SIZE ) + shadowWidth );
                        context.lineTo(
                            startX + ( j * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ),
                            startY + ( i * BLOCK_SIZE ) + shadowWidth);
                        context.lineTo(
                            startX + ( j * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ),
                            startY + ( i * BLOCK_SIZE ) + BLOCK_SIZE );
                        context.lineTo(
                            startX + ( j * BLOCK_SIZE ) + ( BLOCK_SIZE - shadowWidth ),
                            startY + ( i * BLOCK_SIZE ) + shadowWidth );
                        context.stroke();
                    context.closePath();

                    // draw middle circle
                    context.fillStyle = COLORS.black;
                    context.arc(
                        startX + ( j * BLOCK_SIZE ) + ( BLOCK_SIZE / 2 ),
                        startY + ( i * BLOCK_SIZE ) + ( BLOCK_SIZE / 2 ),
                        shadowWidth, 0, 2 * Math.PI);
                    context.fill();

                    // draw outline
                    context.lineWidth = LINE_WIDTH;
                    context.strokeStyle = COLORS.smoke;
                    context.lineJoin = "bevel";
                    context.globalAlpha = 1;
                    context.strokeRect(
                        startX + ( j * BLOCK_SIZE ),
                        startY + ( i * BLOCK_SIZE ),
                        BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }


    function drawUI() {
        var nextTetrominoType = tetrominoQueue[tetrominoQueue.length-1],
            nextTetrominoUI = new Tetromino(
                    nextTetrominoType, 
                    BLOCK_SIZE * 12, 
                    (BLOCK_SIZE * 3) + (BLOCK_SIZE/3)),
            holdTetrominoUI = {};
        
        uiCtx.clearRect(0, 0, canvas.width, canvas.height);

        drawTetromino(nextTetrominoUI, uiCtx);
        if (holdTetromino) {
            holdTetrominoUI = new Tetromino(holdTetromino.getType(), BLOCK_SIZE * 12, BLOCK_SIZE * 9);
            drawTetromino(holdTetrominoUI, uiCtx);
        }

        uiCtx.fillStyle = COLORS.yellow;
        uiCtx.font = "bold 30px Inconsolata";
        uiCtx.fillText(currentLevel, BLOCK_SIZE * 12, BLOCK_SIZE * 17);
        uiCtx.fillText(score, BLOCK_SIZE * 12, BLOCK_SIZE * 19);
    }


    function redrawLockedTetrominos() {
        var i = 0, len = 0;

        inactiveCtx.clearRect(0, 0, canvas.width, canvas.height);

        for (i = 0, len = lockedTetrominos.length; i < len; i++) {
            drawTetromino(lockedTetrominos[i], inactiveCtx);
        }
    }


    function doRender () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTetromino(currentTetromino, ctx);

        if (gameStatus === GAME_STATUS.started) {
            requestAnimationFrame(doRender);
        }
    }

    /**
     * Given a tetromino's block layout and position, determine if there is a possible collision with
     * the current gameGrid in that exact setting.
     * @param  {Array[Array]} blockLayout A block layout specific to the tetromino
     * @param  {Object.<number, number>} coordinates The X and Y position of the tetromino
     * @return {boolean} true if there is a collision, false otherwise
     */
    function checkForCollision(blockLayout, coordinates) {
        var currentGrid = [],
            // account for the well's walls
            posX = (coordinates.x / BLOCK_SIZE) + 1,
            posY = coordinates.y / BLOCK_SIZE,
            currValue = 0,
            x = 0, i = 0, j = 0, len = 0, len2 = 0;

        // create a copy of the game grid
        for (x = 0, len = gameGrid.length; x < len; x++) {
            var temp;
            temp = gameGrid[x].slice();
            currentGrid.push(temp);
        }

        // keep adding 1's to the cells. If there happens to be a 2, that means something has
        // already been filling that space -- hence, collision
        for (i = 0, len = blockLayout.length; i < len; i += 1) {
            for (j = 0, len2 = blockLayout[i].length; j < len2; j += 1) {
                if (blockLayout[i][j] === 1) {
                    currentGrid[posY + i][posX + j] += 1;
                    currValue = currentGrid[posY + i][posX + j];

                    if (currValue === 2) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

   /**
    * Event Handler for 'keydown' events
    * @param  {Event} e Event to be handledreturn
    */
    function currentTetrominoControls(e) {
        if (e.keyCode === KEYCODE.right) {
            e.preventDefault();
            currentTetromino.moveX(BLOCK_SIZE);
        } else if (e.keyCode === KEYCODE.left) {
            e.preventDefault();
            currentTetromino.moveX(-BLOCK_SIZE);
        } else if (e.keyCode === KEYCODE.down) {
            e.preventDefault();
            currentTetromino.moveY(BLOCK_SIZE);
        } else if (e.keyCode === KEYCODE.up) {
            e.preventDefault();
            currentTetromino.rotate();
        } else if (e.keyCode === KEYCODE.space) {
            e.preventDefault();
            while(currentTetromino.moveY(BLOCK_SIZE)){}
            clearTimeout(mainLoop);
            gameLoop();
        } else if (e.keyCode === KEYCODE.lshift) {
            e.preventDefault();
            if (holdTetromino === undefined) {
                currentTetromino.position = {"x": BLOCK_SIZE * 3, "y": BLOCK_SIZE};
                holdTetromino = currentTetromino;
                currentTetromino = getNewTetromino();
                drawUI();
            } else if (!holdLock) {
                currentTetromino.position = {"x": BLOCK_SIZE * 3, "y": BLOCK_SIZE};
                var temp = holdTetromino;
                holdTetromino = currentTetromino;
                currentTetromino = temp;
                drawUI();
            }
            holdLock = true;
        }
    }


    function updateScore(type) {
        switch(type){
            case "single":
                score += (currentLevel * 100);
                break;
            case "double":
                score += (currentLevel * 300);
                break;
            case "triple":
                score += (currentLevel * 500);
                break;
            case "tetris":
                score += (currentLevel * 800);
                break;
            case "soft":
                score += 5;
                break;
            case "hard":
                score += 10;
                break;
            default:
                score += 0;
        }
    }


    function registerTetromino(tetromino) {
        var coordinates = tetromino.position,
            drawInstructions = TETROMINO[tetromino.getType()][tetromino.getOrientation()],
            // account for the well's walls
            posX = ((coordinates.x / BLOCK_SIZE) + 1),
            posY = (coordinates.y / BLOCK_SIZE),
            currValue = 0;

        for (var i = drawInstructions.length; i--; ) {
            for (var j = drawInstructions[i].length; j--; ) {
                if (drawInstructions[i][j] === 1) {
                    gameGrid[posY + i][posX + j] += 1;
                    currValue = gameGrid[posY + i][posX + j];
                    tetrominoMap[posY + i][posX + j] = tetromino.id;

                    // if a cell happens to be a two, there must've been a collision
                    // terminate and return false
                    if (currValue === 2) {
                        return false;
                    }
                }
            }
        }

        // duplicate block layout onto the tetromino itself for individual rendering
        for (var i = 0, len = drawInstructions.length; i < len; i++) {
            var temp = [];
            temp = drawInstructions[i].slice();
            tetromino.blockLayout.push(temp);
        }
        lockedTetrominos.push(tetromino);
        redrawLockedTetrominos();

        return true;
    }


    function extractTetrominos(row) {
        var i = 0,
            len = tetrominoMap[row].length - 1,
            idList = [],
            id = "";

        // given a row index, retrieve all the tetromino IDs in this row
        for (i = 1; i < len; i++) {
            id = tetrominoMap[row][i];
            if (idList.indexOf(id) < 0 && id !== 0) {
                idList.push(id);
            }
        }

        return idList;
    }


    function getTetrominoById(id) {
        var i = 0,
            len = 0;

        for (i = 0, len = lockedTetrominos.length; i < len; i++) {
            if (lockedTetrominos[i].id === id) {
                return lockedTetrominos[i];
            }
        }
    }


    function separateTetromino(id, separation) {
        var parent = {},
            clone = {},
            newLayout = [[],[],[],[]],
            pristineRow = [0,0,0,0];

        parent = getTetrominoById(id);

        // make a partial copy of the old piece onto a new piece
        for (var i = 0, len = parent.blockLayout.length; i < len; i++) {
            if (i < separation) {
                newLayout[i] = parent.blockLayout[i].slice();
                parent.blockLayout[i] = pristineRow;
            } else {
                newLayout[i] = pristineRow.slice();
            }
        }

        // create a new tetromino object based on this
        clone = new Tetromino(parent.getType(), parent.position.x, parent.position.y, newLayout);
        clone.id = idGenerator.generateNextID(parent.getType());

        lockedTetrominos.push(clone);
        return clone.id;
    }


    function replaceInstances(oldID, newID, cutoff) {
        for (var i = 0, len = cutoff; i < len; i++) {
            for (var j = 0, len2 = tetrominoMap[i].length; j < len2; j++) {
                if (tetrominoMap[i][j] === oldID) {
                    tetrominoMap[i][j] = newID;
                }
            }
        }
    }


    function clearTetromino(id, row) {
        var tetromino = {},
            tetrominoPos, index = 0,
            pristineRow = [0,0,0,0],
            index,
            pos = 0,
            newId = 0;

        tetromino = getTetrominoById(id);
        tetrominoPos = tetromino.position.y / BLOCK_SIZE;
        
        index = row - tetrominoPos;
        tetromino.blockLayout[index] = pristineRow.slice();

        // if tetromino is practically empty (all 0's in the blockLayout), might as well
        // delete it from the lockedPieces stack
        if (!tetromino.isIntact()) {
            pos = lockedTetrominos.indexOf(tetromino);
            lockedTetrominos.splice(pos, 1);
        // if not, check it also if they're separated by a line of 0s. If so, separate them
        // and update the grids
        } else if (tetromino.isSeparable()) {
            newId = separateTetromino(id, index);
            replaceInstances(id, newId, row);
        }
    }

    /**
     * Given a row index, clear that row on both the gameGrid and tetrominoMap.
     * @param  {number} rowIndex Row index to clear
     */
    function clearRow(rowIndex) {
        var pristineRow = [1,0,0,0,0,0,0,0,0,0,0,1];

        gameGrid[rowIndex] = pristineRow.slice();
        tetrominoMap[rowIndex] = pristineRow.slice();
    }

    /**
     * Removes the tetromino's "footprint" on gameGrid. This gives the impression of an empty
     * spot, allowing the game to attempt a one-line downshift.
     * @param  {String} id The ID of the tetromino to be removed
     */
    function removeFromGrid(id) {
        for (var i = 0, len = gameGrid.length; i < len; i++) {
            for (var j = 0, len2 = gameGrid[i].length; j < len2; j++) {
                if (tetrominoMap[i][j] === id) {
                    gameGrid[i][j] = 0;
                }
            }
        }
    }

    /**
     * The opposite of removeFromGrid. It returns its value on the gameGrid by using the
     * piece ID and tetrominoMap as reference.
     * @param  {number} id ID of the piece to be processed
     */
    function returnToGrid(id) {
        for (var i = 0, len = gameGrid.length; i < len; i++) {
            for (var j = 0, len2 = gameGrid[i].length; j < len2; j++) {
                if (tetrominoMap[i][j] === id) {
                    gameGrid[i][j] = 1;
                }
            }
        }
    }



    function updateGrids(id) {
        var i = 0, j = 0,
            len = 0, len2 = 0;

        // First, replace the old cells with an empty cell (0), and the new cell
        // with a temporary marker (@)
        for (i = 0, len = gameGrid.length; i < len; i++) {
            for (j = 0, len2 = gameGrid[i].length; j < len2; j++) {
                if (tetrominoMap[i][j] === "!") {
                    if (tetrominoMap[i+1][j] === id) {
                        tetrominoMap[i+1][j] = "!";
                    } else {
                        tetrominoMap[i+1][j] = "@";
                    }
                    tetrominoMap[i][j] = "@";
                } else if (tetrominoMap[i][j] === id) {
                    if (tetrominoMap[i+1][j] === id) {
                        tetrominoMap[i+1][j] = "!";
                    } else {
                        tetrominoMap[i+1][j] = "@";
                    }
                    tetrominoMap[i][j] = 0;
                }
            }
        }

        // Then, for every instance of "@" in the grid, replace themn with the proper ID
        // in the tetrominoMap
        for (i = 0, len = gameGrid.length; i < len; i++) {
            for (j = 0, len2 = gameGrid[i].length; j < len2; j++) {
                if (tetrominoMap[i][j] === "@") {
                    tetrominoMap[i][j] = id;
                }
            }
        }

        // Likewise, replace the "@" as 1s in gameGrid
        for (i = 0, len = gameGrid.length; i < len; i++) {
            for (j = 0, len2 = gameGrid[i].length; j < len2; j++) {
                if (tetrominoMap[i][j] !== 0) {
                    gameGrid[i][j] = 1;
                }
            }
        }
    }


    function doShifts() {
        var tetromino, flag = true,
            moveSuccessful = false,
            count = 0,
            i = 0;

        i = 0;

        while (flag) {
            tetromino = lockedTetrominos[i];

            // intermediate step: temporarily remove the block in question from the gameGrid to
            // prevent collision with itself. store this in a temporary grid
            removeFromGrid(tetromino.id);
            moveSuccessful = tetromino.moveY(BLOCK_SIZE);

            if (moveSuccessful) {
                count += 1;
                updateGrids(tetromino.id);
            } else {
                returnToGrid(tetromino.id);
            }

            i += 1;
            if (i === lockedTetrominos.length) {
                // if no tetrominos moved in this turn, stop trying
                if (count === 0) {
                    flag = false;
                    clearSequence();
                } else {
                    flag = true;
                }

                i = 0;
                count = 0;
            }
        }
    }


    /**
     * Given an array of row indices, determine which tetromino blocks reside in those rows.
     * Manipulate those rows through partial or complete deletion. When done, clear the
     * entire row in gameGrid and tetrominoMap.
     * @param  {Array} rows An array of row indices to delete
     */
    function doElimination(rows) {
        var affectedTetrominos = [];
        // determine which tetrominos to manipulate
        // for each tetromino, clear the specific row by replacing the row with 0's
        for (var i = 0, len = rows.length; i < len; i++) {
            affectedTetrominos = extractTetrominos(rows[i]);

            for (var j = 0, len2 = affectedTetrominos.length; j < len2; j++) {
                clearTetromino(affectedTetrominos[j], rows[i]);
            }

            clearRow(rows[i]);
        }
    }


    /**
     * Iterates through all rows of the gameGrid and checks for any rows that are
     * filled up by adding up all the filled cells.
     * @return {Array} An array of row numbers to that are filled up
     */
    function checkForClear() {
        var i = 0, j = 0,
            len = 0,
            len2 = 0,
            toClear = [],
            sum = 0;

        for (i = 0, len = gameGrid.length - 1; i < len; i++) {
            sum = 0;
            for (j = 0, len2 = gameGrid[i].length; j < len2; j++) {
                sum += gameGrid[i][j];
            }
            if (sum === 12) {
                toClear.push(i);
            }
        }
        return toClear;
    }


    /**
     * After every tetromino locking, either through soft drop or hard drop, and after other
     * changes on the game grid, this function is ran. It first checks for any filled lines
     * and then subsequently calls the steps needed to clear the grid.
     */
    function clearSequence(){
        var clearList = checkForClear();

        if (clearList.length > 0) {
            if (clearList.length === 1) {
                updateScore("single");
            } else if (clearList.length === 2) {
                updateScore("double");
            } else if (clearList.length === 3) {
                updateScore("triple");
            } else if (clearList.length === 4) {
                updateScore("tetris");
            }

            doElimination(clearList);
            doShifts();
            redrawLockedTetrominos();
        }
    }


    /**
     * If there are no tetrominos in the queue, uses the Bag of 7 algorithm to keep generating more. 
     * The algorithm works by generating a permutation of the 7 tetrominos. This makes sure that 
     * each tetromino is used at least once per generation. 
     * @return {Tetromino} the top Tetromino in the tetrominoQueue
     */
    function getNewTetromino() {
        var i = 0, numList = [0,1,2,3,4,5,6], randomNum,
            shuffledList = [],
            tetrominoList = ["TBlock", "IBlock", "JBlock", "LBlock", "OBlock", "SBlock", "ZBlock"],
            newTetromino = {};

        if (tetrominoQueue.length <= 1) {
            for (i = 6; i--; ) {
                while (true) {
                    randomNum = getRandom(0,6);
                    if (shuffledList.indexOf(numList[randomNum]) === -1) {
                        shuffledList.push(numList[randomNum]);
                        break;
                    }
                }
            }
            for (i = 0; i < 6; i++) {
                tetrominoQueue.push(tetrominoList[shuffledList[i]]);
            }
        }
        newTetromino = new Tetromino(tetrominoQueue.pop(), BLOCK_SIZE * 3, 0);
        newTetromino.id = idGenerator.generateNextID(newTetromino.getType());

        return newTetromino;
    }


    /**
     * Generates a template of a clean game grid. 0 denotes empty cells and 1 denotes an
     * occupied space, either from a tetromino or a game wall
     * @return {Array} a multi-dimensional array representing the game grid
     */
    function generateGameGrid() {
        var x = WELL_WIDTH / BLOCK_SIZE,
            y = WELL_HEIGHT / BLOCK_SIZE,
            i = 0, j = 0,
            arr = [], temp;

        for (i = 0; i < y; i++) {
            temp = [1];
            for (j = 0; j < x; j++) {
                temp.push(0);
            }
            temp.push(1);
            arr.push(temp);
        }

        temp = [];

        for (i = 0; i < (x + 2); i++) {
            temp.push(1);
        }
        arr.push(temp);
        return arr;
    }


    function init () {
        // Resize the canvases to be full-size
        canvas.height = backCanvas.height = uiCanvas.height = inactive.height = window.innerHeight;
        canvas.width = backCanvas.width = uiCanvas.width = inactive.width = window.innerWidth;

        // Check if canvas is supported
        if(!ctx) {
            alert("Please upgrade your browser");
        } else {
            window.addEventListener("keydown", currentTetrominoControls, false);
        }

        BLOCK_SIZE = Math.floor(canvas.height / 21);
        WELL_HEIGHT = 20 * BLOCK_SIZE;
        WELL_WIDTH = 10 * BLOCK_SIZE;

        gameGrid = generateGameGrid();
        tetrominoMap = generateGameGrid();
        idGenerator = new IDGenerator();

        currentLevel = 1;
        levelTotal = 10;
        score = 0;
        gameStatus = GAME_STATUS.started;

        currentTetromino = getNewTetromino();
        drawUI();
        drawBg();
    }


    function gameLoop () {
        var lastPos = currentTetromino.position.y,
            flag = true;

        currentTetromino.moveY(BLOCK_SIZE);

        // when the tetromino stops moving lower, assume it hit the bottom
        if (lastPos <= currentTetromino.position.y && lastPos === currentTetromino.position.y) {
            flag = registerTetromino(currentTetromino);
            if (!flag) {
                endGame();
                return false;
            } else {
                clearSequence();
            }
            holdLock = false;
            currentTetromino = getNewTetromino();
            drawUI();
            lastPos = 0;

            linesPerLevel += 1;
            if (linesPerLevel === levelTotal) {
                currentLevel += 1;
                linesPerLevel = 0;
            }
        }

        if (gameStatus === GAME_STATUS.started) {
            window.mainLoop = setTimeout(gameLoop, 1100 - ((currentLevel * 0.9) * 50));
        }
    }


    function endGame() {
        gameStatus = GAME_STATUS.stopped;
        clearTimeout(mainLoop);
        window.removeEventListener(currentTetrominoControls);
        console.log("Game Over!");
    }


    function startGame() {
        init();
        doRender();
        gameLoop();
    }

    startGame();
})();
