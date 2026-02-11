// Управление интерфейсом

class GameUI {
    constructor(config) {
        this.config = config;
    }
    
    // Отрисовка игрового поля
    renderBoard(board, sprites, onCellClick) {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const cell = document.createElement('div');
                cell.className = `cell crystal-${board[row][col]}`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Создаем изображение
                const img = document.createElement('img');
                img.src = sprites[board[row][col] - 1];
                img.alt = `Crystal ${board[row][col]}`;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                cell.appendChild(img);
                
                cell.addEventListener('click', () => onCellClick(row, col));
                gameBoard.appendChild(cell);
            }
        }
    }
    
    // Обновление визуального выделения ячеек
    updateCellSelection(selectedCell) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('selected');
        });
        
        if (selectedCell) {
            const cell = document.querySelector(
                `[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`
            );
            if (cell) {
                cell.classList.add('selected');
            }
        }
    }
    
    // Обновление интерфейса (счет, ходы)
    updateScore(score, moves) {
        document.getElementById('score').textContent = score;
        document.getElementById('moves').textContent = moves;
    }
    
    // Получение карты падения для анимации
    getDropMap(board, boardSize) {
        const dropMap = new Map();
        
        for (let col = 0; col < boardSize; col++) {
            let writeIndex = boardSize - 1;
            
            for (let row = boardSize - 1; row >= 0; row--) {
                if (board[row][col] !== 0) {
                    if (writeIndex !== row) {
                        const cell = document.querySelector(
                            `[data-row="${row}"][data-col="${col}"]`
                        );
                        if (cell) {
                            dropMap.set(`${row}-${col}`, {
                                newRow: writeIndex,
                                newCol: col,
                                cell: cell
                            });
                        }
                    }
                    writeIndex--;
                }
            }
        }
        
        return dropMap;
    }
}
