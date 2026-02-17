// Управление интерфейсом

class GameUI {
    constructor(config) {
        this.config = config;
    }
    
    // Отрисовка игрового поля (boardHelper = GameBoard для getColor/getSpecialType)
    renderBoard(boardData, sprites, boardHelper) {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        const getColor = boardHelper ? boardHelper.getColor.bind(boardHelper) : (v) => (v <= 5 ? v : ((v - 1) % 5) + 1);
        const getSpecialType = boardHelper ? boardHelper.getSpecialType.bind(boardHelper) : () => 0;

        for (let row = 0; row < boardData.length; row++) {
            for (let col = 0; col < boardData[row].length; col++) {
                const v = boardData[row][col];
                const color = getColor(v);
                const specialType = getSpecialType(v);
                const cell = document.createElement('div');
                cell.className = `cell crystal-${color}`;
                if (specialType === 1) cell.classList.add('power-vertical');
                else if (specialType === 2) cell.classList.add('power-horizontal');
                else if (specialType === 3) cell.classList.add('power-cross');
                else if (specialType === 4) cell.classList.add('power-bomb');
                if (v === 0) cell.classList.add('empty');
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (v !== 0) {
                    const img = document.createElement('img');
                    img.src = sprites[Math.max(0, color - 1)];
                    img.alt = `Crystal ${color}`;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'contain';
                    cell.appendChild(img);
                }
                
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
    
    // Обновление интерфейса (счёт, ходы, комбо)
    updateScore(score, moves, combo) {
        document.getElementById('score').textContent = score;
        document.getElementById('moves').textContent = moves;
        const comboWrap = document.getElementById('combo-wrap');
        const badge = document.getElementById('combo-badge');
        if (combo != null && combo > 1 && comboWrap && badge) {
            comboWrap.style.display = '';
            badge.textContent = 'x' + combo;
        } else if (comboWrap) {
            comboWrap.style.display = 'none';
        }
    }

    updateTimer(seconds, timedMode) {
        const wrap = document.getElementById('timer-wrap');
        const movesWrap = document.getElementById('moves-wrap');
        if (!wrap) return;
        if (timedMode) {
            wrap.style.display = '';
            if (movesWrap) movesWrap.style.display = 'none';
            let timerEl = document.getElementById('timer');
            if (!timerEl) {
                wrap.innerHTML = '<span>Время: </span><span id="timer">0:00</span>';
                timerEl = document.getElementById('timer');
            }
            if (timerEl) {
                const m = Math.floor(seconds / 60);
                const s = seconds % 60;
                timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
            }
        } else {
            wrap.style.display = 'none';
            if (movesWrap) movesWrap.style.display = '';
        }
    }

    setMode(timedMode) {
        document.getElementById('mode-moves-btn').classList.toggle('active', !timedMode);
        document.getElementById('mode-time-btn').classList.toggle('active', timedMode);
    }

    clearHint() {
        document.querySelectorAll('.cell.hint').forEach(c => c.classList.remove('hint'));
    }

    showTimeUp(finalScore) {
        const wrap = document.getElementById('timer-wrap');
        if (wrap) {
            wrap.innerHTML = '<span class="time-up">Время вышло! Очки: ' + finalScore + '</span>';
        }
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
