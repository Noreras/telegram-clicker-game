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
        this.isProcessing = false;
        
        this.init();
    }
    
    init() {
        this.board.createBoard();
        this.ui.renderBoard(this.board.board, this.config.sprites, (row, col) => this.handleCellClick(row, col));
        this.setupEventListeners();
        this.ui.updateScore(this.score, this.moves);
    }
    
    // Обработка клика по ячейке
    handleCellClick(row, col) {
        if (this.isProcessing) return;
        
        if (this.selectedCell === null) {
            // Выбор первой ячейки
            this.selectedCell = { row, col };
            this.ui.updateCellSelection(this.selectedCell);
        } else {
            // Проверка, кликнули ли на ту же самую ячейку
            if (this.selectedCell.row === row && this.selectedCell.col === col) {
                // Снимаем выделение при повторном клике на ту же ячейку
                this.selectedCell = null;
                this.ui.updateCellSelection(this.selectedCell);
                return;
            }
            
            // Выбор второй ячейки для обмена
            const selectedRow = this.selectedCell.row;
            const selectedCol = this.selectedCell.col;
            
            // Проверка, являются ли ячейки соседними
            const isAdjacent = Math.abs(row - selectedRow) + Math.abs(col - selectedCol) === 1;
            
            if (isAdjacent) {
                this.swapCells(selectedRow, selectedCol, row, col);
            } else {
                // Выбор новой ячейки
                this.selectedCell = { row, col };
                this.ui.updateCellSelection(this.selectedCell);
            }
        }
    }
    
    // Обмен кристаллов
    async swapCells(row1, col1, row2, col2) {
        const cell1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const cell2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        
        if (!cell1 || !cell2) return;
        
        // Получаем позиции ячеек
        const rect1 = cell1.getBoundingClientRect();
        const rect2 = cell2.getBoundingClientRect();
        
        // Вычисляем смещения
        const deltaX = rect2.left - rect1.left;
        const deltaY = rect2.top - rect1.top;
        
        // Анимируем обмен
        await this.animations.animateSwap(cell1, cell2, deltaX, deltaY);
        
        // Временно обмениваем в данных
        const temp = this.board.board[row1][col1];
        this.board.board[row1][col1] = this.board.board[row2][col2];
        this.board.board[row2][col2] = temp;
        
        // Проверяем, создает ли обмен совпадение
        const matches = this.board.findMatches();
        
        if (matches.length > 0) {
            this.moves++;
            this.selectedCell = null;
            
            // Сбрасываем анимацию
            this.animations.resetSwapAnimation(cell1, cell2);
            
            // Перерисовываем поле
            this.ui.renderBoard(this.board.board, this.config.sprites, (row, col) => this.handleCellClick(row, col));
            this.ui.updateCellSelection(this.selectedCell);
            
            await this.animations.sleep(100);
            this.processMatches();
        } else {
            // Отменяем обмен, если совпадений нет
            const temp = this.board.board[row1][col1];
            this.board.board[row1][col1] = this.board.board[row2][col2];
            this.board.board[row2][col2] = temp;
            
            // Возвращаем кристаллы обратно с анимацией
            cell1.style.transform = '';
            cell2.style.transform = '';
            
            await this.animations.sleep(this.config.swapAnimationDuration);
            
            // Перерисовываем поле
            this.animations.resetSwapAnimation(cell1, cell2);
            this.ui.renderBoard(this.board.board, this.config.sprites, (row, col) => this.handleCellClick(row, col));
            
            // Снимаем выделение при неудачном перемещении
            this.selectedCell = null;
            this.ui.updateCellSelection(this.selectedCell);
        }
    }
    
    // Обработка совпадений
    async processMatches() {
        this.isProcessing = true;
        
        while (true) {
            const matches = this.board.findMatches();
            
            if (matches.length === 0) {
                break;
            }
            
            // Удаляем совпадения
            matches.forEach(match => {
                this.board.board[match.row][match.col] = 0;
            });
            
            this.score += matches.length * this.config.scorePerMatch;
            this.ui.updateScore(this.score, this.moves);
            
            // Анимация удаления
            await this.animations.animateRemoval(matches);
            
            // Получаем карту падения перед обновлением данных
            const dropMap = this.ui.getDropMap(this.board.board, this.config.boardSize);
            
            // Падение кристаллов
            this.board.dropCrystals();
            
            // Анимация падения
            await this.animations.animateFall(dropMap);
            
            // Заполнение пустых ячеек
            const spawnCells = this.board.fillEmptyCells();
            
            // Перерисовываем поле с новыми кристаллами (один раз)
            this.ui.renderBoard(this.board.board, this.config.sprites, (row, col) => this.handleCellClick(row, col));
            
            // Анимация появления
            await this.animations.animateSpawn(spawnCells);
            
            // Небольшая задержка перед следующей проверкой
            await this.animations.sleep(200);
        }
        
        this.isProcessing = false;
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.newGame();
        });
    }
    
    // Новая игра
    newGame() {
        this.score = 0;
        this.moves = 0;
        this.selectedCell = null;
        this.isProcessing = false;
        this.board.createBoard();
        this.ui.renderBoard(this.board.board, this.config.sprites, (row, col) => this.handleCellClick(row, col));
        this.ui.updateScore(this.score, this.moves);
    }
}
