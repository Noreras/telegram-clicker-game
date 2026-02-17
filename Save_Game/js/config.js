// Конфигурация игры

const GameConfig = {
    boardSize: 8,
    colors: 5, // Количество типов кристаллов (по количеству иконок)
    sprites: [
        'Save_Game/sprite/diadoc-128.png',
        'Save_Game/sprite/extern-128.png',
        'Save_Game/sprite/focus-128.png',
        'Save_Game/sprite/m4d-128.png',
        'Save_Game/sprite/talk-128.png'
    ],
    scorePerMatch: 10,
    swapAnimationDuration: 450,
    fallAnimationDuration: 550,
    spawnAnimationDuration: 500,
    removalAnimationDuration: 400,
    timeLimitSeconds: 60
};
