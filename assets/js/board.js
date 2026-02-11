// Логика игрового поля

class GameBoard {
    constructor(config) {
        this.boardSize = config.boardSize;
        this.colors = config.colors;
        this.board = [];
    }
    
    // Создание игрового поля
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                // Генерируем случайный цвет, избегая начальных совпадений
                let color;
                do {
                    color = Math.floor(Math.random() * this.colors) + 1;
                } while (this.wouldCreateMatch(row, col, color));
                
                this.board[row][col] = color;
            }
        }
    }
    
    // Проверка, создаст ли размещение совпадение
    wouldCreateMatch(row, col, color) {
        // Проверка горизонтальных совпадений
        if (col >= 2 && 
            this.board[row][col - 1] === color && 
            this.board[row][col - 2] === color) {
            return true;
        }
        
        // Проверка вертикальных совпадений
        if (row >= 2 && 
            this.board[row - 1][col] === color && 
            this.board[row - 2][col] === color) {
            return true;
        }
        
        return false;
    }
    
    // Поиск совпадений на поле
    findMatches() {
        const matches = [];
        
        // Проверка горизонтальных совпадений
        for (let row = 0; row < this.boardSize; row++) {
            let count = 1;
            let currentColor = this.board[row][0];
            
            for (let col = 1; col < this.boardSize; col++) {
                if (this.board[row][col] === currentColor) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let c = col - count; c < col; c++) {
                            matches.push({ row, col: c });
                        }
                    }
                    count = 1;
                    currentColor = this.board[row][col];
                }
            }
            
            if (count >= 3) {
                for (let c = this.boardSize - count; c < this.boardSize; c++) {
                    matches.push({ row, col: c });
                }
            }
        }
        
        // Проверка вертикальных совпадений
        for (let col = 0; col < this.boardSize; col++) {
            let count = 1;
            let currentColor = this.board[0][col];
            
            for (let row = 1; row < this.boardSize; row++) {
                if (this.board[row][col] === currentColor) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let r = row - count; r < row; r++) {
                            if (!matches.some(m => m.row === r && m.col === col)) {
                                matches.push({ row: r, col });
                            }
                        }
                    }
                    count = 1;
                    currentColor = this.board[row][col];
                }
            }
            
            if (count >= 3) {
                for (let r = this.boardSize - count; r < this.boardSize; r++) {
                    if (!matches.some(m => m.row === r && m.col === col)) {
                        matches.push({ row: r, col });
                    }
                }
            }
        }
        
        return matches;
    }
    
    // Падение кристаллов вниз
    dropCrystals() {
        for (let col = 0; col < this.boardSize; col++) {
            let writeIndex = this.boardSize - 1;
            
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== 0) {
                    if (writeIndex !== row) {
                        this.board[writeIndex][col] = this.board[row][col];
                        this.board[row][col] = 0;
                    }
                    writeIndex--;
                }
            }
        }
    }
    
    // Заполнение пустых ячеек новыми кристаллами
    fillEmptyCells() {
        const spawnCells = [];
        
        for (let col = 0; col < this.boardSize; col++) {
            for (let row = 0; row < this.boardSize; row++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = Math.floor(Math.random() * this.colors) + 1;
                    spawnCells.push({ row, col });
                }
            }
        }
        
        return spawnCells;
    }
}
