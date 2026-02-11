// Анимации игры

class GameAnimations {
    constructor(config) {
        this.config = config;
    }
    
    // Вспомогательная функция для задержки
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Анимация удаления кристаллов
    async animateRemoval(matches) {
        matches.forEach(match => {
            const cell = document.querySelector(
                `[data-row="${match.row}"][data-col="${match.col}"]`
            );
            if (cell) {
                cell.classList.add('removing');
            }
        });
        
        await this.sleep(this.config.removalAnimationDuration);
    }
    
    // Анимация падения кристаллов
    async animateFall(dropMap) {
        const gameBoard = document.getElementById('game-board');
        const cellSize = gameBoard.offsetWidth / this.config.boardSize;
        const gap = 5;
        
        dropMap.forEach((data, source) => {
            const [sourceRow, sourceCol] = source.split('-').map(Number);
            const rowsToFall = data.newRow - sourceRow;
            const deltaY = rowsToFall * (cellSize + gap);
            
            data.cell.classList.add('falling');
            data.cell.style.transform = `translateY(${deltaY}px)`;
        });
        
        await this.sleep(this.config.fallAnimationDuration);
    }
    
    // Анимация появления новых кристаллов
    async animateSpawn(spawnCells) {
        // Ждем следующий кадр анимации для гарантии рендеринга
        await new Promise(resolve => requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        }));
        
        spawnCells.forEach(({ row, col }) => {
            const cell = document.querySelector(
                `[data-row="${row}"][data-col="${col}"]`
            );
            if (cell) {
                cell.classList.add('spawning');
            }
        });
        
        await this.sleep(this.config.spawnAnimationDuration);
        
        // Убираем класс анимации
        spawnCells.forEach(({ row, col }) => {
            const cell = document.querySelector(
                `[data-row="${row}"][data-col="${col}"]`
            );
            if (cell) {
                cell.classList.remove('spawning');
            }
        });
    }
    
    // Анимация обмена кристаллов
    async animateSwap(cell1, cell2, deltaX, deltaY) {
        cell1.classList.add('swapping');
        cell2.classList.add('swapping');
        
        cell1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        cell2.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
        
        await this.sleep(this.config.swapAnimationDuration);
    }
    
    // Сброс анимации обмена
    resetSwapAnimation(cell1, cell2) {
        cell1.style.transform = '';
        cell2.style.transform = '';
        cell1.classList.remove('swapping');
        cell2.classList.remove('swapping');
    }
}
