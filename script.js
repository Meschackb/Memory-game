// --- Configuration ---
// Liste des symboles (12 uniques pour une grille 4x6 = 24 cartes)
const symbols = [
    '🦁', '🦊', '🐨', '🐼', '🐸', '🐙', '🦋', '🦄',
    '🐒', '🦉', '🐠', '🚀' // Nouveaux symboles
];
const GRID_SIZE = 24; // NOUVEAU : Nombre total de cartes (4x6)
const PREVIEW_DURATION = 7000; // 7 secondes de pré-visualisation

// --- Variables d'état du jeu ---
let cards = [];
let flippedCards = [];
let matchedPairsCount = 0;
let isBoardLocked = false;
let isGameOver = false;

// Mode de jeu
let gameMode = ''; // 'mono' ou 'multi'

// Variables spécifiques au mode mono-utilisateur
let monoUserScore = 0;

// Variables spécifiques au mode multi-utilisateurs
let player1Score = 0;
let player2Score = 0;
let currentPlayer = 1; // 1 pour joueur 1, 2 pour joueur 2

// --- Éléments du DOM ---
const gameModeSelectionScreen = document.getElementById('game-mode-selection');
const gameScreen = document.getElementById('game-screen');

const monoUserBtn = document.getElementById('mono-user-btn');
const multiUserBtn = document.getElementById('multi-user-btn');

const gridElement = document.getElementById('grid');
const statusMessageElement = document.getElementById('status-message');
const restartBtn = document.getElementById('restart-btn');

// Mono-utilisateur DOM
const monoUserStats = document.getElementById('mono-user-stats');
const monoScoreCountElement = document.getElementById('mono-score-count');

// Multi-utilisateurs DOM
const multiUserStats = document.getElementById('multi-user-stats');
const player1ScoreCountElement = document.getElementById('player1-score-count');
const player2ScoreCountElement = document.getElementById('player2-score-count');
const player1ScoreDisplay = multiUserStats.querySelector('.player-score:nth-child(1)');
const player2ScoreDisplay = multiUserStats.querySelector('.player-score:nth-child(2)');


// --- Fonctions utilitaires ---

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showStatus(message, type = '', duration = 1500) {
    statusMessageElement.textContent = message;
    statusMessageElement.className = 'status-message';
    if (type) {
        statusMessageElement.classList.add('status-' + type);
    }
    
    if (duration > 0 && !isGameOver) {
        setTimeout(() => {
            if (!isGameOver && flippedCards.length === 0) {
                statusMessageElement.textContent = '';
                statusMessageElement.className = 'status-message';
            }
        }, duration);
    }
}

function updateScoresDisplay() {
    if (gameMode === 'mono') {
        monoScoreCountElement.textContent = monoUserScore;
    } else if (gameMode === 'multi') {
        player1ScoreCountElement.textContent = player1Score;
        player2ScoreCountElement.textContent = player2Score;

        player1ScoreDisplay.classList.toggle('active-player', currentPlayer === 1);
        player2ScoreDisplay.classList.toggle('active-player', currentPlayer === 2);
    }
}

// --- Logique d'initialisation du jeu ---

function generateCards() {
    gridElement.innerHTML = '';
    
    // On duplique les symboles pour atteindre la taille de grille désirée
    // Pour une grille 4x6 (24 cartes), il faut 12 symboles uniques
    // Notre tableau 'symbols' en contient 12, donc on le duplique.
    const gameSymbols = shuffleArray([...symbols, ...symbols]);

    gameSymbols.forEach((symbol) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.symbol = symbol;

        cardElement.innerHTML = `
            <div class="card-front"></div>
            <div class="card-back">${symbol}</div>
        `;

        cardElement.addEventListener('click', flipCard);
        gridElement.appendChild(cardElement);
    });
}

function previewCards() {
    isBoardLocked = true;
    showStatus("Mémorisez les cartes ! Le jeu commence dans " + PREVIEW_DURATION / 1000 + " secondes.", 'warning', 0);

    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('preview-flipped');
    });

    setTimeout(() => {
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('preview-flipped');
        });
        isBoardLocked = false;
        showStatus('');

        if (gameMode === 'multi') {
            showStatus(`C'est au tour du Joueur ${currentPlayer}`, 'warning', 0);
        } else {
             showStatus('À vous de jouer !', 'success');
        }

    }, PREVIEW_DURATION);
}

function initGame(mode) {
    gameMode = mode;
    
    gameModeSelectionScreen.classList.remove('active');
    gameScreen.classList.add('active');
    restartBtn.classList.remove('hidden');

    flippedCards = [];
    matchedPairsCount = 0;
    isBoardLocked = false;
    isGameOver = false;

    if (gameMode === 'mono') {
        monoUserScore = 0;
        monoUserStats.classList.remove('hidden');
        multiUserStats.classList.add('hidden');
    } else { // multi
        player1Score = 0;
        player2Score = 0;
        currentPlayer = 1;
        multiUserStats.classList.remove('hidden');
        monoUserStats.classList.add('hidden');
    }
    updateScoresDisplay();
    showStatus('');
    gridElement.classList.remove('locked');

    generateCards();
    previewCards();
}

// --- Logique de jeu principale ---

function flipCard() {
    if (isBoardLocked || isGameOver || this.classList.contains('flipped') || this.classList.contains('matched')) return;

    this.classList.add('flipped');
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        isBoardLocked = true;
        checkForMatch();
    }
}

function checkForMatch() {
    const [card1, card2] = flippedCards;
    const symbol1 = card1.dataset.symbol;
    const symbol2 = card2.dataset.symbol;

    if (symbol1 === symbol2) {
        // --- C'est une paire ! ---
        matchedPairsCount++;

        if (gameMode === 'mono') {
            monoUserScore++;
        } else {
            if (currentPlayer === 1) {
                player1Score++;
            } else {
                player2Score++;
            }
        }
        updateScoresDisplay();

        card1.classList.add('matched');
        card2.classList.add('matched');
        card1.removeEventListener('click', flipCard);
        card2.removeEventListener('click', flipCard);

        showStatus(`Paire trouvée ! Score: ${gameMode === 'mono' ? monoUserScore : (currentPlayer === 1 ? player1Score : player2Score)}`, 'success');

        flippedCards = [];
        isBoardLocked = false;

        // Vérifier si le jeu est terminé (toutes les paires trouvées)
        if (matchedPairsCount === symbols.length) { // La condition utilise symbols.length car c'est le nombre de paires uniques
            isGameOver = true;
            gridElement.classList.add('locked');
            setTimeout(() => {
                let finalMessage = "Bravo ! Toutes les paires trouvées ! 🎉";
                if (gameMode === 'multi') {
                    if (player1Score > player2Score) {
                        finalMessage = `Partie terminée ! Le Joueur 1 gagne avec ${player1Score} points ! 🎉`;
                    } else if (player2Score > player1Score) {
                        finalMessage = `Partie terminée ! Le Joueur 2 gagne avec ${player2Score} points ! 🎉`;
                    } else {
                        finalMessage = `Partie terminée ! Égalité avec ${player1Score} points chacun ! 🤝`;
                    }
                }
                showStatus(finalMessage, 'success', 0);
            }, 500);
        } else {
            if (gameMode === 'multi') {
                showStatus(`Paire trouvée ! Joueur ${currentPlayer} rejoue.`, 'warning');
            }
        }

    } else {
        // --- Ce n'est PAS une paire ---
        if (gameMode === 'mono') {
            showStatus("Pas une paire. Essayez encore !", 'failure');
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
                isBoardLocked = false;
            }, 1000);

        } else { // Mode multi-utilisateurs
            showStatus("Pas une paire. Au joueur suivant !", 'failure');
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
                isBoardLocked = false;

                currentPlayer = currentPlayer === 1 ? 2 : 1;
                updateScoresDisplay();
                showStatus(`C'est au tour du Joueur ${currentPlayer}`, 'warning', 0);
            }, 1200);
        }
    }
}

// --- Événements ---
monoUserBtn.addEventListener('click', () => initGame('mono'));
multiUserBtn.addEventListener('click', () => initGame('multi'));

restartBtn.addEventListener('click', () => {
    gameScreen.classList.remove('active');
    gameModeSelectionScreen.classList.add('active');
    restartBtn.classList.add('hidden');
    statusMessageElement.textContent = '';
});

document.addEventListener('DOMContentLoaded', () => {
    gameModeSelectionScreen.classList.add('active');
});
