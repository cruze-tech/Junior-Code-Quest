export default class GameEngine {
    constructor(renderer, interpreter, uiManager) {
        this.renderer = renderer;
        this.interpreter = interpreter;
        this.uiManager = uiManager;

        this.levels = [];
        this.currentLevelIndex = 0;
        this.gameState = {}; // { robot, goals, etc. }
        this.isExecuting = false;
    }

    async start() {
        await this.loadLevels();
        this.loadPlayerProgress();
        this.loadCurrentLevel();
    }

    async loadLevels() {
        const response = await fetch('./js/data/levels.json');
        this.levels = await response.json();
    }

    loadPlayerProgress() {
        const savedLevel = localStorage.getItem('cqj_currentLevel');
        if (savedLevel) {
            this.currentLevelIndex = parseInt(savedLevel, 10);
        }
    }

    savePlayerProgress() {
        localStorage.setItem('cqj_currentLevel', this.currentLevelIndex);
    }

    loadCurrentLevel() {
        const levelData = this.levels[this.currentLevelIndex];
        if (!levelData) {
            console.error("No more levels!");
            this.uiManager.showGameCompleteModal();
            return;
        }
        
        this.gameState = {
            robot: { ...levelData.start },
            goals: [...levelData.goals],
            gridSize: levelData.gridSize,
            obstacles: levelData.obstacles,
            moves: 0,
        };
        
        this.renderer.renderLevel(this.gameState);
        this.uiManager.updateLevelIndicator(this.currentLevelIndex + 1);
        this.uiManager.setControlsState(true);
        this.uiManager.clearError();
    }

    loadNextLevel() {
        this.currentLevelIndex++;
        this.savePlayerProgress();
        this.loadCurrentLevel();
        this.uiManager.hideLevelCompleteModal();
    }

    async runCode(code) {
        if (this.isExecuting) return;
        this.uiManager.clearError();
        this.isExecuting = true;
        this.uiManager.setControlsState(false);

        const result = this.interpreter.parse(code);

        if (!result.success) {
            this.uiManager.showError(result.error);
            this.resetExecution();
            return;
        }

        await this.executeCommands(result.actions);
        this.checkGameState();
        this.resetExecution();
    }

    resetExecution() {
        this.isExecuting = false;
        this.uiManager.setControlsState(true);
    }
    
    async executeCommands(actions) {
        for (const action of actions) {
            this.gameState.moves++;
            switch(action) {
                case 'moveForward':
                    await this.moveRobotForward();
                    break;
                case 'turnLeft':
                    await this.turnRobot('left');
                    break;
                case 'turnRight':
                    await this.turnRobot('right');
                    break;
            }
             // Check for goal after every move
            const goalIndex = this.gameState.goals.findIndex(g => g.x === this.gameState.robot.x && g.y === this.gameState.robot.y);
            if (goalIndex > -1) {
                this.renderer.collectGoal(this.gameState.goals[goalIndex]);
                this.gameState.goals.splice(goalIndex, 1);
            }

            if (!this.isExecuting) break; // If an error occurred and stopped execution
        }
    }
    
    checkGameState() {
        if (this.gameState.goals.length === 0) {
            const level = this.levels[this.currentLevelIndex];
            const stars = this.calculateStars(level.optimalMoves, this.gameState.moves);
            this.uiManager.showLevelCompleteModal(stars);
        } else {
             this.uiManager.showError("Not all goals were reached. Try again!");
        }
    }
    
    calculateStars(optimal, actual) {
        if (actual <= optimal) return 3;
        if (actual <= optimal * 1.5) return 2;
        return 1;
    }

    async moveRobotForward() {
        let { x, y, direction } = this.gameState.robot;
        const nextPos = { x, y };
        if (direction === 'north') nextPos.y--;
        else if (direction === 'east') nextPos.x++;
        else if (direction === 'south') nextPos.y++;
        else if (direction === 'west') nextPos.x--;

        if (this.isPositionValid(nextPos)) {
            this.gameState.robot.x = nextPos.x;
            this.gameState.robot.y = nextPos.y;
            await this.renderer.updateRobot(this.gameState.robot);
        } else {
            this.isExecuting = false;
            this.renderer.showRobotError();
            this.uiManager.showError("Ouch! Can't move there.");
        }
    }
    
    isPositionValid({x, y}) {
        const { width, height } = this.gameState.gridSize;
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        if (this.gameState.obstacles.some(o => o.x === x && o.y === y)) return false;
        return true;
    }

    async turnRobot(turnDirection) {
        const directions = ['north', 'east', 'south', 'west'];
        const currentIdx = directions.indexOf(this.gameState.robot.direction);
        const newIdx = (turnDirection === 'right')
            ? (currentIdx + 1) % 4
            : (currentIdx + 3) % 4;
        
        this.gameState.robot.direction = directions[newIdx];
        await this.renderer.updateRobot(this.gameState.robot);
    }
    
    showHint() {
        // Mock Gemini Hint
        const hint = this.levels[this.currentLevelIndex].hint || "Try your best!";
        alert(`💡 Hint: ${hint}`);
    }
}