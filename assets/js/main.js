// Точка входа - инициализация игры

document.addEventListener('DOMContentLoaded', () => {
    const board = new GameBoard(GameConfig);
    const animations = new GameAnimations(GameConfig);
    const ui = new GameUI(GameConfig);
    const game = new Match3Game(GameConfig, board, animations, ui);
});
