// Основная логика игры

class Match3Game {
    constructor(config, board, animations, ui) {
        this.config = config;
        this.board = board;
        this.animations = animations;
        this.ui = ui;
        this.score = 0;
        this.moves = 0;
        this.selectedCell = null;
        this.dragStart = null;
        this.isProcessing = false;
        this.comboMultiplier = 1;
        this.timedMode = false;
        this.timeLeft = config.timeLimitSeconds || 60;
        this.timerId = null;
        this.gameOver = false;
        this.init();
    }
    
    init() {
        this.board.createBoard();
        this.ui.renderBoard(this.board.board, this.config.sprites, this.board);
        this.attachCellEvents();
        this.setupEventListeners();
        this.ui.updateScore(this.score, this.moves, this.comboMultiplier);
        this.ui.updateTimer(this.timeLeft, this.timedMode);
        this.ui.setMode(this.timedMode);
        if (this.timedMode) this.startTimer();
    }
    
    attachCellEvents() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const startHandler = (e) => {
                if (this.isProcessing) return;
                const row = parseInt(cell.dataset.row, 10);
                const col = parseInt(cell.dataset.col, 10);
                const point = e.touches ? e.touches[0] : e;
                this.dragStart = { row, col, x: point.clientX, y: point.clientY };
                if (e.touches) e.preventDefault();
            };
            const endHandler = (e) => {
                if (this.isProcessing || !this.dragStart || this.gameOver) return;
                const point = e.changedTouches ? e.changedTouches[0] : e;
                const dx = point.clientX - this.dragStart.x;
                const dy = point.clientY - this.dragStart.y;
                const threshold = 10;
                if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
                    this.dragStart = null;
                    return;
                }
                let targetRow = this.dragStart.row;
                let targetCol = this.dragStart.col;
                if (Math.abs(dx) > Math.abs(dy)) targetCol += dx > 0 ? 1 : -1;
                else targetRow += dy > 0 ? 1 : -1;
                const maxR = this.board.board.length - 1;
                const maxC = this.board.board[0].length - 1;
                if (targetRow < 0 || targetRow > maxR || targetCol < 0 || targetCol > maxC) {
                    this.dragStart = null;
                    return;
                }
                this.swapCells(this.dragStart.row, this.dragStart.col, targetRow, targetCol);
                this.dragStart = null;
            };
            cell.addEventListener('mousedown', startHandler);
            cell.addEventListener('touchstart', startHandler, { passive: false });
            cell.addEventListener('mouseup', endHandler);
            cell.addEventListener('touchend', endHandler);
        });
    }
    
    async swapCells(row1, col1, row2, col2) {
        if (this.gameOver) return;
        const cell1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const cell2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        if (!cell1 || !cell2) return;
        const rect1 = cell1.getBoundingClientRect();
        const rect2 = cell2.getBoundingClientRect();
        const deltaX = rect2.left - rect1.left;
        const deltaY = rect2.top - rect1.top;
        await this.animations.animateSwap(cell1, cell2, deltaX, deltaY);
        const temp = this.board.board[row1][col1];
        this.board.board[row1][col1] = this.board.board[row2][col2];
        this.board.board[row2][col2] = temp;
        const { toRemove } = this.board.findMatchGroups();
        if (toRemove.length > 0) {
            this.moves++;
            this.selectedCell = null;
            this.animations.resetSwapAnimation(cell1, cell2);
            this.ui.renderBoard(this.board.board, this.config.sprites, this.board);
            this.attachCellEvents();
            this.ui.updateCellSelection(this.selectedCell);
            await this.animations.sleep(100);
            this.processMatches();
        } else {
            const t = this.board.board[row1][col1];
            this.board.board[row1][col1] = this.board.board[row2][col2];
            this.board.board[row2][col2] = t;
            cell1.style.transform = '';
            cell2.style.transform = '';
            await this.animations.sleep(this.config.swapAnimationDuration);
            this.animations.resetSwapAnimation(cell1, cell2);
            this.ui.renderBoard(this.board.board, this.config.sprites, this.board);
            this.attachCellEvents();
            this.selectedCell = null;
            this.ui.updateCellSelection(this.selectedCell);
        }
    }
    
    async processMatches() {
        this.isProcessing = true;
        this.comboMultiplier = 1;
        const gameBoard = document.getElementById('game-board');
        while (true) {
            const { toRemove, specialUpdates } = this.board.findMatchGroups();
            if (toRemove.length === 0 && specialUpdates.length === 0) break;
            this.comboMultiplier = Math.max(1, this.comboMultiplier);
            if (this.comboMultiplier >= 2) {
                gameBoard.classList.add('combo-shake');
                gameBoard.addEventListener('animationend', () => gameBoard.classList.remove('combo-shake'), { once: true });
            }
            specialUpdates.forEach(({ row, col, value }) => {
                this.board.board[row][col] = value;
            });
            const toRemoveExpanded = this.board.expandSpecialChains(toRemove);
            const removedSet = new Set(toRemoveExpanded.map(({ row, col }) => `${row},${col}`));
            toRemoveExpanded.forEach(({ row, col }) => {
                this.board.board[row][col] = 0;
            });
            const totalRemoved = toRemoveExpanded.length;
            this.score += totalRemoved * this.config.scorePerMatch * this.comboMultiplier;
            this.ui.updateScore(this.score, this.moves, this.comboMultiplier);
            await this.animations.animateRemoval(toRemoveExpanded);
            this.ui.renderBoard(this.board.board, this.config.sprites, this.board);
            this.attachCellEvents();
            const specialToAnimate = specialUpdates.filter(
                ({ row, col }) => !removedSet.has(`${row},${col}`)
            );
            if (specialToAnimate.length) {
                await this.animations.animateSpecialCreate(specialToAnimate);
            }
            const dropMap = this.ui.getDropMap(this.board.board, this.config.boardSize);
            this.board.dropCrystals();
            await this.animations.animateFall(dropMap);
            const spawnCells = this.board.fillEmptyCells();
            this.ui.renderBoard(this.board.board, this.config.sprites, this.board);
            this.attachCellEvents();
            await this.animations.animateSpawn(spawnCells);
            this.comboMultiplier++;
            await this.animations.sleep(200);
        }
        this.ui.updateScore(this.score, this.moves, 1);
        this.comboMultiplier = 1;
        this.isProcessing = false;
    }
    
    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('mode-moves-btn').addEventListener('click', () => this.setTimedMode(false));
        document.getElementById('mode-time-btn').addEventListener('click', () => this.setTimedMode(true));
    }

    setTimedMode(timed) {
        if (this.isProcessing) return;
        this.timedMode = timed;
        this.ui.setMode(this.timedMode);
        this.newGame();
    }

    startTimer() {
        this.stopTimer();
        this.timeLeft = this.config.timeLimitSeconds || 60;
        this.ui.updateTimer(this.timeLeft, true);
        this.timerId = setInterval(() => this.tickTimer(), 1000);
    }

    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    tickTimer() {
        if (!this.timedMode || this.gameOver) return;
        this.timeLeft--;
        this.ui.updateTimer(this.timeLeft, true);
        if (this.timeLeft <= 0) {
            this.stopTimer();
            this.gameOver = true;
            this.ui.showTimeUp(this.score);
        }
    }

    showHint() {
        if (this.isProcessing || this.gameOver) return;
        this.ui.clearHint();
        const move = this.board.findFirstMove();
        if (!move) return;
        const c1 = document.querySelector(`[data-row="${move.row1}"][data-col="${move.col1}"]`);
        const c2 = document.querySelector(`[data-row="${move.row2}"][data-col="${move.col2}"]`);
        if (c1) c1.classList.add('hint');
        if (c2) c2.classList.add('hint');
        setTimeout(() => this.ui.clearHint(), 2500);
    }
    
    newGame() {
        this.stopTimer();
        this.gameOver = false;
        this.score = 0;
        this.moves = 0;
        this.comboMultiplier = 1;
        this.selectedCell = null;
        this.isProcessing = false;
        this.timeLeft = this.config.timeLimitSeconds || 60;
        this.board.createBoard();
        this.ui.renderBoard(this.board.board, this.config.sprites, this.board);
        this.attachCellEvents();
        this.ui.updateScore(this.score, this.moves, 1);
        this.ui.updateTimer(this.timeLeft, this.timedMode);
        this.ui.setMode(this.timedMode);
        this.ui.clearHint();
        if (this.timedMode) this.startTimer();
    }
}
