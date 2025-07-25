export default class UIManager {
    constructor() {
        this.elements = {
            runBtn: document.getElementById('run-btn'),
            resetBtn: document.getElementById('reset-btn'),
            hintBtn: document.getElementById('hint-btn'),
            nextLevelBtn: document.getElementById('next-level-btn'),
            levelIndicator: document.getElementById('level-indicator'),
            modal: document.getElementById('level-complete-modal'),
            starRating: document.getElementById('star-rating'),
            errorFeedback: document.getElementById('error-feedback'),
            snippetButtons: document.querySelectorAll('.btn-snippet')
        };
    }

    init(callbacks) {
        this.elements.runBtn.addEventListener('click', callbacks.onRun);
        this.elements.resetBtn.addEventListener('click', callbacks.onReset);
        this.elements.nextLevelBtn.addEventListener('click', callbacks.onNextLevel);
        this.elements.hintBtn.addEventListener('click', callbacks.onHint);
        this.elements.snippetButtons.forEach(btn => {
            btn.addEventListener('click', () => callbacks.onSnippetClick(btn.dataset.snippet));
        });
    }

    updateLevelIndicator(level) {
        this.elements.levelIndicator.textContent = `Level ${level}`;
    }

    showError(message) {
        this.elements.errorFeedback.textContent = message;
    }
    
    clearError() {
        this.elements.errorFeedback.textContent = '';
    }
    
    setControlsState(enabled) {
        this.elements.runBtn.disabled = !enabled;
        this.elements.resetBtn.disabled = !enabled;
        this.elements.hintBtn.disabled = !enabled;
        this.elements.snippetButtons.forEach(btn => btn.disabled = !enabled);
    }
    
    showLevelCompleteModal(stars) {
        let starHTML = '';
        for (let i = 0; i < 3; i++) {
            starHTML += `<span class="star ${i < stars ? 'filled' : ''}">⭐</span>`;
        }
        this.elements.starRating.innerHTML = starHTML;
        this.elements.modal.classList.remove('hidden');
    }
    
    showGameCompleteModal() {
        this.elements.modal.querySelector('#modal-title').textContent = "You're a Code Master!";
        this.elements.starRating.innerHTML = '🏆';
        this.elements.modal.querySelector('#modal-message').textContent = 'You have completed all the levels!';
        this.elements.nextLevelBtn.style.display = 'none';
        this.elements.modal.classList.remove('hidden');
    }

    hideLevelCompleteModal() {
        this.elements.modal.classList.add('hidden');
    }
}