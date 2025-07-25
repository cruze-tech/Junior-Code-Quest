export default class GridRenderer {
    constructor(gridContainer) {
        this.container = gridContainer;
        this.tileSize = this.getTileSize();
        // Update tile size on window resize
        window.addEventListener('resize', () => { 
            this.tileSize = this.getTileSize();
            this.updateAllObjectPositions();
        });
    }
    
    getTileSize() {
        return window.innerWidth < 480 ? 40 : 50;
    }

    updateAllObjectPositions() {
        // Update robot position
        const robotEl = document.getElementById('robot');
        if (robotEl && this.currentRobotPos) {
            robotEl.style.left = `${this.currentRobotPos.x * this.tileSize}px`;
            robotEl.style.top = `${this.currentRobotPos.y * this.tileSize}px`;
        }

        // Update goal positions
        const goals = document.querySelectorAll('.goal');
        goals.forEach((goalEl, index) => {
            if (this.currentGoals && this.currentGoals[index]) {
                const goal = this.currentGoals[index];
                goalEl.style.left = `${goal.x * this.tileSize}px`;
                goalEl.style.top = `${goal.y * this.tileSize}px`;
            }
        });

        // Update obstacle positions
        const obstacles = document.querySelectorAll('.obstacle');
        obstacles.forEach((obstacleEl, index) => {
            if (this.currentObstacles && this.currentObstacles[index]) {
                const obstacle = this.currentObstacles[index];
                obstacleEl.style.left = `${obstacle.x * this.tileSize}px`;
                obstacleEl.style.top = `${obstacle.y * this.tileSize}px`;
            }
        });
    }

    renderLevel(gameState) {
        const { gridSize, robot, goals, obstacles } = gameState;
        
        // Store current positions for resize handling
        this.currentRobotPos = robot;
        this.currentGoals = goals;
        this.currentObstacles = obstacles;
        
        this.container.innerHTML = '';
        this.container.style.gridTemplateColumns = `repeat(${gridSize.width}, ${this.tileSize}px)`;
        this.container.style.width = `${gridSize.width * this.tileSize}px`;
        this.container.style.height = `${gridSize.height * this.tileSize}px`;

        for (let i = 0; i < gridSize.width * gridSize.height; i++) {
            const tile = document.createElement('div');
            tile.className = 'grid-tile';
            tile.style.width = `${this.tileSize}px`;
            tile.style.height = `${this.tileSize}px`;
            this.container.appendChild(tile);
        }

        goals.forEach(g => this.createObject('goal', g.x, g.y));
        obstacles.forEach(o => this.createObject('obstacle', o.x, o.y));
        this.createObject('robot', robot.x, robot.y, robot.direction);
    }
    
    createObject(id, x, y, direction) {
        const obj = document.createElement('div');
        obj.id = id === 'robot' ? 'robot' : `${id}-${x}-${y}`;
        obj.className = `grid-object ${direction ? 'direction-' + direction : id}`;
        obj.style.left = `${x * this.tileSize}px`;
        obj.style.top = `${y * this.tileSize}px`;
        obj.style.width = `${this.tileSize}px`;
        obj.style.height = `${this.tileSize}px`;
        this.container.appendChild(obj);
    }

    async updateRobot({ x, y, direction }) {
        return new Promise(resolve => {
            const robotEl = document.getElementById('robot');
            this.currentRobotPos = { x, y, direction };
            robotEl.style.left = `${x * this.tileSize}px`;
            robotEl.style.top = `${y * this.tileSize}px`;
            robotEl.style.width = `${this.tileSize}px`;
            robotEl.style.height = `${this.tileSize}px`;
            robotEl.className = `grid-object direction-${direction}`;
            setTimeout(resolve, 400); // Animation duration
        });
    }

    collectGoal(goalPos) {
        const goalEl = document.getElementById(`goal-${goalPos.x}-${goalPos.y}`);
        if (goalEl) {
            goalEl.classList.add('goal-collected');
        }
    }
    
    showRobotError() {
        const robotEl = document.getElementById('robot');
        robotEl.classList.add('shake');
        setTimeout(() => robotEl.classList.remove('shake'), 500);
    }
}