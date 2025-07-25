export default class UIManager {
    constructor() {
        this.elements = {
            runBtn: document.getElementById('run-btn'),
            resetBtn: document.getElementById('reset-btn'),
            hintBtn: document.getElementById('hint-btn'),
            nextLevelBtn: document.getElementById('next-level-btn'),
            replayLevelBtn: document.getElementById('replay-level-btn'),
            selectLevelBtn: document.getElementById('select-level-btn'),
            levelIndicator: document.getElementById('level-indicator'),
            modal: document.getElementById('level-complete-modal'),
            starRating: document.getElementById('star-rating'),
            errorFeedback: document.getElementById('error-feedback'),
            snippetButtons: document.querySelectorAll('.btn-snippet'),
            
            // Game Complete Modal
            gameCompleteModal: document.getElementById('game-complete-modal'),
            totalStarsDisplay: document.getElementById('total-stars'),
            restartGameBtn: document.getElementById('restart-game-btn'),
            browseLevelsBtn: document.getElementById('browse-levels-btn'),
            shareAchievementBtn: document.getElementById('share-achievement-btn'),
            
            // Level Selection Modal
            levelSelectModal: document.getElementById('level-select-modal'),
            levelSelectBtn: document.getElementById('level-select-btn'),
            closeLevelSelectBtn: document.getElementById('close-level-select-btn'),
            levelGrid: document.getElementById('level-grid'),
            completedLevelsCount: document.getElementById('completed-levels-count'),
            totalStarsEarned: document.getElementById('total-stars-earned'),
            completionPercentage: document.getElementById('completion-percentage'),
            continueCurrenBtn: document.getElementById('continue-current-btn'),
            resetProgressBtn: document.getElementById('reset-progress-btn'),
            
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
        // Existing button listeners
        this.elements.runBtn.addEventListener('click', callbacks.onRun);
        this.elements.resetBtn.addEventListener('click', callbacks.onReset);
        this.elements.nextLevelBtn.addEventListener('click', callbacks.onNextLevel);
        this.elements.replayLevelBtn.addEventListener('click', callbacks.onReplayLevel);
        this.elements.selectLevelBtn.addEventListener('click', callbacks.onShowLevelSelect);
        this.elements.hintBtn.addEventListener('click', callbacks.onHint);
        this.elements.snippetButtons.forEach(btn => {
            btn.addEventListener('click', () => callbacks.onSnippetClick(btn.dataset.snippet));
        });

        // Level selection listeners
        this.elements.levelIndicator.addEventListener('click', callbacks.onShowLevelSelect);
        this.elements.levelSelectBtn.addEventListener('click', callbacks.onShowLevelSelect);
        this.elements.closeLevelSelectBtn.addEventListener('click', () => this.hideLevelSelectModal());
        this.elements.continueCurrenBtn.addEventListener('click', () => this.hideLevelSelectModal());
        this.elements.resetProgressBtn.addEventListener('click', callbacks.onResetProgress);

        // Game complete listeners
        this.elements.restartGameBtn.addEventListener('click', callbacks.onRestartGame);
        this.elements.browseLevelsBtn.addEventListener('click', callbacks.onShowLevelSelect);
        this.elements.shareAchievementBtn.addEventListener('click', callbacks.onShareAchievement);

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

        this.elements.levelSelectModal.addEventListener('click', (e) => {
            if (e.target === this.elements.levelSelectModal) {
                this.hideLevelSelectModal();
            }
        });
        
        // Allow ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!this.elements.welcomeModal.classList.contains('hidden')) {
                    callbacks.onCloseWelcome();
                } else if (!this.elements.levelSelectModal.classList.contains('hidden')) {
                    this.hideLevelSelectModal();
                } else if (!this.elements.hintModal.classList.contains('hidden')) {
                    this.hideHintModal();
                }
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
    
    showLevelCompleteModal(stars, isLastLevel = false) {
        let starHTML = '';
        for (let i = 0; i < 3; i++) {
            starHTML += `<span class="star ${i < stars ? 'filled' : ''}">⭐</span>`;
        }
        this.elements.starRating.innerHTML = starHTML;
        
        // Show/hide next level button based on whether this is the last level
        this.elements.nextLevelBtn.style.display = isLastLevel ? 'none' : 'inline-block';
        
        this.elements.modal.classList.remove('hidden');
    }

    hideLevelCompleteModal() {
        this.elements.modal.classList.add('hidden');
    }

    showGameCompleteModal(totalStars) {
        this.elements.totalStarsDisplay.textContent = totalStars;
        this.elements.gameCompleteModal.classList.remove('hidden');
        
        // Hide level complete modal if it's showing
        this.hideLevelCompleteModal();
    }

    hideGameCompleteModal() {
        this.elements.gameCompleteModal.classList.add('hidden');
    }

    showLevelSelectModal(levels, playerProgress, currentLevelIndex) {
        this.updateLevelGrid(levels, playerProgress, currentLevelIndex);
        this.updateProgressSummary(playerProgress, levels.length);
        this.elements.levelSelectModal.classList.remove('hidden');
    }

    hideLevelSelectModal() {
        this.elements.levelSelectModal.classList.add('hidden');
    }

    updateLevelGrid(levels, playerProgress, currentLevelIndex) {
        this.elements.levelGrid.innerHTML = '';
        
        const allLevelsCompleted = playerProgress.completedLevels.length === levels.length;
        
        levels.forEach((level, index) => {
            const levelItem = document.createElement('div');
            levelItem.className = 'level-item';
            
            // If all levels are completed, everything is unlocked
            const isUnlocked = allLevelsCompleted || index <= currentLevelIndex;
            const isCompleted = playerProgress.completedLevels.includes(index);
            const isCurrent = index === currentLevelIndex && !allLevelsCompleted;
            
            if (isCompleted) {
                levelItem.classList.add('completed');
            } else if (isCurrent && isUnlocked) {
                levelItem.classList.add('current');
            } else if (!isUnlocked) {
                levelItem.classList.add('locked');
            }
            
            if (isUnlocked) {
                levelItem.addEventListener('click', () => {
                    this.onLevelSelected(index);
                });
            }
            
            levelItem.innerHTML = `
                ${!isUnlocked ? '<div class="level-lock-icon">🔒</div>' : ''}
                <div class="level-number">${index + 1}</div>
                <div class="level-name">${level.name}</div>
                ${isCompleted ? this.generateStarDisplay(playerProgress.levelStars[index] || 0) : 
                  isUnlocked ? '<div class="level-stars"><span class="star">⭐</span><span class="star">⭐</span><span class="star">⭐</span></div>' : ''}
            `;
            
            this.elements.levelGrid.appendChild(levelItem);
        });
    }

    generateStarDisplay(stars) {
        let starHTML = '<div class="level-stars">';
        for (let i = 0; i < 3; i++) {
            starHTML += `<span class="star ${i < stars ? 'filled' : ''}">⭐</span>`;
        }
        starHTML += '</div>';
        return starHTML;
    }

    updateProgressSummary(playerProgress, totalLevels) {
        const completedCount = playerProgress.completedLevels.length;
        const totalStars = Object.values(playerProgress.levelStars).reduce((sum, stars) => sum + stars, 0);
        const percentage = Math.round((completedCount / totalLevels) * 100);
        
        this.elements.completedLevelsCount.textContent = completedCount;
        this.elements.totalStarsEarned.textContent = totalStars;
        this.elements.completionPercentage.textContent = `${percentage}%`;
    }

    onLevelSelected(levelIndex) {
        this.hideLevelSelectModal();
        // This will be handled by the callback system
        if (this.levelSelectedCallback) {
            this.levelSelectedCallback(levelIndex);
        }
    }

    setLevelSelectedCallback(callback) {
        this.levelSelectedCallback = callback;
    }

    // Hint modal methods
    showHintModal(hintData) {
        this.elements.hintText.textContent = hintData.text;
        
        if (hintData.visual) {
            this.elements.hintVisual.innerHTML = hintData.visual;
        } else {
            this.elements.hintVisual.innerHTML = '<span style="font-size: 2rem;">🤖➡️🎯</span>';
        }

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

    showShareDialog(totalStars, completedLevels) {
        const shareText = `🎉 I just completed Junior Code Quest! 🤖\n\n⭐ Earned ${totalStars} stars across ${completedLevels} levels!\n🧠 Learned programming logic through fun puzzles!\n\nTry it yourself: ${window.location.href}`;
        
        // Enhanced sharing for both mobile and desktop
        if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // Mobile sharing
            navigator.share({
                title: 'Junior Code Quest Achievement! 🎮',
                text: shareText,
                url: window.location.href
            }).catch(err => {
                console.log('Share failed:', err);
                this.fallbackShare(shareText);
            });
        } else {
            // Desktop sharing with options
            this.showShareOptions(shareText, totalStars, completedLevels);
        }
    }

    showShareOptions(shareText, totalStars, completedLevels) {
        // Create custom share modal
        const shareModal = document.createElement('div');
        shareModal.className = 'modal-overlay';
        shareModal.innerHTML = `
            <div class="modal-content share-modal">
                <div class="share-header">
                    <h2>🎉 Share Your Achievement!</h2>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="share-content">
                    <div class="achievement-summary">
                        <div class="achievement-icon">🏆</div>
                        <h3>Game Completed!</h3>
                        <p>${totalStars} ⭐ Stars • ${completedLevels} Levels</p>
                    </div>
                    <div class="share-options">
                        <button class="btn btn-action share-btn" onclick="navigator.clipboard.writeText(\`${shareText.replace(/`/g, '\\`')}\`).then(() => {alert('Achievement copied to clipboard! 📋'); this.closest('.modal-overlay').remove();})">
                            📋 Copy to Clipboard
                        </button>
                        <button class="btn btn-action share-btn" onclick="window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(\`${shareText.replace(/`/g, '\\`')}\`), '_blank'); this.closest('.modal-overlay').remove();">
                            🐦 Share on Twitter
                        </button>
                        <button class="btn btn-action share-btn" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent('${window.location.href}') + '&quote=' + encodeURIComponent(\`${shareText.replace(/`/g, '\\`')}\`), '_blank'); this.closest('.modal-overlay').remove();">
                            📘 Share on Facebook
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(shareModal);
        
        // Close modal when clicking outside
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                shareModal.remove();
            }
        });
    }

    fallbackShare(shareText) {
        // Fallback for when native sharing fails
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Achievement copied to clipboard! Share it with your friends! 🎉');
        }).catch(() => {
            // Ultimate fallback - show text in alert
            alert('Share this achievement:\n\n' + shareText);
        });
    }
}