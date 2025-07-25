export default class GameEngine {
    constructor(renderer, interpreter, uiManager) {
        this.renderer = renderer;
        this.interpreter = interpreter;
        this.uiManager = uiManager;

        this.levels = [];
        this.currentLevelIndex = 0;
        this.gameState = {}; 
        this.isExecuting = false;
        this.playerProgress = {
            completedLevels: [],
            levelStars: {},
            currentLevel: 0,
            totalStars: 0
        };
    }

    async start() {
        await this.loadLevels();
        this.loadPlayerProgress();
        
        // Set up level selection callback
        this.uiManager.setLevelSelectedCallback((levelIndex) => {
            this.selectLevel(levelIndex);
        });
        
        if (!this.uiManager.checkWelcomeStatus()) {
            return;
        }
        
        this.loadCurrentLevel();
    }

    startGame() {
        this.uiManager.markWelcomeSeen();
        this.uiManager.hideWelcomeModal();
        this.loadCurrentLevel();
    }

    async loadLevels() {
        const response = await fetch('./js/data/levels.json');
        this.levels = await response.json();
    }

    loadPlayerProgress() {
        const savedProgress = localStorage.getItem('cqj_playerProgress');
        if (savedProgress) {
            this.playerProgress = JSON.parse(savedProgress);
            this.currentLevelIndex = this.playerProgress.currentLevel;
        }
    }

    savePlayerProgress() {
        this.playerProgress.currentLevel = this.currentLevelIndex;
        localStorage.setItem('cqj_playerProgress', JSON.stringify(this.playerProgress));
        // Keep old save format for compatibility
        localStorage.setItem('cqj_currentLevel', this.currentLevelIndex);
    }

    loadCurrentLevel() {
        const levelData = this.levels[this.currentLevelIndex];
        if (!levelData) {
            console.error("No more levels!");
            this.showGameComplete();
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

    selectLevel(levelIndex) {
        // Allow selection of any level if all levels are completed, otherwise only unlocked levels
        const allLevelsCompleted = this.playerProgress.completedLevels.length === this.levels.length;
        const maxUnlocked = this.getMaxUnlockedLevel();
        
        if (allLevelsCompleted || levelIndex <= maxUnlocked) {
            this.currentLevelIndex = levelIndex;
            this.savePlayerProgress();
            this.loadCurrentLevel();
            // Hide any open modals
            this.uiManager.hideGameCompleteModal();
            this.uiManager.hideLevelSelectModal();
        } else {
            this.uiManager.showError("This level is still locked! Complete previous levels to unlock it.");
        }
    }

    getMaxUnlockedLevel() {
        // If all levels are completed, unlock everything
        if (this.playerProgress.completedLevels.length === this.levels.length) {
            return this.levels.length - 1;
        }
        
        // Otherwise, players can access current level + all completed levels
        return Math.max(this.playerProgress.currentLevel, 
                       this.playerProgress.completedLevels.length > 0 ? 
                       Math.max(...this.playerProgress.completedLevels) : 0);
    }

    loadNextLevel() {
        if (this.currentLevelIndex < this.levels.length - 1) {
            this.currentLevelIndex++;
            this.savePlayerProgress();
            this.loadCurrentLevel();
            this.uiManager.hideLevelCompleteModal();
        } else {
            this.showGameComplete();
        }
    }

    replayLevel() {
        this.loadCurrentLevel();
        this.uiManager.hideLevelCompleteModal();
        // Clear the code editor
        const codeEditor = document.getElementById('code-editor');
        codeEditor.value = '';
    }

    showLevelSelect() {
        this.uiManager.showLevelSelectModal(this.levels, this.playerProgress, this.currentLevelIndex);
    }

    restartGame() {
        if (confirm('Are you sure you want to restart the entire game? This will reset all your progress!')) {
            this.resetAllProgress();
            this.currentLevelIndex = 0;
            this.savePlayerProgress();
            this.loadCurrentLevel();
            this.uiManager.hideGameCompleteModal();
            this.uiManager.hideLevelSelectModal();
        }
    }

    resetAllProgress() {
        this.playerProgress = {
            completedLevels: [],
            levelStars: {},
            currentLevel: 0,
            totalStars: 0
        };
        localStorage.removeItem('cqj_playerProgress');
        localStorage.removeItem('cqj_currentLevel');
        localStorage.removeItem('cqj_hasSeenWelcome');
    }

    shareAchievement() {
        const totalStars = Object.values(this.playerProgress.levelStars).reduce((sum, stars) => sum + stars, 0);
        const completedLevels = this.playerProgress.completedLevels.length;
        this.uiManager.showShareDialog(totalStars, completedLevels);
    }

    showGameComplete() {
        const totalStars = Object.values(this.playerProgress.levelStars).reduce((sum, stars) => sum + stars, 0);
        this.uiManager.showGameCompleteModal(totalStars);
        
        // Auto-trigger share dialog after a brief delay
        setTimeout(() => {
            const completedLevels = this.playerProgress.completedLevels.length;
            this.uiManager.showShareDialog(totalStars, completedLevels);
        }, 3000); // 3 second delay to let them enjoy the completion modal first
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
             
            const goalIndex = this.gameState.goals.findIndex(g => g.x === this.gameState.robot.x && g.y === this.gameState.robot.y);
            if (goalIndex > -1) {
                this.renderer.collectGoal(this.gameState.goals[goalIndex]);
                this.gameState.goals.splice(goalIndex, 1);
            }

            if (!this.isExecuting) break;
        }
    }
    
    checkGameState() {
        if (this.gameState.goals.length === 0) {
            const level = this.levels[this.currentLevelIndex];
            const stars = this.calculateStars(level.optimalMoves, this.gameState.moves);
            
            // Update player progress
            if (!this.playerProgress.completedLevels.includes(this.currentLevelIndex)) {
                this.playerProgress.completedLevels.push(this.currentLevelIndex);
            }
            
            // Update best stars for this level
            const currentBest = this.playerProgress.levelStars[this.currentLevelIndex] || 0;
            if (stars > currentBest) {
                this.playerProgress.levelStars[this.currentLevelIndex] = stars;
            }
            
            // Update current level if progressing
            if (this.currentLevelIndex >= this.playerProgress.currentLevel) {
                this.playerProgress.currentLevel = Math.min(this.currentLevelIndex + 1, this.levels.length - 1);
            }
            
            this.savePlayerProgress();
            
            // Check if this is the last level
            const isLastLevel = this.currentLevelIndex === this.levels.length - 1;
            
            if (isLastLevel && this.playerProgress.completedLevels.length === this.levels.length) {
                // Show game complete modal after a short delay
                setTimeout(() => {
                    this.showGameComplete();
                }, 2000);
            }
            
            this.uiManager.showLevelCompleteModal(stars, isLastLevel);
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
        const level = this.levels[this.currentLevelIndex];
        const hintData = this.getEnhancedHintData(level);
        this.uiManager.showHintModal(hintData);
    }

    getEnhancedHintData(level) {
        const baseHints = {
            1: {
                text: "Hi there, Commander! 👋 Your robot just needs to walk forward to reach the goal. Think of it like taking steps!",
                tips: [
                    "Use the moveForward() command",
                    "Count how many steps you need",
                    "Click the 'moveForward()' button to add it to your code"
                ],
                visual: "🤖 ➡️ ➡️ ➡️ ➡️ 🎯"
            },
            2: {
                text: "Uh oh! There's a wall in your way! 🧱 You'll need to go around it. Think about which direction to turn!",
                tips: [
                    "Go up first, then turn right",
                    "Use turnRight() to change direction",
                    "Remember: up, right, right, right, down!"
                ],
                visual: "🤖⬆️➡️🧱<br/>⬆️⬆️⬆️➡️🎯"
            },
            3: {
                text: "Wow, you need to move forward many times! 😅 That's a lot of typing. Is there a smarter way?",
                tips: [
                    "Use repeat() to do the same thing multiple times",
                    "Put moveForward() inside repeat(4) { }",
                    "Count the goals - that's how many times to repeat!"
                ],
                visual: "🤖 🔄×4 🎯🎯🎯🎯"
            },
            4: {
                text: "That's a really long walk! 🚶‍♂️ Writing moveForward() 9 times would be tedious.",
                tips: [
                    "Use repeat(9) { moveForward() }",
                    "Count the distance from start to goal",
                    "This is perfect for practicing loops!"
                ],
                visual: "🤖 ➡️➡️➡️➡️➡️➡️➡️➡️➡️ 🎯"
            },
            5: {
                text: "Time to make your first L-shaped turn! 📐 Think about the path you need to take.",
                tips: [
                    "Move forward 3 steps first",
                    "Turn left to face north",
                    "Move forward 3 more steps"
                ],
                visual: "🤖➡️➡️➡️<br/>⬆️⬆️⬆️🎯"
            },
            6: {
                text: "This needs a U-turn! 🔄 You'll need to turn twice to get back to the left side.",
                tips: [
                    "Go right first, then turn left (north)",
                    "Go up, then turn left again (west)",
                    "Now go left to reach the goal"
                ],
                visual: "🤖➡️➡️➡️➡️<br/>⬆️⬆️⬆️<br/>⬅️⬅️⬅️🎯"
            },
            7: {
                text: "This is a perfect example of when loops save time! ⏰",
                tips: [
                    "Use repeat(11) { moveForward() }",
                    "Much shorter than typing 11 commands!",
                    "Loops make code cleaner and easier to read"
                ],
                visual: "🤖 🔄×11 🎯"
            },
            8: {
                text: "Walk around the perimeter! 🏃‍♂️ This is like doing laps around a track.",
                tips: [
                    "Use repeat(4) for the 4 sides",
                    "Each side: move forward 3 times, then turn right",
                    "Pattern: repeat(4) { repeat(3) { moveForward() } turnRight() }"
                ],
                visual: "🤖➡️➡️➡️<br/>⬇️⬇️⬇️<br/>⬅️⬅️⬅️<br/>⬆️⬆️⬆️"
            },
            9: {
                text: "Navigate around the wall! 🧱 Plan your route to avoid the obstacles.",
                tips: [
                    "Go around the wall by going north early",
                    "Turn right when you clear the wall",
                    "Then head east to the goal"
                ],
                visual: "🤖⬆️⬆️⬆️➡️➡️➡️🎯<br/>🧱🧱🧱"
            },
            10: {
                text: "Multiple obstacles mean multiple detours! 🗺️ Plan carefully.",
                tips: [
                    "Navigate around each obstacle group",
                    "Go north first to avoid the bottom obstacles",
                    "Then weave east and north around the remaining walls"
                ],
                visual: "🤖⬆️➡️⬆️➡️🎯<br/>🧱🧱🧱🧱"
            },
            11: {
                text: "Stay in the narrow corridor! 🚇 The middle row is your safe path.",
                tips: [
                    "The obstacles block the top and bottom rows",
                    "Just go straight forward in the middle",
                    "Use repeat(7) { moveForward() }"
                ],
                visual: "🧱🧱🧱🧱<br/>🤖➡️➡️➡️🎯<br/>🧱🧱🧱🧱"
            },
            12: {
                text: "Collect all three goals! 🎯🎯🎯 Plan the most efficient route.",
                tips: [
                    "Start from center, visit each corner",
                    "Plan which order to visit them",
                    "Try: up-left corner, up-right corner, then bottom-right"
                ],
                visual: "🎯🤖🎯<br/>🤖starts here<br/>🎯"
            },
            13: {
                text: "Follow the winding path! 🌊 Each goal leads to the next.",
                tips: [
                    "Move forward, turn up, forward, turn down, etc.",
                    "Follow the zigzag pattern of the goals",
                    "Think of it like connecting the dots"
                ],
                visual: "🤖🎯⬆️🎯<br/>⬇️🎯➡️🎯"
            },
            14: {
                text: "Sweep each row like reading a book! 📖 Left to right, then next line.",
                tips: [
                    "Go right across the first row",
                    "Turn down, then left across the second row",
                    "Turn down, then right across the third row"
                ],
                visual: "🤖➡️➡️➡️<br/>⬅️⬅️⬅️<br/>➡️➡️➡️"
            },
            15: {
                text: "Make a zigzag pattern! ⚡ Forward and turn, forward and turn.",
                tips: [
                    "Alternate between moving forward and turning",
                    "Watch the direction you're facing",
                    "Follow the staircase pattern of goals"
                ],
                visual: "🤖➡️⬆️➡️<br/>⬆️➡️⬆️🎯"
            },
            16: {
                text: "Create a spiral pattern! 🌀 Start at the outer edge and work inward.",
                tips: [
                    "Go around the outside edge first",
                    "Then spiral inward to collect inner goals",
                    "Think of it like peeling an onion"
                ],
                visual: "🤖➡️➡️➡️➡️<br/>⬇️🌀🌀⬇️<br/>⬅️⬅️⬅️⬇️"
            },
            17: {
                text: "Multiple paths exist! 🛤️ Find the most efficient route.",
                tips: [
                    "You can go around obstacles different ways",
                    "Try going north first, then east",
                    "Look for the shortest path without obstacles"
                ],
                visual: "🤖⬆️➡️🎯<br/>🧱🧱"
            },
            18: {
                text: "The goal is surrounded! 🏰 But there's one opening - can you find it?",
                tips: [
                    "Look for the gap in the fortress wall",
                    "Enter from the bottom-left opening",
                    "Navigate: right, up, left to reach the center"
                ],
                visual: "🧱🧱🧱<br/>🧱🎯🧱<br/>🤖⬆️🧱"
            }
        };

        return baseHints[level.id] || {
            text: level.hint || "You've got this! Think step by step! 🧠✨",
            tips: [
                "Look at where your robot needs to go",
                "Break the problem into small steps",
                "Use the command buttons to help you"
            ],
            visual: "🤖💭🎯"
        };
    }

    showSolution() {
        const level = this.levels[this.currentLevelIndex];
        const solutions = {
            1: "moveForward()\nmoveForward()\nmoveForward()\nmoveForward()",
            
            2: "moveForward()\nmoveForward()\nmoveForward()\nmoveForward()\nturnRight()\nmoveForward()\nmoveForward()\nmoveForward()\nmoveForward()",
            
            3: "repeat(4) {\n  moveForward()\n}",
            
            4: "repeat(9) {\n  moveForward()\n}",
            
            5: "repeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}",
            
            // FIXED: Level 6 - Corrected final segment to 3 moves (not 4)
            6: "repeat(4) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}",
            
            7: "repeat(11) {\n  moveForward()\n}",
            
            8: "repeat(4) {\n  repeat(3) {\n    moveForward()\n  }\n  turnRight()\n}",
            
            9: "moveForward()\nturnLeft()\nmoveForward()\nmoveForward()\nmoveForward()\nturnRight()\nmoveForward()\nmoveForward()\nmoveForward()\nmoveForward()\nmoveForward()",
            
            10: "moveForward()\nturnLeft()\nmoveForward()\nmoveForward()\nmoveForward()\nturnRight()\nmoveForward()\nmoveForward()\nturnRight()\nmoveForward()\nmoveForward()\nturnLeft()\nmoveForward()\nmoveForward()",
            
            11: "repeat(7) {\n  moveForward()\n}",
            
            12: "turnLeft()\nmoveForward()\nmoveForward()\nturnLeft()\nmoveForward()\nmoveForward()\nturnRight()\nmoveForward()\nmoveForward()\nmoveForward()\nmoveForward()\nturnRight()\nmoveForward()\nmoveForward()\nturnRight()\nmoveForward()\nmoveForward()",
            
            13: "moveForward()\nturnLeft()\nmoveForward()\nturnRight()\nmoveForward()\nturnRight()\nmoveForward()\nturnLeft()\nmoveForward()",
            
            // FIXED: Level 14 - Corrected final row to have 3 moves
            14: "repeat(3) {\n  moveForward()\n}\nturnRight()\nmoveForward()\nturnRight()\nrepeat(3) {\n  moveForward()\n}\nturnLeft()\nmoveForward()\nturnLeft()\nrepeat(3) {\n  moveForward()\n}",
            
            15: "moveForward()\nturnLeft()\nmoveForward()\nturnRight()\nmoveForward()\nturnLeft()\nmoveForward()\nturnRight()\nmoveForward()\nturnLeft()\nmoveForward()\nturnRight()\nmoveForward()",
            
            // FIXED: Level 16 - Removed extra moves, spiral ends at center (2,2)
            16: "repeat(4) {\n  moveForward()\n}\nturnLeft()\nrepeat(4) {\n  moveForward()\n}\nturnLeft()\nrepeat(3) {\n  moveForward()\n}\nturnLeft()\nrepeat(2) {\n  moveForward()\n}\nturnLeft()\nmoveForward()",
            
            17: "repeat(5) {\n  moveForward()\n}\nturnLeft()\nrepeat(5) {\n  moveForward()\n}",
            
            // FIXED: Level 18 - Completely new solution through the gap
            18: "moveForward()\nmoveForward()\nturnLeft()\nmoveForward()\nmoveForward()\nturnRight()\nmoveForward()"
        };

        const solution = solutions[level.id];
        if (solution) {
            const codeEditor = document.getElementById('code-editor');
            codeEditor.value = solution;
            this.uiManager.hideHintModal();
        } else {
            this.uiManager.hideHintModal();
            this.uiManager.showError("Solution not available for this level. Try using the hints!");
        }
    }

    closeWelcome() {
        this.uiManager.hideWelcomeModal();
        this.loadCurrentLevel();
    }
}