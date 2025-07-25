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
            snippetButtons: document.querySelectorAll('.btn-snippet'),
            // Hint modal elements
            hintModal: document.getElementById('hint-modal'),
            hintText: document.getElementById('hint-text'),
            hintVisual: document.getElementById('hint-visual'),
            hintTipsList: document.getElementById('hint-tips-list'),
            closeHintBtn: document.getElementById('close-hint-btn'),
            showSolutionBtn: document.getElementById('show-solution-btn'),
            tryAgainBtn: document.getElementById('try-again-btn'),
            // Welcome modal elements
            welcomeModal: document.getElementById('welcome-modal'),
            startGameBtn: document.getElementById('start-game-btn'),
            closeWelcomeBtn: document.getElementById('close-welcome-btn'),
            skipWelcomeBtn: document.getElementById('skip-welcome-btn')
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

        // Hint modal listeners
        this.elements.closeHintBtn.addEventListener('click', () => this.hideHintModal());
        this.elements.tryAgainBtn.addEventListener('click', () => this.hideHintModal());
        this.elements.showSolutionBtn.addEventListener('click', callbacks.onShowSolution);

        // Welcome modal listeners
        this.elements.startGameBtn.addEventListener('click', callbacks.onStartGame);
        this.elements.closeWelcomeBtn.addEventListener('click', callbacks.onCloseWelcome);
        this.elements.skipWelcomeBtn.addEventListener('click', callbacks.onCloseWelcome);
        
        // Allow clicking outside modal to close
        this.elements.welcomeModal.addEventListener('click', (e) => {
            if (e.target === this.elements.welcomeModal) {
                callbacks.onCloseWelcome();
            }
        });
        
        // Allow ESC key to close welcome modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.welcomeModal.classList.contains('hidden')) {
                callbacks.onCloseWelcome();
            }
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

    // Hint modal methods
    showHintModal(hintData) {
        this.elements.hintText.textContent = hintData.text;
        
        // Add visual representation if provided
        if (hintData.visual) {
            this.elements.hintVisual.innerHTML = hintData.visual;
        } else {
            this.elements.hintVisual.innerHTML = '<span style="font-size: 2rem;">🤖➡️🎯</span>';
        }

        // Add tips
        this.elements.hintTipsList.innerHTML = '';
        hintData.tips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            this.elements.hintTipsList.appendChild(li);
        });

        this.elements.hintModal.classList.remove('hidden');
    }

    hideHintModal() {
        this.elements.hintModal.classList.add('hidden');
    }

    // Welcome modal methods
    showWelcomeModal() {
        this.elements.welcomeModal.classList.remove('hidden');
    }

    hideWelcomeModal() {
        this.elements.welcomeModal.classList.add('hidden');
    }

    checkWelcomeStatus() {
        const hasSeenWelcome = localStorage.getItem('cqj_hasSeenWelcome');
        if (!hasSeenWelcome) {
            this.showWelcomeModal();
            return false;
        }
        return true;
    }

    markWelcomeSeen() {
        localStorage.setItem('cqj_hasSeenWelcome', 'true');
    }
}