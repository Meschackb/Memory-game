// --- Configuration ---
const symbols = ['🦁', '🦊', '🐨', '🐼', '🐸', '🐙', '🦋', '🦄'];
const MAX_ATTEMPTS = 2; // NOUVEAU : Nombre maximum de tentatives par tour

// --- Variables d'état du jeu ---
let cards = [];
let flippedCards = [];
let score = 0;
let matchedPairsCount = 0;
let isBoardLocked = false;
let isGameOver = false;
let attemptsLeft = MAX_ATTEMPTS; // NOUVEAU : Tentatives restantes

// --- Éléments du DOM ---
const gridElement = document.getElementById('grid');
const scoreCountElement = document.getElementById('score-count');
const attemptsLeftElement = document.getElementById('attempts-left'); // NOUVEAU
const statusMessageElement = document.getElementById('status-message');
const restartBtn = document.getElementById('restart-btn');

// --- Fonctions utilitaires ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showStatus(message, type) {
    statusMessageElement.textContent = message;
    statusMessageElement.className = 'status-message'; // Réinitialise
    if (type) {
        statusMessageElement.classList.add('status-' + type);
    }
    
    // Pour les messages de succès ou d'avertissement, on les retire après un délai
    if (type === 'success' || type === 'warning') {
        setTimeout(() => {
            if (!isGameOver && flippedCards.length === 0) { // Ne retire que si le jeu n'est pas fini et aucune carte n'est retournée
                statusMessageElement.textContent = '';
                statusMessageElement.className = 'status-message';
            }
        }, 1500);
    }
}

// --- Logique du jeu ---

function initGame() {
    // 1. Réinitialiser l'état complet
    flippedCards = [];
    score = 0;
    matchedPairsCount = 0;
    isBoardLocked = false;
    isGameOver = false;
    attemptsLeft = MAX_ATTEMPTS; // IMPORTANT : Réinitialiser les tentatives

    // Mise à jour de l'interface
    scoreCountElement.textContent = score;
    attemptsLeftElement.textContent = attemptsLeft; // NOUVEAU : Mettre à jour l'affichage des tentatives
    statusMessageElement.textContent = '';
    statusMessageElement.className = 'status-message';
    gridElement.classList.remove('locked');
    gridElement.innerHTML = '';

    // 2. Préparer et mélanger les cartes
    cards = shuffleArray([...symbols, ...symbols]);

    // 3. Générer le HTML
    cards.forEach((symbol) => {
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

function flipCard() {
    if (isBoardLocked || isGameOver || this.classList.contains('flipped')) return;

    this.classList.add('flipped');
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        // Verrouiller la grille pendant la vérification pour éviter de cliquer sur d'autres cartes
        isBoardLocked = true; 
        checkForMatch();
    }
}

function checkForMatch() {
    const [card1, card2] = flippedCards;
    const symbol1 = card1.dataset.symbol;
    const symbol2 = card2.dataset.symbol;

    if (symbol1 === symbol2) {
        // --- CAS DE SUCCÈS ---
        score++;
        matchedPairsCount++;
        scoreCountElement.textContent = score;
        
        // Marquer les cartes comme trouvées
        card1.classList.add('matched');
        card2.classList.add('matched');
        card1.removeEventListener('click', flipCard);
        card2.removeEventListener('click', flipCard);

        showStatus(`Gagné = ${score} ! Continuez.`, 'success');

        // Réinitialiser les tentatives car une paire trouvée n'est pas un échec
        attemptsLeft = MAX_ATTEMPTS;
        attemptsLeftElement.textContent = attemptsLeft;

        // Reset pour le prochain tour
        flippedCards = [];
        isBoardLocked = false; // Déverrouiller le plateau

        // Vérifier si toutes les paires sont trouvées (Victoire finale)
        if (matchedPairsCount === symbols.length) {
            showStatus(`Bravo ! Vous avez tout trouvé avec un score de ${score} ! 🎉`, 'success');
            isGameOver = true;
        }

    } else {
        // --- CAS D'ÉCHEC ---
        attemptsLeft--; // Diminuer les tentatives
        attemptsLeftElement.textContent = attemptsLeft;

        if (attemptsLeft > 0) {
            // Premier échec du tour : le joueur a une autre chance
            showStatus(`Choisissez pour un deuxième coup. Il vous reste ${attemptsLeft} coup(s).`, 'warning');
            
            // On retourne les cartes après un délai pour que le joueur voie l'erreur
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = []; // Vider les cartes retournées
                isBoardLocked = false; // Déverrouiller le plateau pour le prochain clic
            }, 1000); // 1 seconde pour voir les cartes
            
        } else {
            // Deuxième échec (ou plus) : Game Over
            isGameOver = true;
            showStatus("Echec. Veuillez recommencer en cliquant sur recommencer.", "failure");
            gridElement.classList.add('locked'); // Griser la grille
            
            // On laisse les cartes visibles pour montrer l'erreur finale
            // Pas besoin de retourner flippedCards ou de déverrouiller isBoardLocked
        }
    }
}

// --- Événements ---
document.addEventListener('DOMContentLoaded', initGame);
restartBtn.addEventListener('click', initGame);