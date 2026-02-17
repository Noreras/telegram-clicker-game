// Анимации игры

class GameAnimations {
    constructor(config) {
        this.config = config;
    }
    
    // Вспомогательная функция для задержки
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Анимация удаления кристаллов (с частицами)
    async animateRemoval(matches) {
        const gameBoard = document.getElementById('game-board');
        matches.forEach(match => {
            const cell = document.querySelector(
                `[data-row="${match.row}"][data-col="${match.col}"]`
            );
            if (cell) {
                cell.classList.add('removing');
                this.spawnParticles(cell, 6);
            }
        });
        await this.sleep(this.config.removalAnimationDuration);
    }

    spawnParticles(cell, count) {
        const rect = cell.getBoundingClientRect();
        const board = document.getElementById('game-board');
        const boardRect = board.getBoundingClientRect();
        const cx = rect.left - boardRect.left + rect.width / 2;
        const cy = rect.top - boardRect.top + rect.height / 2;
        const colors = ['#667eea', '#764ba2', '#f5576c', '#f093fb', '#4facfe'];
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = 6 + Math.random() * 6;
            const angle = (Math.PI * 2 * i) / count + Math.random();
            const dist = 15 + Math.random() * 25;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            p.style.cssText = `
                left: ${cx}px; top: ${cy}px;
                width: ${size}px; height: ${size}px;
                margin-left: -${size/2}px; margin-top: -${size/2}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                --dx: ${dx}px; --dy: ${dy}px;
            `;
            board.appendChild(p);
            setTimeout(() => p.remove(), 420);
        }
    }

    async animateSpecialCreate(specialUpdates) {
        specialUpdates.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) cell.classList.add('special-create');
        });
        await this.sleep(500);
        specialUpdates.forEach(({ row, col }) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) cell.classList.remove('special-create');
        });
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
