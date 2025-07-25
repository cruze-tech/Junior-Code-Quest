import GameEngine from './js/engine/GameEngine.js';
import GridRenderer from './js/components/GridRenderer.js';
import CodeInterpreter from './js/engine/CodeInterpreter.js';
import UIManager from './js/components/UIManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize core components
    const gridContainer = document.getElementById('grid-container');
    const codeEditor = document.getElementById('code-editor');
    
    const renderer = new GridRenderer(gridContainer);
    const interpreter = new CodeInterpreter();
    const uiManager = new UIManager();
    const game = new GameEngine(renderer, interpreter, uiManager);

    // 2. Setup UI event listeners that call game engine methods
    uiManager.init({
        onRun: () => {
            const code = codeEditor.value;
            game.runCode(code);
        },
        onReset: () => game.loadCurrentLevel(),
        onNextLevel: () => game.loadNextLevel(),
        onReplayLevel: () => game.replayLevel(),
        onShowLevelSelect: () => game.showLevelSelect(),
        onRestartGame: () => game.restartGame(),
        onResetProgress: () => {
            if (confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
                game.resetAllProgress();
                location.reload();
            }
        },
        onShareAchievement: () => game.shareAchievement(),
        onHint: () => game.showHint(),
        onShowSolution: () => game.showSolution(),
        onStartGame: () => game.startGame(),
        onCloseWelcome: () => game.closeWelcome(),
        onSnippetClick: (snippet) => {
            const pos = codeEditor.selectionStart;
            const text = codeEditor.value;
            codeEditor.value = text.substring(0, pos) + snippet + text.substring(pos);
            codeEditor.focus();
        }
    });

    // 3. Start the game
    game.start();
});