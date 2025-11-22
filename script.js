// --- Configuration et Données ---
// Liste étendue à 18 symboles pour supporter jusqu'à la grille 6x6 (36 cartes)
const allSymbols = [
    '🦁', '🦊', '🐨', '🐼', '🐸', '🐙', '🦋', '🦄',
    '🐒', '🦉', '🐠', '🚀', '🍎', '🚗', '⏰', '💡', '🔑', '🎁'
];

// Configuration des niveaux
const levelConfig = {
    1: { name: "Facile", cols: 4, totalCards: 16, previewTime: 1500 }, // 4x4
    2: { name: "Moyen", cols: 6, totalCards: 24, previewTime: 2500 }, // 4x6
    3: { name: "Difficile", cols: 6, totalCards: 36, previewTime: 3500 } // 6x6
};

// --- Variables d'état globales ---
let gameState = {
    mode: null,          // 'mono' ou 'multi'
    levelId: 1,          // 1, 2, ou 3
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    isLocked: false,
    isGameOver: false,
    scores: { mono: 0, p1: 0, p2: 0 },
    currentPlayer: 1,
    isMusicPlaying: false
};

// --- Éléments du DOM (Sélection & Navigation) ---
const screens = {
    selection: document.getElementById('selection-screen'),
    game: document.getElementById('game-screen')
};
// Éléments écran de sélection
const modeSelection = document.getElementById('mode-selection');
const levelSelection = document.getElementById('level-selection');
const monoUserBtn = document.getElementById('mono-user-btn');
const multiUserBtn = document.getElementById('multi-user-btn');
const levelBtns = document.querySelectorAll('.level-btn');
const cancelLevelBtn = document.getElementById('cancel-level-btn');

// Éléments écran de jeu - Header
const backBtn = document.getElementById('back-btn');
const currentLevelDisplay = document.getElementById('current-level-display');
const toggleMusicBtn = document.getElementById('toggle-music-btn');
const restartBtn = document.getElementById('restart-btn');
// Éléments écran de jeu - Scores
const monoStats = document.getElementById('mono-user-stats');
const monoScoreEl = document.getElementById('mono-score-count');
const multiStats = document.getElementById('multi-user-stats');
const p1ScoreEl = document.getElementById('player1-score-count');
const p2ScoreEl = document.getElementById('player2-score-count');
const p1Display = multiStats.querySelector('.player-score:nth-child(1)');
const p2Display = multiStats.querySelector('.player-score:nth-child(2)');
// Éléments écran de jeu - Zone principale
const gridElement = document.getElementById('grid');
const statusMessage = document.getElementById('status-message');
// Audio
const backgroundMusic = document.getElementById('background-music');


// =================================================================
// --- GESTION DE L'INTERFACE ET NAVIGATION ---
// =================================================================

// Fonction pour basculer entre les écrans principaux
function showScreen(screenName) {
    // Cache tous les écrans
    Object.values(screens).forEach(s => s.classList.remove('active'));
    // Affiche l'écran demandé
    screens[screenName].classList.add('active');
}

// Réinitialise l'écran de sélection à son état initial (choix du mode)
function resetSelectionScreen() {
    modeSelection.classList.remove('hidden');
    levelSelection.classList.add('hidden');
    gameState.mode = null;
}

// --- Événements de Navigation ---

// Étape 1 : Choix du mode
monoUserBtn.addEventListener('click', () => {
    gameState.mode = 'mono';
    modeSelection.classList.add('hidden');
    levelSelection.classList.remove('hidden');
});

multiUserBtn.addEventListener('click', () => {
    gameState.mode = 'multi';
    modeSelection.classList.add('hidden');
    levelSelection.classList.remove('hidden');
});

// Annuler le choix du mode
cancelLevelBtn.addEventListener('click', resetSelectionScreen);

// Étape 2 : Choix du niveau -> LANCE LE JEU
levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const selectedLevelId = parseInt(btn.dataset.level);
        // On lance le jeu avec le mode déjà choisi et ce niveau
        startNewGame(gameState.mode, selectedLevelId);
    });
});

// Bouton Retour (Game -> Selection)
backBtn.addEventListener('click', () => {
    stopMusic();
    resetSelectionScreen();
    showScreen('selection');
});

// Bouton Recommencer (sur l'écran de jeu)
restartBtn.addEventListener('click', () => {
    // Recommence avec les mêmes paramètres actuels
    startNewGame(gameState.mode, gameState.levelId);
});


// =================================================================
// --- LOGIQUE DU JEU ---
// =================================================================

// Fonction principale pour préparer et lancer une partie
function startNewGame(mode, levelId) {
    // 1. Reset de l'état
    gameState.mode = mode;
    gameState.levelId = levelId;
    gameState.flippedCards = [];
    gameState.matchedPairs = 0;
    gameState.isLocked = false;
    gameState.isGameOver = false;
    gameState.scores = { mono: 0, p1: 0, p2: 0 };
    gameState.currentPlayer = 1;

    // 2. Configuration selon le niveau
    const config = levelConfig[levelId];
    gameState.totalPairs = config.totalCards / 2;

    // 3. Mise à jour de l'interface utilisateur
    updateUIForNewGame(config.name, config.cols);
    showScreen('game');

    // 4. Génération et prévisualisation
    generateGrid(config.totalCards);
    
    const startMsg = mode === 'multi' ? "C'est parti ! Joueur 1 commence." : "C'est parti ! Mémorisez bien.";
    showAllCardsTemporarily(startMsg, config.previewTime);
    
    playMusic();
}

// Met à jour le header et les zones de score selon le mode
function updateUIForNewGame(levelName, gridCols) {
    // Mise à jour du nom du niveau
    currentLevelDisplay.textContent = `Niveau : ${levelName}`;
    
    // Configuration de la grille CSS
    gridElement.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;

    // Affichage des scores selon le mode
    if (gameState.mode === 'mono') {
        monoStats.classList.remove('hidden');
        multiStats.classList.add('hidden');
    } else {
        multiStats.classList.remove('hidden');
        monoStats.classList.add('hidden');
    }
    updateScoreDisplay();
    setStatus('');
}


// Génère les cartes HTML
function generateGrid(totalCards) {
    gridElement.innerHTML = '';
    const pairsNeeded = totalCards / 2;
    // Prend les N premiers symboles nécessaires
    const gameSymbols = allSymbols.slice(0, pairsNeeded);
    // Double et mélange
    const deck = shuffleArray([...gameSymbols, ...gameSymbols]);

    deck.forEach(symbol => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.symbol = symbol;
        card.innerHTML = `
            <div class="card-front"></div>
            <div class="card-back">${symbol}</div>
        `;
        card.addEventListener('click', handleCardClick);
        gridElement.appendChild(card);
    });
}

// Gère le clic sur une carte
function handleCardClick() {
    if (gameState.isLocked || gameState.isGameOver || this.classList.contains('flipped') || this.classList.contains('matched')) return;

    this.classList.add('flipped');
    gameState.flippedCards.push(this);

    if (gameState.flippedCards.length === 2) {
        gameState.isLocked = true;
        checkForMatch();
    }
}

// Vérifie la paire
function checkForMatch() {
    const [card1, card2] = gameState.flippedCards;
    const isMatch = card1.dataset.symbol === card2.dataset.symbol;

    if (isMatch) {
        handleMatch(card1, card2);
    } else {
        handleMismatch(card1, card2);
    }
}

// Cas : Paire trouvée
function handleMatch(card1, card2) {
    gameState.matchedPairs++;
    incrementScore();
    updateScoreDisplay();

    card1.classList.add('matched');
    card2.classList.add('matched');
    gameState.flippedCards = [];
    gameState.isLocked = false;

    if (gameState.matchedPairs === gameState.totalPairs) {
        handleGameEnd();
    } else if (gameState.mode === 'multi') {
        setStatus(`Bien joué ! Joueur ${gameState.currentPlayer} rejoue.`, 'success');
    }
}

// Cas : Erreur
function handleMismatch(card1, card2) {
    if (gameState.mode === 'mono') {
        setStatus("Raté ! Réessayez.", 'failure');
        setTimeout(() => {
            resetFlippedCards(card1, card2);
        }, 1000);
    } else {
        setStatus("Raté ! Au joueur suivant...", 'failure');
        setTimeout(() => {
            resetFlippedCards(card1, card2);
            switchPlayer();
            // Prévisualisation pour le joueur suivant (durée fixe ici pour simplifier)
            showAllCardsTemporarily(`À toi, Joueur ${gameState.currentPlayer} ! Mémorise !`, 2000);
        }, 1200);
    }
}

// Gère la fin de la partie (Victoire ou Progression)
function handleGameEnd() {
    // LOGIQUE DE PROGRESSION MULTI-JOUEURS
    if (gameState.mode === 'multi' && gameState.levelId < 3) {
        // S'il reste des niveaux en multi, on passe au suivant
        setStatus(`Niveau ${gameState.levelId} terminé ! Passage au niveau suivant...`, 'success', 3000);
        gameState.isLocked = true; // Bloque tout
        
        setTimeout(() => {
            // On lance le niveau suivant, mais ON GARDE LES SCORES ACTUELS
            const nextLevel = gameState.levelId + 1;
            const currentScores = {...gameState.scores}; // Sauvegarde des scores
            
            startNewGame('multi', nextLevel);
            
            // Restauration des scores après le reset de startNewGame
            gameState.scores = currentScores;
            updateScoreDisplay();

        }, 3000);

    } else {
        // Fin de partie "normale" (dernier niveau multi ou mode solo)
        gameState.isGameOver = true;
        gridElement.classList.add('locked');
        const winMsg = getFinalWinMessage();
        setStatus(winMsg, 'success', 0); // Message permanent
    }
}


// --- Helpers ---

function incrementScore() {
    if (gameState.mode === 'mono') gameState.scores.mono++;
    else gameState.currentPlayer === 1 ? gameState.scores.p1++ : gameState.scores.p2++;
}

function updateScoreDisplay() {
    if (gameState.mode === 'mono') {
        monoScoreEl.textContent = gameState.scores.mono;
    } else {
        p1ScoreEl.textContent = gameState.scores.p1;
        p2ScoreEl.textContent = gameState.scores.p2;
        p1Display.classList.toggle('active-player', gameState.currentPlayer === 1);
        p2Display.classList.toggle('active-player', gameState.currentPlayer === 2);
    }
}

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    updateScoreDisplay();
}

function resetFlippedCards(card1, card2) {
    card1.classList.remove('flipped');
    card2.classList.remove('flipped');
    gameState.flippedCards = [];
    gameState.isLocked = false;
}

function getFinalWinMessage() {
    if (gameState.mode === 'mono') return "Félicitations ! Vous avez terminé le niveau ! 🎉";
    const { p1, p2 } = gameState.scores;
    if (p1 > p2) return `Victoire finale du Joueur 1 (${p1} à ${p2}) ! 🏆`;
    if (p2 > p1) return `Victoire finale du Joueur 2 (${p2} à ${p1}) ! 🏆`;
    return `Match nul final (${p1} partout) ! 🤝`;
}

function showAllCardsTemporarily(msg, duration) {
    gameState.isLocked = true;
    setStatus(msg, 'warning', 0);
    document.querySelectorAll('.card:not(.matched)').forEach(c => c.classList.add('preview-flipped'));
    
    setTimeout(() => {
        document.querySelectorAll('.card.preview-flipped').forEach(c => c.classList.remove('preview-flipped'));
        gameState.isLocked = false;
        setStatus('');
    }, duration);
}

function setStatus(msg, type = '', duration = 2000) {
    statusMessage.textContent = msg;
    statusMessage.className = 'status-message ' + (type ? 'status-' + type : '');
    if (duration > 0) {
        setTimeout(() => {
            if (statusMessage.textContent === msg) setStatus('');
        }, duration);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- Audio ---
toggleMusicBtn.addEventListener('click', () => {
    gameState.isMusicPlaying ? stopMusic() : playMusic();
});

function playMusic() {
    backgroundMusic.play().then(() => {
        gameState.isMusicPlaying = true;
        toggleMusicBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }).catch(e => console.log("Audio bloqué:", e));
}

function stopMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0; // Remet au début
    gameState.isMusicPlaying = false;
    toggleMusicBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    // S'assure que l'écran de sélection est le premier visible
    showScreen('selection');
    // Gestion de l'état initial de l'icône musique si le navigateur l'a bloquée
    if(backgroundMusic.paused) toggleMusicBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
});