export default class GridRenderer {
    constructor(gridContainer) {
        this.container = gridContainer;
        this.tileSize = this.getTileSize();
        window.addEventListener('resize', () => { this.tileSize = this.getTileSize(); });
    }
    
    getTileSize() {
         return window.innerWidth < 480 ? 40 : 50;
    }

    renderLevel(gameState) {
        const { gridSize, robot, goals, obstacles } = gameState;
        this.container.innerHTML = '';
        this.container.style.gridTemplateColumns = `repeat(${gridSize.width}, ${this.tileSize}px)`;
        this.container.style.width = `${gridSize.width * this.tileSize}px`;
        this.container.style.height = `${gridSize.height * this.tileSize}px`;

        for (let i = 0; i < gridSize.width * gridSize.height; i++) {
            const tile = document.createElement('div');
            tile.className = 'grid-tile';
            this.container.appendChild(tile);
        }

        goals.forEach(g => this.createObject('goal', g.x, g.y));
        obstacles.forEach(o => this.createObject('obstacle', o.x, o.y));
        this.createObject('robot', robot.x, robot.y, robot.direction);
    }
    
    createObject(id, x, y, direction) {
        const obj = document.createElement('div');
        obj.id = id;
        obj.className = `grid-object ${direction ? 'direction-' + direction : id}`;
        obj.style.left = `${x * this.tileSize}px`;
        obj.style.top = `${y * this.tileSize}px`;
        this.container.appendChild(obj);
    }

    async updateRobot({ x, y, direction }) {
        return new Promise(resolve => {
            const robotEl = document.getElementById('robot');
            robotEl.style.left = `${x * this.tileSize}px`;
            robotEl.style.top = `${y * this.tileSize}px`;
            robotEl.className = `grid-object direction-${direction}`;
            setTimeout(resolve, 400); // Animation duration
        });
    }

    collectGoal(goalPos) {
        const goalEl = document.querySelector(`.goal[style*="left: ${goalPos.x * this.tileSize}px; top: ${goalPos.y * this.tileSize}px;"]`);
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