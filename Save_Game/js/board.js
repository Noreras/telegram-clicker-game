// Логика игрового поля
// Спец-иконки: 1-5 обычные, 6-10 вертикальная линия, 11-15 горизонтальная, 16-20 крест, 21-25 бомба 5x5

const SPECIAL = { NONE: 0, VERTICAL: 1, HORIZONTAL: 2, CROSS: 3, BOMB: 4 };

class GameBoard {
    constructor(config) {
        this.boardSize = config.boardSize;
        this.colors = config.colors;
        this.board = [];
    }

    getColor(v) {
        if (!v) return 0;
        return v <= 5 ? v : ((v - 1) % 5) + 1;
    }

    getSpecialType(v) {
        if (!v || v <= 5) return SPECIAL.NONE;
        return Math.min(SPECIAL.BOMB, Math.floor((v - 6) / 5) + 1);
    }

    getEffectArea(row, col, specialType) {
        const cells = [];
        const n = this.boardSize;
        if (specialType === SPECIAL.VERTICAL) {
            for (let r = 0; r < n; r++) cells.push({ row: r, col });
        } else if (specialType === SPECIAL.HORIZONTAL) {
            for (let c = 0; c < n; c++) cells.push({ row, col: c });
        } else if (specialType === SPECIAL.CROSS) {
            for (let r = 0; r < n; r++) cells.push({ row: r, col });
            for (let c = 0; c < n; c++) cells.push({ row, col: c });
        } else if (specialType === SPECIAL.BOMB) {
            for (let dr = -2; dr <= 2; dr++)
                for (let dc = -2; dc <= 2; dc++) {
                    const r = row + dr, c = col + dc;
                    if (r >= 0 && r < n && c >= 0 && c < n) cells.push({ row: r, col: c });
                }
        }
        return cells;
    }
    
    // Создание игрового поля
    createBoard() {
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                let color;
                do {
                    color = Math.floor(Math.random() * this.colors) + 1;
                } while (this.wouldCreateMatch(row, col, color));
                this.board[row][col] = color;
            }
        }
    }
    
    wouldCreateMatch(row, col, color) {
        if (col >= 2 && this.board[row][col - 1] === color && this.board[row][col - 2] === color) return true;
        if (row >= 2 && this.board[row - 1][col] === color && this.board[row - 2][col] === color) return true;
        return false;
    }

    findMatches() {
        return this.findMatchGroups().toRemove;
    }

    specialValue(kind, color) {
        return 5 + (kind - 1) * 5 + color;
    }

    findMatchGroups() {
        const toRemove = [];
        const specialUpdates = [];
        const seen = new Set();
        const key = (r, c) => `${r},${c}`;
        const addToRemove = (r, c) => {
            const k = key(r, c);
            if (seen.has(k)) return;
            seen.add(k);
            toRemove.push({ row: r, col: c });
        };

        const hRuns = [];
        for (let row = 0; row < this.boardSize; row++) {
            let start = 0, color = this.getColor(this.board[row][0]);
            for (let col = 1; col <= this.boardSize; col++) {
                const c = col < this.boardSize ? this.getColor(this.board[row][col]) : 0;
                if (c !== color) {
                    if (color && col - start >= 3) {
                        const cells = [];
                        for (let j = start; j < col; j++) cells.push({ row, col: j });
                        hRuns.push({ color, cells });
                    }
                    start = col;
                    color = c;
                }
            }
        }
        const vRuns = [];
        for (let col = 0; col < this.boardSize; col++) {
            let start = 0, color = this.getColor(this.board[0][col]);
            for (let row = 1; row <= this.boardSize; row++) {
                const r = row < this.boardSize ? this.getColor(this.board[row][col]) : 0;
                if (r !== color) {
                    if (color && row - start >= 3) {
                        const cells = [];
                        for (let i = start; i < row; i++) cells.push({ row: i, col });
                        vRuns.push({ color, cells });
                    }
                    start = row;
                    color = r;
                }
            }
        }

        const allCells = new Set();
        hRuns.forEach(run => run.cells.forEach(c => allCells.add(key(c.row, c.col))));
        vRuns.forEach(run => run.cells.forEach(c => allCells.add(key(c.row, c.col))));

        const groups = [];
        const visited = new Set();
        for (const k of allCells) {
            if (visited.has(k)) continue;
            const [sr, sc] = k.split(',').map(Number);
            const color = this.getColor(this.board[sr][sc]);
            const stack = [[sr, sc]];
            const group = [];
            while (stack.length) {
                const [r, c] = stack.pop();
                const kk = key(r, c);
                if (visited.has(kk)) continue;
                if (!allCells.has(kk) || this.getColor(this.board[r][c]) !== color) continue;
                visited.add(kk);
                group.push({ row: r, col: c });
                stack.push([r, c - 1], [r, c + 1], [r - 1, c], [r + 1, c]);
            }
            if (group.length >= 3) groups.push({ color, cells: group });
        }

        for (const { color, cells } of groups) {
            const hasSpecial = cells.some(c => this.board[c.row][c.col] >= 6);
            if (hasSpecial) continue;

            const centerRow = Math.round(cells.reduce((s, c) => s + c.row, 0) / cells.length);
            const centerCol = Math.round(cells.reduce((s, c) => s + c.col, 0) / cells.length);
            const byRow = {}, byCol = {};
            cells.forEach(c => {
                byRow[c.row] = (byRow[c.row] || 0) + 1;
                byCol[c.col] = (byCol[c.col] || 0) + 1;
            });
            const maxHRun = Math.max(...Object.values(byRow), 0);
            const maxVRun = Math.max(...Object.values(byCol), 0);
            let specialCell = null, specialVal = 0;

            if (cells.length >= 6) {
                specialVal = this.specialValue(SPECIAL.BOMB, color);
                specialCell = { row: centerRow, col: centerCol };
            } else if (cells.length >= 5) {
                specialVal = this.specialValue(SPECIAL.CROSS, color);
                specialCell = { row: centerRow, col: centerCol };
            } else if (maxVRun >= 4) {
                const colKey = Object.keys(byCol).find(k => byCol[k] >= 4);
                const col = colKey ? parseInt(colKey, 10) : null;
                if (col != null) {
                    const rows = cells.filter(c => c.col === col).map(c => c.row).sort((a, b) => a - b);
                    specialVal = this.specialValue(SPECIAL.VERTICAL, color);
                    specialCell = { row: rows[Math.floor(rows.length / 2)], col };
                }
            } else if (maxHRun >= 4) {
                const rowKey = Object.keys(byRow).find(r => byRow[r] >= 4);
                const row = rowKey ? parseInt(rowKey, 10) : null;
                if (row != null) {
                    const cols = cells.filter(c => c.row === row).map(c => c.col).sort((a, b) => a - b);
                    specialVal = this.specialValue(SPECIAL.HORIZONTAL, color);
                    specialCell = { row, col: cols[Math.floor(cols.length / 2)] };
                }
            }

            if (specialCell) {
                specialUpdates.push({ row: specialCell.row, col: specialCell.col, value: specialVal });
                cells.forEach(c => {
                    if (c.row !== specialCell.row || c.col !== specialCell.col) addToRemove(c.row, c.col);
                });
            } else {
                cells.forEach(c => addToRemove(c.row, c.col));
            }
        }

        const newSpecialCells = new Set(specialUpdates.map(s => key(s.row, s.col)));
        for (const { color, cells } of groups) {
            const specialInGroup = cells.filter(c => this.board[c.row][c.col] >= 6);
            if (specialInGroup.length === 0) continue;
            const isNewSpecial = specialInGroup.some(c => newSpecialCells.has(key(c.row, c.col)));
            if (isNewSpecial) {
                cells.forEach(c => {
                    if (!newSpecialCells.has(key(c.row, c.col))) addToRemove(c.row, c.col);
                });
            } else {
                cells.forEach(c => addToRemove(c.row, c.col));
                specialInGroup.forEach(c => {
                    const st = this.getSpecialType(this.board[c.row][c.col]);
                    if (st) this.getEffectArea(c.row, c.col, st).forEach(p => addToRemove(p.row, p.col));
                });
            }
        }
        return { toRemove, specialUpdates };
    }

    /**
     * Ищет первый возможный ход (обмен двух соседних ячеек, дающий совпадение).
     * Возвращает { row1, col1, row2, col2 } или null.
     */
    findFirstMove() {
        const orig = this.board;
        const n = this.boardSize;
        try {
            for (let row = 0; row < n; row++) {
                for (let col = 0; col < n; col++) {
                    if (col < n - 1) {
                        this.board = orig.map(r => [...r]);
                        const t = this.board[row][col];
                        this.board[row][col] = this.board[row][col + 1];
                        this.board[row][col + 1] = t;
                        const match = this.findMatchGroups();
                        if (match.toRemove.length > 0) return { row1: row, col1: col, row2: row, col2: col + 1 };
                    }
                    if (row < n - 1) {
                        this.board = orig.map(r => [...r]);
                        const t = this.board[row][col];
                        this.board[row][col] = this.board[row + 1][col];
                        this.board[row + 1][col] = t;
                        const match = this.findMatchGroups();
                        if (match.toRemove.length > 0) return { row1: row, col1: col, row2: row + 1, col2: col };
                    }
                }
            }
            return null;
        } finally {
            this.board = orig;
        }
    }

    /**
     * Расширяет список удаляемых ячеек за счёт каскада: любая усиленная ячейка,
     * попавшая в зону взрыва, тоже активируется (добавляется её зона действия).
     * Вызывать после применения specialUpdates к доске.
     */
    expandSpecialChains(toRemove) {
        const key = (r, c) => `${r},${c}`;
        const set = new Set(toRemove.map(({ row, col }) => key(row, col)));
        let changed = true;
        while (changed) {
            changed = false;
            const entries = Array.from(set);
            for (const k of entries) {
                const [r, c] = k.split(',').map(Number);
                const v = this.board[r] && this.board[r][c];
                if (!v || v < 6) continue;
                const st = this.getSpecialType(v);
                const area = this.getEffectArea(r, c, st);
                for (const { row: rr, col: cc } of area) {
                    const kk = key(rr, cc);
                    if (!set.has(kk)) {
                        set.add(kk);
                        changed = true;
                    }
                }
            }
        }
        return Array.from(set, k => {
            const [row, col] = k.split(',').map(Number);
            return { row, col };
        });
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
