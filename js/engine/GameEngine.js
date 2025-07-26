export default class GameEngine {
    constructor(renderer, interpreter, uiManager) {
        this.renderer = renderer;
        this.interpreter = interpreter;
        this.uiManager = uiManager;
        this.levels = [];
        this.currentLevelIndex = 0;
        this.gameState = null;
        this.playerProgress = this.loadProgress();
        this.isExecuting = false;
    }

    async start() {
        await this.loadLevels();
        this.currentLevelIndex = this.playerProgress.currentLevel || 0;
        this.loadCurrentLevel();
        this.uiManager.setLevelSelectedCallback((levelIndex) => {
            this.loadLevel(levelIndex);
        });
        if (this.uiManager.checkWelcomeStatus()) {
            // If welcome has been seen, no action needed
        }
    }

    async loadLevels() {
        try {
            const response = await fetch('./js/data/levels.json');
            this.levels = await response.json();
        } catch (error) {
            console.error("Failed to load levels:", error);
            this.uiManager.showError("Error: Could not load game levels.");
        }
    }

    loadCurrentLevel() {
        this.loadLevel(this.currentLevelIndex);
    }

    loadLevel(levelIndex) {
        if (levelIndex >= this.levels.length) {
            this.handleGameComplete();
            return;
        }
        this.currentLevelIndex = levelIndex;
        this.playerProgress.currentLevel = levelIndex;
        this.saveProgress();

        const level = this.levels[levelIndex];
        this.gameState = this.createInitialGameState(level);
        this.renderer.renderLevel(this.gameState);
        this.uiManager.updateLevelIndicator(level.id);
        this.uiManager.clearError();
        this.uiManager.hideLevelCompleteModal();
        this.uiManager.setControlsState(true);
        document.getElementById('code-editor').value = '';
    }

    createInitialGameState(level) {
        const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
        return {
            gridSize: { ...level.gridSize },
            robot: { ...level.start },
            goals: deepClone(level.goals),
            initialGoals: deepClone(level.goals),
            obstacles: deepClone(level.obstacles),
            moves: 0
        };
    }

    async runCode(code) {
        if (this.isExecuting) return;
        this.isExecuting = true;
        this.uiManager.setControlsState(false);
        this.uiManager.clearError();

        this.loadCurrentLevel();
        await new Promise(r => setTimeout(r, 100));

        const result = this.interpreter.parse(code);
        if (!result.success) {
            this.uiManager.showError(result.error);
            this.isExecuting = false;
            this.uiManager.setControlsState(true);
            return;
        }

        for (const action of result.actions) {
            await this.executeAction(action);
            if (!this.isExecuting) break; 
        }

        if (this.isExecuting) {
            this.checkCompletion(result.actions.length);
        }
        this.isExecuting = false;
        this.uiManager.setControlsState(true);
    }

    async executeAction(action) {
        let newPos = { ...this.gameState.robot };
        this.gameState.moves++;

        switch (action) {
            case 'moveForward':
                if (newPos.direction === 'north') newPos.y--;
                else if (newPos.direction === 'east') newPos.x++;
                else if (newPos.direction === 'south') newPos.y++;
                else if (newPos.direction === 'west') newPos.x--;
                break;
            case 'turnLeft':
                newPos.direction = this.turn('left', newPos.direction);
                break;
            case 'turnRight':
                newPos.direction = this.turn('right', newPos.direction);
                break;
        }

        if (this.isValidMove(newPos)) {
            this.gameState.robot = newPos;
            await this.renderer.updateRobot(this.gameState.robot);
            this.checkGoal();
        } else {
            this.renderer.showRobotError();
            this.uiManager.showError("Ouch! Can't move there.");
            this.isExecuting = false;
        }
    }

    turn(turnDir, currentDir) {
        const directions = ['north', 'east', 'south', 'west'];
        const index = directions.indexOf(currentDir);
        const newIndex = (turnDir === 'left')
            ? (index - 1 + 4) % 4
            : (index + 1) % 4;
        return directions[newIndex];
    }

    isValidMove({ x, y }) {
        const { gridSize, obstacles } = this.gameState;
        if (x < 0 || x >= gridSize.width || y < 0 || y >= gridSize.height) {
            return false;
        }
        if (obstacles.some(o => o.x === x && o.y === y)) {
            return false;
        }
        return true;
    }

    checkGoal() {
        const { robot, goals } = this.gameState;
        const goalIndex = goals.findIndex(g => g.x === robot.x && g.y === robot.y);
        if (goalIndex !== -1) {
            const collectedGoal = goals.splice(goalIndex, 1)[0];
            this.renderer.collectGoal(collectedGoal);
        }
    }

    checkCompletion(codeLength) {
        if (this.gameState.goals.length === 0) {
            const level = this.levels[this.currentLevelIndex];
            const stars = this.calculateStars(codeLength, level.optimalMoves);
            
            this.updateProgress(this.currentLevelIndex, stars);
            
            const isLastLevel = this.currentLevelIndex === this.levels.length - 1;
            this.uiManager.showLevelCompleteModal(stars, isLastLevel);
        } else {
            this.uiManager.showError("Not quite! Keep trying.");
        }
    }

    calculateStars(moves, optimalMoves) {
        if (moves <= optimalMoves) return 3;
        if (moves <= optimalMoves * 1.5) return 2;
        return 1;
    }

    loadNextLevel() {
        this.uiManager.hideLevelCompleteModal();
        this.loadLevel(this.currentLevelIndex + 1);
    }

    replayLevel() {
        this.uiManager.hideLevelCompleteModal();
        this.loadCurrentLevel();
    }

    showLevelSelect() {
        this.uiManager.showLevelSelectModal(this.levels, this.playerProgress, this.currentLevelIndex);
    }

    handleGameComplete() {
        const totalStars = Object.values(this.playerProgress.levelStars).reduce((sum, s) => sum + s, 0);
        this.uiManager.showGameCompleteModal(totalStars);
    }

    restartGame() {
        this.uiManager.hideGameCompleteModal();
        this.loadLevel(0);
    }

    resetAllProgress() {
        this.playerProgress = { currentLevel: 0, completedLevels: [], levelStars: {} };
        this.saveProgress();
    }

    shareAchievement() {
        this.uiManager.showShareDialog(
            Object.values(this.playerProgress.levelStars).reduce((s, v) => s + v, 0),
            this.playerProgress.completedLevels.length
        );
    }

    showHint() {
        const level = this.levels[this.currentLevelIndex];
        this.uiManager.showHintModal({
            text: level.hint,
            visual: null,
            tips: [
                "Check your robot's starting direction.",
                "Are there any obstacles in the way?",
                "Can `repeat()` make your code shorter?"
            ]
        });
    }

    showSolution() {
        const level = this.levels[this.currentLevelIndex];
        const solutions = {
            1: "moveForward()\nmoveForward()\nmoveForward()\nmoveForward()",
            2: "repeat(4) {\n  moveForward()\n}\nturnRight()\nrepeat(4) {\n  moveForward()\n}",
            3: "repeat(4) {\n  moveForward()\n}",
            4: "repeat(9) {\n  moveForward()\n}",
            5: "repeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}",
            6: "repeat(4) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(4) {\n  moveForward()\n}",
            7: "repeat(11) {\n  moveForward()\n}",
            8: "repeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(2) {\n  moveForward()\n}",
            9: "moveForward()\nturnLeft()\nrepeat(4) {\n  moveForward()\n}\nturnRight()\nrepeat(4) {\n  moveForward()\n}",
            10: "turnLeft()\nrepeat(4) {\n  moveForward()\n}\nturnRight()\nrepeat(6) {\n  moveForward()\n}",
            11: "repeat(7) {\n  moveForward()\n}",
            12: "repeat(2) {\n  moveForward()\n}\nturnLeft()\nrepeat(2) {\n  moveForward()\n}\nturnRight()\nturnRight()\nrepeat(4) {\n  moveForward()\n}\nturnRight()\nrepeat(4) {\n  moveForward()\n}",
            
            // Level 13: Complete and correct zigzag path for all 5 goals
            13: "moveForward()\nturnLeft()\nmoveForward()\nturnRight()\nmoveForward()\nturnRight()\nmoveForward()\nmoveForward()\nturnLeft()\nmoveForward()\nturnLeft()\nmoveForward()\nturnRight()\nmoveForward()\nturnRight()\nmoveForward()\nturnLeft()\nmoveForward()\nturnLeft()\nmoveForward()",
            
            // Level 14 FIXED: Complete grid sweep
            14: "repeat(3) {\n  moveForward()\n}\nturnRight()\nmoveForward()\nturnRight()\nrepeat(2) {\n  moveForward()\n}\nturnLeft()\nmoveForward()\nturnLeft()\nrepeat(2) {\n  moveForward()\n}",
            
            // Level 15 FIXED: Complete zigzag staircase
            15: "repeat(3) {\n  moveForward()\n  turnLeft()\n  moveForward()\n  turnRight()\n}\nmoveForward()",
            
            // Level 16 FIXED: True spiral path for all 18 goals
            16: "repeat(4) {\n  moveForward()\n}\nturnLeft()\nrepeat(4) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(2) {\n  moveForward()\n}\nturnLeft()\nrepeat(2) {\n  moveForward()\n}\nturnLeft()\nmoveForward()\nturnLeft()\nmoveForward()\nturnLeft()\nmoveForward()",
            
            // Level 17 FIXED: Optimal path avoiding obstacles
            17: "repeat(5) {\n  moveForward()\n}\nturnLeft()\nrepeat(5) {\n  moveForward()\n}",
            
            // Level 18 FIXED: Enter fortress center
            18: "repeat(2) {\n  moveForward()\n}\nturnLeft()\nrepeat(2) {\n  moveForward()\n}"
        };

        const solution = solutions[level.id];
        if (solution) {
            document.getElementById('code-editor').value = solution;
            this.uiManager.hideHintModal();
        } else {
            this.uiManager.hideHintModal();
            this.uiManager.showError("Solution not available for this level.");
        }
    }
    
    startGame() {
        this.uiManager.hideWelcomeModal();
        this.uiManager.markWelcomeSeen();
        this.loadCurrentLevel();
    }

    closeWelcome() {
        this.uiManager.hideWelcomeModal();
        this.uiManager.markWelcomeSeen();
        this.loadCurrentLevel();
    }

    loadProgress() {
        const saved = localStorage.getItem('cqj_progress');
        if (saved) {
            return JSON.parse(saved);
        }
        return { currentLevel: 0, completedLevels: [], levelStars: {} };
    }

    saveProgress() {
        localStorage.setItem('cqj_progress', JSON.stringify(this.playerProgress));
    }

    updateProgress(levelIndex, stars) {
        if (!this.playerProgress.completedLevels.includes(levelIndex)) {
            this.playerProgress.completedLevels.push(levelIndex);
        }
        const existingStars = this.playerProgress.levelStars[levelIndex] || 0;
        if (stars > existingStars) {
            this.playerProgress.levelStars[levelIndex] = stars;
        }
        this.saveProgress();
    }
}