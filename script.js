// --- Configuration ---
const symbols = [
    '🦁', '🦊', '🐨', '🐼', '🐸', '🐙', '🦋', '🦄',
    '🐒', '🦉', '🐠', '🚀'
];
const PREVIEW_DURATION = 7000; // 7 secondes de pré-visualisation

// --- Variables d'état du jeu ---
let cards = [];
let flippedCards = [];
let matchedPairsCount = 0;
let isBoardLocked = false;
let isGameOver = false;

let gameMode = ''; // 'mono' ou 'multi'

let monoUserScore = 0;

let player1Score = 0;
let player2Score = 0;
let currentPlayer = 1;

// --- Éléments du DOM ---
const gameModeSelectionScreen = document.getElementById('game-mode-selection');
const gameScreen = document.getElementById('game-screen');

const monoUserBtn = document.getElementById('mono-user-btn');
const multiUserBtn = document.getElementById('multi-user-btn');

const gridElement = document.getElementById('grid');
const statusMessageElement = document.getElementById('status-message');
const restartBtn = document.getElementById('restart-btn');

const monoUserStats = document.getElementById('mono-user-stats');
const monoScoreCountElement = document.getElementById('mono-score-count');

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
    
    const gameSymbols = shuffleArray([...symbols, ...symbols]); // 12 symboles * 2 = 24 cartes

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

// Fonction pour la pré-visualisation (initiale ou après échec)
function showAllCardsTemporarily(message) {
    isBoardLocked = true; // Verrouille le plateau
    showStatus(message, 'warning', 0); // Message permanent pendant la pré-visualisation

    document.querySelectorAll('.card:not(.matched)').forEach(card => {
        card.classList.add('preview-flipped');
    });

    setTimeout(() => {
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('preview-flipped');
        });
        isBoardLocked = false; // Déverrouille le plateau
        showStatus(''); // Efface le message de pré-visualisation

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
    // Appel initial de la pré-visualisation
    showAllCardsTemporarily("Mémorisez les cartes ! Le jeu commence dans " + PREVIEW_DURATION / 1000 + " secondes.");
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

        if (matchedPairsCount === symbols.length) {
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
            
            // NOUVEAU : Pré-visualisation pour le joueur suivant
            setTimeout(() => {
                card1.classList.remove('flipped'); // Retourne les cartes de l'échec
                card2.classList.remove('flipped');
                flippedCards = []; // Vider les cartes retournées
                
                // Changer de joueur AVANT la pré-visualisation
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                updateScoresDisplay();

                // Montrer toutes les cartes non trouvées au nouveau joueur
                showAllCardsTemporarily(`Mémorisez pour le Joueur ${currentPlayer} !`);

            }, 1200); // Laisse un court délai pour voir l'erreur avant la pré-visualisation
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