// Card values and suits
const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS = { 'hearts': '\u2665', 'diamonds': '\u2666', 'clubs': '\u2663', 'spades': '\u2660' };
const CARD_NUMERIC_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 11 };

// Game state
let gameState = {
    difficulty: 'normal',
    targetNumber: 0,
    targetHidden: false,
    playerHand: [],
    botHand: [],
    playerTable: [],
    botTable: [],
    playerScore: 0,
    botScore: 0,
    playerHealth: 100,
    botHealth: 100,
    totalRounds: 6,
    currentRound: 1,
    actionsThisRound: 0,
    firstActor: 'player',
    currentTurn: 'player',
    selectedCard: null,
    winnerEvaluationInProgress: false,
    pendingHealthUpdate: null,
    gameOver: false,
    playerReshuffleCount: 0,
    botReshuffleCount: 0,
    maxReshuffles: 2,
    // Power-up states
    x2Active: false,
    botX2Active: false,
    playerRevealActive: false,
    botRevealActive: false,
    revealActive: false,
    pendingPowerUpAction: null,
    pendingJokerAction: null // 'swap' or 'reshuffle'
};

// DOM Elements
const targetNumberEl = document.getElementById('targetNumber');
const playerHandEl = document.getElementById('playerHand');
const botHandEl = document.getElementById('botHand');
const playerTableEl = document.getElementById('playerTable');
const botTableEl = document.getElementById('botTable');
const playerScoreEl = document.getElementById('playerScore');
const botScoreEl = document.getElementById('botScore');
const playerTableCountEl = document.getElementById('playerTableCount');
const botTableCountEl = document.getElementById('botTableCount');
const gameStatusEl = document.getElementById('gameStatus');
const hitBtn = document.getElementById('hitBtn');
const standBtn = document.getElementById('standBtn');
const newGameBtn = document.getElementById('newGameBtn');
const rulesBtn = document.getElementById('rulesBtn');
const closeRulesBtn = document.getElementById('closeRulesBtn');
const historyBtn = document.getElementById('historyBtn');
const botAreaEl = document.querySelector('.bot-area');
const mobileBotStickyEl = document.getElementById('mobileBotSticky');
const mobileBotStickyCardsEl = document.getElementById('mobileBotStickyCards');
const mobileBotStickyHealthFillEl = document.getElementById('mobileBotStickyHealthFill');
const mobileBotStickyHealthTextEl = document.getElementById('mobileBotStickyHealthText');
const mobileBotStickyLabelEl = document.querySelector('.mobile-bot-sticky-label');
const resultModal = document.getElementById('resultModal');
const rulesModal = document.getElementById('rulesModal');
const historyModal = document.getElementById('historyModal');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const historySummary = document.getElementById('historySummary');
const historyList = document.getElementById('historyList');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const veryHardUnlockInfo = document.getElementById('veryHardUnlockInfo');
const veryHardEffectInfo = document.getElementById('veryHardEffectInfo');
const playAgainBtn = document.getElementById('playAgainBtn');
const changeDifficultyBtn = document.getElementById('changeDifficultyBtn');
const difficultyLabel = document.getElementById('difficultyLabel');
const reshuffleBtn = document.getElementById('reshuffleBtn');
// Joker action buttons
const jokerActionsEl = document.getElementById('jokerActions');
const swapCardBtn = document.getElementById('swapCardBtn');
const reshuffleEnemyBtn = document.getElementById('reshuffleEnemyBtn');
const playerReshuffleCountEl = document.getElementById('playerReshuffleCount');
const botReshuffleCountEl = document.getElementById('botReshuffleCount');
// Power-up confirmation modal
const powerUpConfirmModal = document.getElementById('powerUpConfirmModal');
const powerUpConfirmTitle = document.getElementById('powerUpConfirmTitle');
const powerUpConfirmIcon = document.getElementById('powerUpConfirmIcon');
const powerUpConfirmMessage = document.getElementById('powerUpConfirmMessage');
const confirmPowerUpBtn = document.getElementById('confirmPowerUpBtn');
const cancelPowerUpBtn = document.getElementById('cancelPowerUpBtn');
// Joker preview modal
const jokerPreviewModal = document.getElementById('jokerPreviewModal');
const jokerPreviewTitle = document.getElementById('jokerPreviewTitle');
const jokerPreviewCards = document.getElementById('jokerPreviewCards');
const jokerPreviewWarning = document.getElementById('jokerPreviewWarning');
const confirmJokerActionBtn = document.getElementById('confirmJokerActionBtn');
const cancelJokerActionBtn = document.getElementById('cancelJokerActionBtn');
// Health Bar Elements
const playerHealthBar = document.getElementById('playerHealthBar');
const botHealthBar = document.getElementById('botHealthBar');
const playerHealthText = document.getElementById('playerHealthText');
const botHealthText = document.getElementById('botHealthText');
const botHealthBox = document.querySelector('.bot-health');
// Difficulty Modal Elements
const difficultyModal = document.getElementById('difficultyModal');
const easyBtn = document.getElementById('easyBtn');
const normalBtn = document.getElementById('normalBtn');
const hardBtn = document.getElementById('hardBtn');
const veryHardBtn = document.getElementById('veryHardBtn');

const VERY_HARD_UNLOCK_WINS = 5;
const PROGRESS_STORAGE_KEY = 'hitCardPokerProgressV1';
const HISTORY_STORAGE_KEY = 'hitCardPokerMatchHistoryV1';
const AUDIO_STORAGE_KEY = 'hitCardPokerAudioSettingsV1';
const MAX_VOLUME_PERCENT = 300;

let gameProgress = { hardWins: 0, veryHardUnlocked: false };
let matchHistory = [];
let lastCardHoverSoundAt = 0;
let masterVolume = 1.4;
let botAreaVisible = true;
let botAreaObserver = null;

// Audio (Web Audio API) without external files.
let audioCtx = null;
function ensureAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    return audioCtx;
}
function playTone(frequency, duration = 0.09, type = 'sine', volume = 0.06) {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    const scaledVolume = Math.max(0, Math.min(1, volume * masterVolume));
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(scaledVolume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
}
function playSound(kind) {
    if (kind === 'select') { playTone(660, 0.07, 'triangle', 0.04); }
    else if (kind === 'hit') { playTone(780, 0.08, 'square', 0.05); setTimeout(() => playTone(980, 0.07, 'square', 0.04), 55); }
    else if (kind === 'stand') { playTone(340, 0.12, 'sine', 0.05); }
    else if (kind === 'win') { playTone(523.25, 0.08, 'triangle', 0.06); setTimeout(() => playTone(659.25, 0.09, 'triangle', 0.06), 80); setTimeout(() => playTone(783.99, 0.12, 'triangle', 0.06), 170); }
    else if (kind === 'loss') { playTone(392, 0.1, 'sawtooth', 0.055); setTimeout(() => playTone(329.63, 0.12, 'sawtooth', 0.055), 90); setTimeout(() => playTone(261.63, 0.14, 'sawtooth', 0.055), 200); }
    else if (kind === 'tie') { playTone(440, 0.08, 'triangle', 0.05); setTimeout(() => playTone(440, 0.08, 'triangle', 0.05), 85); }
    else if (kind === 'hover') { const now = Date.now(); if (now - lastCardHoverSoundAt < 85) return; lastCardHoverSoundAt = now; playTone(560, 0.045, 'sine', 0.03); }
    else if (kind === 'powerup') { playTone(880, 0.1, 'sine', 0.06); setTimeout(() => playTone(1100, 0.1, 'sine', 0.06), 100); setTimeout(() => playTone(1320, 0.15, 'sine', 0.06), 200); }
}

function loadAudioSettings() {
    try {
        const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const value = Number(parsed?.masterVolume);
        if (Number.isFinite(value)) { masterVolume = Math.max(0, Math.min(MAX_VOLUME_PERCENT / 100, value)); }
    } catch (error) { masterVolume = 1.4; }
}
function saveAudioSettings() { localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify({ masterVolume })); }
function syncVolumeUI() {
    if (!volumeSlider || !volumeValue) return;
    const percent = Math.round(masterVolume * 100);
    volumeSlider.max = String(MAX_VOLUME_PERCENT);
    volumeSlider.value = String(percent);
    volumeValue.textContent = `${percent}%`;
}
function setMasterVolumeFromPercent(percentValue) {
    const parsed = Number(percentValue);
    if (!Number.isFinite(parsed)) return;
    masterVolume = Math.max(0, Math.min(MAX_VOLUME_PERCENT / 100, parsed / 100));
    syncVolumeUI();
    saveAudioSettings();
}

function loadProgress() {
    try {
        const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const hardWins = Number(parsed?.hardWins);
        gameProgress.hardWins = Number.isFinite(hardWins) ? Math.max(0, Math.floor(hardWins)) : 0;
        gameProgress.veryHardUnlocked = Boolean(parsed?.veryHardUnlocked) || gameProgress.hardWins >= VERY_HARD_UNLOCK_WINS;
    } catch (error) { gameProgress = { hardWins: 0, veryHardUnlocked: false }; }
}
function saveProgress() { localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(gameProgress)); }
function loadMatchHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!raw) { matchHistory = []; return; }
        const parsed = JSON.parse(raw);
        matchHistory = Array.isArray(parsed) ? parsed : [];
    } catch (error) { matchHistory = []; }
}
function saveMatchHistory() { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(matchHistory)); }
function formatDifficultyText(diff) { const difficultyMap = { easy: 'Easy', normal: 'Normal', hard: 'Hard', veryHard: 'Very Hard' }; return difficultyMap[diff] || 'Unknown'; }
function formatHistoryDate(isoString) { if (!isoString) return '-'; const date = new Date(isoString); if (Number.isNaN(date.getTime())) return '-'; return date.toLocaleString(); }

function renderHistoryModal() {
    const wins = matchHistory.filter(item => item.result === 'win').length;
    const losses = matchHistory.filter(item => item.result === 'loss').length;
    historySummary.textContent = `Total Wins: ${wins} | Total Losses: ${losses}`;
    historyList.innerHTML = '';
    if (matchHistory.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'No match history yet. Finish a full game first.';
        historyList.appendChild(emptyItem);
        return;
    }
    matchHistory.forEach((entry, index) => {
        const item = document.createElement('li');
        item.classList.add(entry.result === 'win' ? 'win' : 'loss');
        const resultText = entry.result === 'win' ? 'WIN' : 'LOSS';
        const difficultyText = formatDifficultyText(entry.difficulty);
        const timeText = formatHistoryDate(entry.playedAt);
        item.innerHTML = `<strong>#${matchHistory.length - index} ${resultText}</strong> - ${difficultyText}<br>Target: ${entry.target} | You: ${entry.playerScore} | Bot: ${entry.botScore}<br><small>${timeText}</small>`;
        historyList.appendChild(item);
    });
}
function addMatchHistory(result) {
    const entry = { result, difficulty: gameState.difficulty, target: gameState.targetNumber, playerScore: gameState.playerScore, botScore: gameState.botScore, playedAt: new Date().toISOString() };
    matchHistory.unshift(entry);
    if (matchHistory.length > 100) { matchHistory = matchHistory.slice(0, 100); }
    saveMatchHistory();
    renderHistoryModal();
}
function updateVeryHardButtonState() {
    if (gameProgress.veryHardUnlocked) {
        veryHardBtn.disabled = false;
        veryHardBtn.textContent = 'Very Hard';
        veryHardBtn.title = '';
        if (veryHardUnlockInfo) veryHardUnlockInfo.style.display = 'none';
        if (veryHardEffectInfo) veryHardEffectInfo.style.display = 'block';
        return;
    }
    const remaining = Math.max(0, VERY_HARD_UNLOCK_WINS - gameProgress.hardWins);
    veryHardBtn.disabled = true;
    veryHardBtn.textContent = `Very Hard (Locked ${gameProgress.hardWins}/${VERY_HARD_UNLOCK_WINS})`;
    veryHardBtn.title = `Win Hard mode ${remaining} more time(s) to unlock Very Hard`;
    if (veryHardUnlockInfo) veryHardUnlockInfo.style.display = 'block';
    if (veryHardEffectInfo) veryHardEffectInfo.style.display = 'none';
}
function registerHardModeWinIfUnlocked() {
    if (gameState.difficulty !== 'hard') return;
    if (gameProgress.veryHardUnlocked) return;
    gameProgress.hardWins += 1;
    if (gameProgress.hardWins >= VERY_HARD_UNLOCK_WINS) { gameProgress.hardWins = VERY_HARD_UNLOCK_WINS; gameProgress.veryHardUnlocked = true; }
    saveProgress();
    updateVeryHardButtonState();
}
function isBotHealthEnabled() { return gameState.difficulty === 'hard' || gameState.difficulty === 'veryHard'; }
function getBotDamageMultiplier() { return 1; }
function shouldHideTargetAtStart() { return gameState.difficulty === 'normal' || gameState.difficulty === 'hard' || gameState.difficulty === 'veryHard'; }
function shouldRevealTargetNow() {
    if (!gameState.targetHidden) return false;
    if (gameState.revealActive) return true;
    if (gameState.difficulty === 'veryHard') { return gameState.currentRound === 4 && gameState.actionsThisRound >= 2; }
    return gameState.currentRound === 1 && gameState.actionsThisRound >= 2;
}
function updateDifficultyDisplay() { const difficultyText = formatDifficultyText(gameState.difficulty); difficultyLabel.textContent = `Difficulty: ${difficultyText}`; }

// Create a deck of cards
function createDeck() {
    const deck = [];
    for (const suit of CARD_SUITS) {
        for (const value of CARD_VALUES) { deck.push({ value, suit }); }
    }
    return deck;
}
function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
function drawCards(deck, count) { return deck.splice(0, count); }
function calculateScore(cards, useX2 = false) {
    const multiplier = useX2 ? 2 : 1;
    return cards.reduce((total, card) => {
        if (card.isJoker || card.isX2 || card.isReveal) return total;
        return total + (CARD_NUMERIC_VALUES[card.value] || 0) * multiplier;
    }, 0);
}

function getMobileStickyCardsData() {
    const revealedCardsCount = getRevealedBotCardsCount();
    return gameState.botTable.map((card, index) => ({ value: card.value, suit: card.suit, hidden: index >= revealedCardsCount }));
}
function renderMobileBotStickyCards() {
    if (!mobileBotStickyCardsEl) return;
    const stickyCards = getMobileStickyCardsData();
    mobileBotStickyCardsEl.innerHTML = '';
    if (stickyCards.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'mobile-sticky-empty';
        emptyEl.textContent = 'No cards yet';
        mobileBotStickyCardsEl.appendChild(emptyEl);
        return;
    }
    stickyCards.forEach((cardData, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = `mobile-sticky-card ${cardData.hidden ? 'hidden' : cardData.suit}`;
        cardEl.style.zIndex = String(index + 1);
        cardEl.style.transform = `rotate(${Math.min(10, index * 2)}deg)`;
        const valueEl = document.createElement('span');
        valueEl.className = 'mini-value';
        valueEl.textContent = cardData.hidden ? '?' : cardData.value;
        const suitEl = document.createElement('span');
        suitEl.className = 'mini-suit';
        suitEl.textContent = cardData.hidden ? '?' : SUIT_SYMBOLS[cardData.suit];
        cardEl.appendChild(valueEl);
        cardEl.appendChild(suitEl);
        mobileBotStickyCardsEl.appendChild(cardEl);
    });
}
function updateMobileBotStickyLabel() { if (!mobileBotStickyLabelEl) return; mobileBotStickyLabelEl.textContent = `Bot (${formatDifficultyText(gameState.difficulty)})`; }
function updateMobileBotStickyHealth() {
    if (!mobileBotStickyHealthFillEl || !mobileBotStickyHealthTextEl) return;
    if (isBotHealthEnabled()) {
        const hp = Math.max(0, gameState.botHealth);
        mobileBotStickyHealthFillEl.style.width = `${hp}%`;
        mobileBotStickyHealthTextEl.textContent = `${hp}%`;
    } else {
        mobileBotStickyHealthFillEl.style.width = '100%';
        mobileBotStickyHealthTextEl.textContent = 'OFF';
    }
}
function refreshMobileBotStickyVisibility() {
    if (!mobileBotStickyEl) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const shouldShow = isMobile && !botAreaVisible;
    mobileBotStickyEl.classList.toggle('show', shouldShow);
}
function initMobileBotStickyObserver() {
    if (!botAreaEl || !mobileBotStickyEl) return;
    if (typeof IntersectionObserver === 'undefined') { botAreaVisible = false; refreshMobileBotStickyVisibility(); return; }
    botAreaObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        botAreaVisible = entry ? entry.isIntersecting : true;
        refreshMobileBotStickyVisibility();
    }, { threshold: 0.2 });
    botAreaObserver.observe(botAreaEl);
}

function getRevealedBotCardsCount() {
    if (gameState.gameOver) { return gameState.botTable.length; }
    // If reveal is active, all bot cards are revealed
    if (gameState.revealActive) { return gameState.botTable.length; }
    return Math.max(0, gameState.botTable.length - 1);
}
function getDisplayedBotScore() {
    if (gameState.gameOver) { return String(gameState.botScore); }
    const revealedCardsCount = getRevealedBotCardsCount();
    if (revealedCardsCount === 0) { return '?'; }
    const revealedScore = calculateScore(gameState.botTable.slice(0, revealedCardsCount), gameState.botX2Active);
    const hiddenCardsCount = gameState.botTable.length - revealedCardsCount;
    return hiddenCardsCount > 0 ? `${revealedScore} + ?` : String(revealedScore);
}

// Create card element
function createCardElement(card, isHidden = false, isPlayer = false, index = 0) {
    const cardEl = document.createElement('div');
    if (card.isJoker) {
        cardEl.className = 'card joker-card';
        cardEl.innerHTML = `<span class="joker-icon">🤡</span><span class="joker-text">JOKER</span><span class="joker-mask">🎭</span>`;
    } else if (card.isX2) {
        cardEl.className = 'card x2-card';
        cardEl.innerHTML = `<span class="x2-icon">✖️</span><span class="x2-text">X2</span><span class="x2-subtext">DOUBLE</span>`;
    } else if (card.isReveal) {
        cardEl.className = 'card reveal-card';
        cardEl.innerHTML = `<span class="reveal-icon">👁️</span><span class="reveal-text">REVEAL</span><span class="reveal-subtext">TARGET</span>`;
    } else {
        cardEl.className = `card ${card.suit}`;
        if (isHidden) {
            cardEl.classList.add('hidden-card');
            cardEl.innerHTML = `<span class="card-value">?</span><span class="card-suit">?</span>`;
        } else {
            if (isPlayer) { cardEl.classList.add('player-card'); cardEl.dataset.index = index; }
            if (card.isTableCard) { cardEl.classList.add('table-card'); }
            cardEl.innerHTML = `<span class="card-value">${card.value}</span><span class="card-suit">${SUIT_SYMBOLS[card.suit]}</span>`;
        }
    }
    return cardEl;
}

function renderPlayerHand() {
    playerHandEl.innerHTML = '';
    gameState.playerHand.forEach((card, index) => {
        const cardEl = createCardElement(card, false, true, index);
        if (gameState.selectedCard === index) { cardEl.classList.add('selected'); }
        if (gameState.currentTurn !== 'player' || gameState.gameOver) { cardEl.classList.add('disabled'); }
        cardEl.addEventListener('mouseenter', () => { if (gameState.currentTurn === 'player' && !gameState.gameOver) { playSound('hover'); } });
        cardEl.addEventListener('click', () => selectCard(index));
        playerHandEl.appendChild(cardEl);
    });
}
function renderBotHand() {
    botHandEl.innerHTML = '';
    const showBotCards = gameState.playerRevealActive; // Show bot's cards when player used reveal
    gameState.botHand.forEach(card => {
        const cardEl = createCardElement(card, !showBotCards);
        botHandEl.appendChild(cardEl);
    });
    renderMobileBotStickyCards();
}
function renderTableCards() {
    playerTableEl.innerHTML = '';
    gameState.playerTable.forEach(card => {
        const cardEl = createCardElement(card);
        cardEl.classList.add('table-card');
        playerTableEl.appendChild(cardEl);
    });
    botTableEl.innerHTML = '';
    const revealedCardsCount = getRevealedBotCardsCount();
    gameState.botTable.forEach((card, index) => {
        const cardEl = createCardElement(card, index >= revealedCardsCount);
        cardEl.classList.add('table-card');
        botTableEl.appendChild(cardEl);
    });
    playerTableCountEl.textContent = gameState.playerTable.length;
    botTableCountEl.textContent = gameState.botTable.length;
    renderMobileBotStickyCards();
}
function updateScores() {
    playerScoreEl.textContent = gameState.playerScore;
    botScoreEl.textContent = getDisplayedBotScore();
    if (gameState.targetHidden && !gameState.gameOver) { targetNumberEl.textContent = '?'; }
    else { targetNumberEl.textContent = gameState.targetNumber; }
}
function updateHealthBars() {
    playerHealthBar.style.width = `${gameState.playerHealth}%`;
    playerHealthText.textContent = `${Math.max(0, gameState.playerHealth)}%`;
    if (isBotHealthEnabled()) {
        botHealthBar.style.width = `${gameState.botHealth}%`;
        botHealthText.textContent = `${Math.max(0, gameState.botHealth)}%`;
        botHealthBox.classList.remove('disabled-health');
    } else {
        botHealthBar.style.width = `100%`;
        botHealthText.textContent = 'OFF';
        botHealthBox.classList.add('disabled-health');
    }
    updateMobileBotStickyHealth();
}

function selectCard(index) {
    if (gameState.currentTurn !== 'player' || gameState.gameOver) return;
    if (gameState.selectedCard === index) { gameState.selectedCard = null; }
    else { gameState.selectedCard = index; playSound('select'); }
    renderPlayerHand();
    updateHitButtonForPowerUps();
}

function updateHitButtonForPowerUps() {
    if (!hitBtn) return;
    const selectedIndex = gameState.selectedCard;
    if (selectedIndex !== null) {
        const selectedCard = gameState.playerHand[selectedIndex];
        if (selectedCard?.isJoker) { hitBtn.textContent = 'USE'; hitBtn.classList.add('btn-swap'); hitBtn.classList.remove('btn-hit'); }
        else if (selectedCard?.isX2) { hitBtn.textContent = 'USE X2'; hitBtn.classList.add('btn-swap'); hitBtn.classList.remove('btn-hit'); }
        else if (selectedCard?.isReveal) { hitBtn.textContent = 'USE'; hitBtn.classList.add('btn-swap'); hitBtn.classList.remove('btn-hit'); }
        else { hitBtn.textContent = 'HIT'; hitBtn.classList.remove('btn-swap'); hitBtn.classList.add('btn-hit'); }
    } else { hitBtn.textContent = 'HIT'; hitBtn.classList.remove('btn-swap'); hitBtn.classList.add('btn-hit'); }
}
function setPlayerControlsEnabled(enabled) {
    const canPlay = enabled && !gameState.gameOver;
    hitBtn.disabled = !canPlay;
    standBtn.disabled = !canPlay;
    if (!canPlay) {
        hitBtn.textContent = 'HIT';
        hitBtn.classList.remove('btn-swap');
        hitBtn.classList.add('btn-hit');
    } else { updateHitButtonForPowerUps(); }
}
function getNextActor(actor) { return actor === 'player' ? 'bot' : 'player'; }

// Show power-up confirmation modal
function showPowerUpConfirmModal(cardType) {
    gameState.pendingPowerUpAction = cardType;
    if (cardType === 'joker') {
        powerUpConfirmTitle.textContent = 'Use Joker?';
        powerUpConfirmIcon.textContent = '🤡';
        powerUpConfirmMessage.textContent = 'The Joker lets you swap cards with enemy or reshuffle enemy hand. This power-up can only be used once!';
    } else if (cardType === 'x2') {
        powerUpConfirmTitle.textContent = 'Activate X2?';
        powerUpConfirmIcon.textContent = '✖️';
        powerUpConfirmMessage.textContent = 'X2 doubles the value of ALL your hit cards for the rest of this game! This power-up can only be used once!';
    } else if (cardType === 'reveal') {
        powerUpConfirmTitle.textContent = 'Reveal Target?';
        powerUpConfirmIcon.textContent = '👁️';
        powerUpConfirmMessage.textContent = 'This will reveal the target number AND show all enemy cards throughout the game! This power-up can only be used once!';
    }
    powerUpConfirmModal.classList.add('show');
}
function hidePowerUpConfirmModal() {
    gameState.pendingPowerUpAction = null;
    powerUpConfirmModal.classList.remove('show');
}

// Show Joker preview modal (for Swap Card)
function showJokerPreviewModal(action) {
    gameState.pendingJokerAction = action;
    jokerPreviewTitle.textContent = 'Swap Card';
    jokerPreviewWarning.textContent = 'All your cards will be swapped with the enemy!';
    
    // Show enemy cards
    jokerPreviewCards.innerHTML = '';
    gameState.botHand.forEach(card => {
        const cardEl = createCardElement(card, false, false, 0);
        jokerPreviewCards.appendChild(cardEl);
    });
    
    jokerPreviewModal.classList.add('show');
}
function hideJokerPreviewModal() {
    gameState.pendingJokerAction = null;
    jokerPreviewModal.classList.remove('show');
}

function proceedTurnFlow(message) {
    if (gameState.gameOver) return;
    gameState.actionsThisRound += 1;
    updateStatus(message);
    if (shouldRevealTargetNow()) { gameState.targetHidden = false; updateScores(); }
    if (gameState.actionsThisRound >= 2) {
        if (gameState.currentRound >= gameState.totalRounds) { determineWinner(); return; }
        gameState.currentRound += 1;
        gameState.actionsThisRound = 0;
        gameState.currentTurn = gameState.firstActor;
        updateStatus(`Round ${gameState.currentRound}: ${gameState.currentTurn === 'player' ? 'Your turn' : "Bot's turn"}.`);
        updateReshuffleUI();
    } else { gameState.currentTurn = getNextActor(gameState.currentTurn); }
    renderPlayerHand();
    renderTableCards();
    updateScores();
    setPlayerControlsEnabled(gameState.currentTurn === 'player');
    updateReshuffleUI();
    if (gameState.currentTurn === 'bot' && !gameState.gameOver) { setTimeout(botTurn, 900); }
}

// Player hit action
function playerHit() {
    if (gameState.gameOver || gameState.currentTurn !== 'player') return;
    const selectedCard = gameState.playerHand[gameState.selectedCard];
    
    // Handle power-up cards - show confirmation first
    if (selectedCard?.isJoker) { showJokerPreviewModal('swap'); return; }
    if (selectedCard?.isX2) { showPowerUpConfirmModal('x2'); return; }
    if (selectedCard?.isReveal) { showPowerUpConfirmModal('reveal'); return; }
    
    if (gameState.playerHand.length === 0) { playerStand(); return; }
    if (gameState.selectedCard === null) { updateStatus('Please select a card first!'); return; }
    
    const card = gameState.playerHand.splice(gameState.selectedCard, 1)[0];
    gameState.playerTable.push(card);
    gameState.playerScore = calculateScore(gameState.playerTable, gameState.x2Active);
    gameState.selectedCard = null;
    playSound('hit');
    renderPlayerHand();
    renderTableCards();
    updateScores();
    updateHitButtonForPowerUps();
    proceedTurnFlow(`Round ${gameState.currentRound}: You HIT ${card.value}${SUIT_SYMBOLS[card.suit]}. Score: ${gameState.playerScore}`);
}

// Execute confirmed power-up
function executePowerUp() {
    const action = gameState.pendingPowerUpAction;
    if (!action) return;
    
    const selectedIndex = gameState.selectedCard;
    const selectedCard = gameState.playerHand[selectedIndex];
    
    if (action === 'joker') {
        // Joker is handled via separate buttons, just close modal and show buttons
        hidePowerUpConfirmModal();
            return;
    } else if (action === 'x2') {
        const x2Index = gameState.playerHand.findIndex(card => card.isX2);
        if (x2Index !== -1) { gameState.playerHand.splice(x2Index, 1); }
        gameState.x2Active = true;
        updateStatus('X2 activated! Next card you hit will have 2x value!');
        playSound('powerup');
        const x2TableIndex = gameState.playerTable.findIndex(card => card.isX2);
        if (x2TableIndex !== -1) { gameState.playerTable.splice(x2TableIndex, 1); }
        renderPlayerHand();
        renderTableCards();
        updateHitButtonForPowerUps();
            proceedTurnFlow(`Round ${gameState.currentRound}: X2 activated! Next hit card will be doubled.`);
    } else if (action === 'reveal') {
        const revealIndex = gameState.playerHand.findIndex(card => card.isReveal);
        if (revealIndex !== -1) { gameState.playerHand.splice(revealIndex, 1); }
        gameState.playerRevealActive = true;
        gameState.revealActive = true;
        gameState.targetHidden = false;
        updateScores();
        updateStatus(`Reveal activated! Target is ${gameState.targetNumber}! Enemy cards are now visible!`);
        playSound('powerup');
        const revealTableIndex = gameState.playerTable.findIndex(card => card.isReveal);
        if (revealTableIndex !== -1) { gameState.playerTable.splice(revealTableIndex, 1); }
        renderPlayerHand();
        renderTableCards();
        updateHitButtonForPowerUps();
            proceedTurnFlow(`Round ${gameState.currentRound}: Target revealed! Target: ${gameState.targetNumber}`);
    }
    hidePowerUpConfirmModal();
}

// Player stand action
function playerStand() {
    if (gameState.gameOver || gameState.currentTurn !== 'player') return;
    gameState.selectedCard = null;
    playSound('stand');
    renderPlayerHand();
    renderTableCards();
    updateScores();
    proceedTurnFlow(`Round ${gameState.currentRound}: You STAND. Score stays ${gameState.playerScore}.`);
}

// Joker: Swap Card
function swapCard() {
    if (gameState.gameOver || gameState.currentTurn !== 'player') return;
    const selectedIndex = gameState.selectedCard;
    if (selectedIndex === null) return;
    const selectedCard = gameState.playerHand[selectedIndex];
    if (!selectedCard?.isJoker) return;
    
    // First show power-up confirmation
    showPowerUpConfirmModal('joker');
}

// Execute confirmed Joker action
function executeJokerAction() {
    const action = gameState.pendingJokerAction;
    const selectedIndex = gameState.selectedCard;
    if (selectedIndex === null) return;
    
    // Remove joker from hand
    gameState.playerHand.splice(selectedIndex, 1);
    
    if (action === 'swap') {
        const tempHand = [...gameState.playerHand];
        gameState.playerHand = [...gameState.botHand];
        gameState.botHand = tempHand;
        gameState.playerScore = calculateScore(gameState.playerTable, gameState.x2Active);
        gameState.botScore = calculateScore(gameState.botTable, gameState.botX2Active);
        updateStatus('Joker used! All cards swapped with opponent!');
        playSound('hit');
    } else if (action === 'reshuffle') {
        gameState.botHand = shuffleDeck(gameState.botHand);
        updateStatus('Joker used! Bot hand has been reshuffled!');
        playSound('hit');
    }
    
    gameState.selectedCard = null;
    renderPlayerHand();
    renderBotHand();
    updateScores();
    updateHitButtonForPowerUps();
    hideJokerPreviewModal();
    hidePowerUpConfirmModal();
    proceedTurnFlow(`Round ${gameState.currentRound}: Joker action completed!`);
}

// Bot's turn logic
function botTurn() {
    if (gameState.gameOver || gameState.currentTurn !== 'bot') return;
    const botHand = gameState.botHand;
    const hasX2 = botHand.some(card => card.isX2);
    const hasReveal = botHand.some(card => card.isReveal);
    const hasJoker = botHand.some(card => card.isJoker);
    const powerUpChance = { 'easy': 0.05, 'normal': 0.15, 'hard': 0.30, 'veryHard': 0.50 };
    const chance = powerUpChance[gameState.difficulty] || 0.15;
    
    if (hasX2 && !gameState.botX2Active && Math.random() < chance) {
        const x2Index = botHand.findIndex(card => card.isX2);
        if (x2Index !== -1) {
            botHand.splice(x2Index, 1);
            gameState.botX2Active = true;
            const x2TableIndex = gameState.botTable.findIndex(card => card.isX2);
            if (x2TableIndex !== -1) { gameState.botTable.splice(x2TableIndex, 1); }
            updateStatus('Bot used X2! Next card bot hits will have 2x value!');
            playSound('powerup');
            renderBotHand();
            renderTableCards();
            proceedTurnFlow(`Round ${gameState.currentRound}: Bot used X2! Next hit card will be doubled.`);
            return;
        }
    }
    
    if (hasReveal && !gameState.revealActive && gameState.targetHidden && Math.random() < chance) {
        const revealIndex = botHand.findIndex(card => card.isReveal);
        if (revealIndex !== -1) {
            botHand.splice(revealIndex, 1);
            gameState.botRevealActive = true;
            gameState.revealActive = true;
            const revealTableIndex = gameState.botTable.findIndex(card => card.isReveal);
            if (revealTableIndex !== -1) { gameState.botTable.splice(revealTableIndex, 1); }
            gameState.targetHidden = false;
            updateScores();
            updateStatus('Bot used Reveal! Your cards are now visible!');
            playSound('powerup');
            renderPlayerHand();
            renderBotHand();
            renderTableCards();
            proceedTurnFlow(`Round ${gameState.currentRound}: Bot revealed your cards!`);
            return;
        }
    }
    
    if (hasJoker && Math.random() < chance) {
        const jokerIndex = botHand.findIndex(card => card.isJoker);
        if (jokerIndex !== -1) {
            botHand.splice(jokerIndex, 1);
            const action = Math.random() < 0.5 ? 'reshuffle' : 'swap';
            if (action === 'reshuffle') {
                gameState.playerHand = shuffleDeck(gameState.playerHand);
                renderPlayerHand();
                updateStatus('Bot used Joker! Your hand has been reshuffled.');
            } else {
                const tempHand = [...gameState.playerHand];
                gameState.playerHand = [...gameState.botHand];
                gameState.botHand = tempHand;
                renderPlayerHand();
                renderBotHand();
                updateStatus('Bot used Joker! All cards swapped!');
            }
            playSound('hit');
            proceedTurnFlow(`Round ${gameState.currentRound}: Bot used JOKER!`);
            return;
        }
    }
    
    const botShouldHit = botDecideHit() && gameState.botHand.length > 0;
    if (botShouldHit) {
        const bestCardIndex = getBestBotCardIndex();
        const chosenIndex = gameState.difficulty === 'veryHard' && bestCardIndex !== -1 ? bestCardIndex : Math.floor(Math.random() * gameState.botHand.length);
        const card = gameState.botHand.splice(chosenIndex, 1)[0];
        gameState.botTable.push(card);
        gameState.botScore = calculateScore(gameState.botTable, gameState.botX2Active);
        renderBotHand();
        renderTableCards();
        updateScores();
        proceedTurnFlow(`Round ${gameState.currentRound}: Bot HIT. Score: ${getDisplayedBotScore()}`);
    } else {
        proceedTurnFlow(`Round ${gameState.currentRound}: Bot STAND. Bot score: ${getDisplayedBotScore()}.`);
    }
}

function botDecideHit() {
    const currentScore = gameState.botScore;
    const target = gameState.targetNumber;
    const difficulty = gameState.difficulty;
    if (difficulty === 'veryHard') {
        if (gameState.botHand.length === 0) { return false; }
        const currentDiff = Math.abs(target - currentScore);
        const bestMove = analyzeBestBotMove();
        if (!bestMove) return false;
        if (bestMove.bestDiff === 0) return true;
        if (bestMove.bestDiff < currentDiff) return true;
        if (bestMove.bestDiff === currentDiff && currentScore < target && bestMove.bestScore > currentScore) { return true; }
        return false;
    }
    if (difficulty === 'easy') {
        if (Math.random() < 0.3) return true;
        if (currentScore >= target - 2) return false;
        return Math.random() < 0.5;
    }
    const possibleScores = gameState.botHand.map(card => CARD_NUMERIC_VALUES[card.value]);
    const remaining = target - currentScore;
    if (possibleScores.includes(remaining)) { return true; }
    if (currentScore >= target - 2 && currentScore <= target) { return Math.random() < 0.1; }
    if (currentScore >= target - 5 && currentScore < target - 2) { return Math.random() < 0.4; }
    return Math.random() < 0.8;
}

function analyzeBestBotMove() {
    if (gameState.botHand.length === 0) return null;
    const target = gameState.targetNumber;
    const currentScore = gameState.botScore;
    let best = null;
    for (let i = 0; i < gameState.botHand.length; i++) {
        const card = gameState.botHand[i];
        if (card.isJoker || card.isX2 || card.isReveal) continue;
        const cardValue = CARD_NUMERIC_VALUES[card.value];
        const multiplier = gameState.x2Active ? 2 : 1;
        const nextScore = currentScore + (cardValue * multiplier);
        const nextDiff = Math.abs(target - nextScore);
        if (!best) { best = { index: i, bestScore: nextScore, bestDiff: nextDiff }; continue; }
        const isBetterDiff = nextDiff < best.bestDiff;
        const sameDiffPreferNoOvershoot = nextDiff === best.bestDiff && nextScore <= target && best.bestScore > target;
        const sameDiffBothSameSidePreferHigher = nextDiff === best.bestDiff && ((nextScore <= target && best.bestScore <= target && nextScore > best.bestScore) || (nextScore > target && best.bestScore > target && nextScore < best.bestScore));
        if (isBetterDiff || sameDiffPreferNoOvershoot || sameDiffBothSameSidePreferHigher) { best = { index: i, bestScore: nextScore, bestDiff: nextDiff }; }
    }
    return best;
}
function getBestBotCardIndex() { const bestMove = analyzeBestBotMove(); return bestMove ? bestMove.index : -1; }

function calculateDamage(winnerScore, target) { const diff = Math.abs(target - winnerScore); return Math.max(10, 40 - (diff * 1.5)); }
function applyPendingHealthUpdate() {
    if (!gameState.pendingHealthUpdate) return;
    const { winner, damageDealt } = gameState.pendingHealthUpdate;
    if (damageDealt > 0) {
        if (winner === 'player' && isBotHealthEnabled()) { gameState.botHealth -= damageDealt; }
        else if (winner === 'bot') { gameState.playerHealth -= damageDealt; }
    }
    gameState.pendingHealthUpdate = null;
    updateHealthBars();
}

function determineWinner() {
    if (gameState.winnerEvaluationInProgress) return;
    gameState.winnerEvaluationInProgress = true;
    updateStatus('Round 7: Revealing all bot cards...');
    gameState.gameOver = true;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    renderTableCards();
    updateScores();
    const target = gameState.targetNumber;
    const playerExact = gameState.playerScore === target;
    const botExact = gameState.botScore === target;
    const playerDiff = Math.abs(target - gameState.playerScore);
    const botDiff = Math.abs(target - gameState.botScore);
    let winner, message;
    let damageDealt = 0;
    if (playerExact && botExact) { winner = 'tie'; message = `Tie! Both hit the exact target (${target}).`; }
    else if (playerExact) { winner = 'player'; message = `Great! Your score is exactly the target (${target}).`; damageDealt = calculateDamage(gameState.playerScore, target); }
    else if (botExact) { winner = 'bot'; message = `Bot hit the exact target (${target}).`; damageDealt = calculateDamage(gameState.botScore, target); }
    else if (playerDiff < botDiff) { winner = 'player'; message = `You win! Your score (${gameState.playerScore}) is closer to ${target}.`; damageDealt = calculateDamage(gameState.playerScore, target); }
    else if (botDiff < playerDiff) { winner = 'bot'; message = `Bot wins. Bot score (${gameState.botScore}) is closer to ${target}.`; damageDealt = calculateDamage(gameState.botScore, target); }
    else { winner = 'tie'; message = `Tie! Same difference from target ${target}.`; }
    const botHandCardsToShow = [...gameState.botHand];
    botHandEl.innerHTML = '';
    botHandCardsToShow.forEach(card => { const cardEl = createCardElement(card); botHandEl.appendChild(cardEl); });
    if (winner === 'player' && isBotHealthEnabled()) { message += ` You will deal ${damageDealt} damage to Bot after Play Again.`; }
    else if (winner === 'bot') { damageDealt = Math.round(damageDealt * getBotDamageMultiplier()); message += ` Bot will deal ${damageDealt} damage to you after Play Again.`; }
    gameState.pendingHealthUpdate = { winner, damageDealt };
    updateStatus('Round 7: Evaluating winner...');
    setTimeout(() => { endGame(winner, message); }, 2000);
}

function endGame(winner, message) {
    if (resultModal.classList.contains('show')) return;
    if (winner === 'player') { addMatchHistory('win'); }
    else if (winner === 'bot') { addMatchHistory('loss'); }
    if (gameState.playerHealth <= 0) {
        playSound('loss');
        resultTitle.textContent = '🤖 Bot Wins the Game!';
        resultTitle.style.color = '#e94560';
        resultMessage.innerHTML = `Your health reached 0.<br><br>${message}`;
        resultModal.classList.add('show');
        return;
    }
    if (isBotHealthEnabled() && gameState.botHealth <= 0) {
        playSound('win');
        resultTitle.textContent = '👤 You Win the Game!';
        resultTitle.style.color = '#4ecca3';
        resultMessage.innerHTML = `Bot's health reached 0.<br><br>${message}`;
        resultModal.classList.add('show');
        return;
    }
    if (winner === 'player') { resultTitle.textContent = '👤 You Win!'; resultTitle.style.color = '#4ecca3'; playSound('win'); }
    else if (winner === 'bot') { resultTitle.textContent = '🤖 Bot Wins!'; resultTitle.style.color = '#e94560'; playSound('loss'); }
    else { resultTitle.textContent = '🤝 It\'s a Tie!'; resultTitle.style.color = '#ffd93d'; playSound('tie'); }
    resultMessage.innerHTML = `<strong>Target:</strong> ${gameState.targetNumber}<br><strong>Your Score:</strong> ${gameState.playerScore}<br><strong>Bot Score:</strong> ${gameState.botScore}<br><strong>Your Health:</strong> ${gameState.playerHealth}%<br><strong>Bot Health:</strong> ${isBotHealthEnabled() ? `${gameState.botHealth}%` : 'OFF'}<br><br>${message}`;
    resultModal.classList.add('show');
}
function updateStatus(message) { gameStatusEl.textContent = message; }

function performReshuffle(actor) {
    const isPlayer = actor === 'player';
    const reshuffleCount = isPlayer ? gameState.playerReshuffleCount : gameState.botReshuffleCount;
    if (reshuffleCount >= gameState.maxReshuffles) { if (isPlayer) { updateStatus('You have used all your reshuffles!'); } return; }
    const hand = isPlayer ? gameState.playerHand : gameState.botHand;
    const nonJokerIndices = hand.map((card, index) => !card.isJoker && !card.isX2 && !card.isReveal ? index : -1).filter(i => i !== -1);
    if (nonJokerIndices.length === 0) { if (isPlayer) { updateStatus('No cards to reshuffle!'); } return; }
    const numCardsToReplace = Math.min(Math.floor(Math.random() * 3) + 1, nonJokerIndices.length);
    const indicesToReplace = [];
    while (indicesToReplace.length < numCardsToReplace) {
        const randomIndex = Math.floor(Math.random() * nonJokerIndices.length);
        if (!indicesToReplace.includes(nonJokerIndices[randomIndex])) { indicesToReplace.push(nonJokerIndices[randomIndex]); }
    }
    
    // Create filtered deck excluding all cards currently in play
    const allCardsInPlay = [...gameState.playerHand, ...gameState.botHand, ...gameState.playerTable, ...gameState.botTable];
    let deck = createDeck();
    deck = deck.filter(newCard => {
        return !allCardsInPlay.some(playedCard => 
            playedCard.value === newCard.value && playedCard.suit === newCard.suit
        );
    });
    shuffleDeck(deck);
    
    indicesToReplace.sort((a, b) => b - a);
    for (const index of indicesToReplace) { hand.splice(index, 1); }
    const newCards = drawCards(deck, numCardsToReplace);
    hand.push(...newCards);
    if (Math.random() < 0.20) {
        const powerUpType = Math.random();
        if (powerUpType < 0.33) { hand.push({ value: 'JOKER', suit: 'JOKER', isJoker: true }); }
        else if (powerUpType < 0.66) { hand.push({ value: 'X2', suit: 'X2', isX2: true }); }
        else { hand.push({ value: 'REVEAL', suit: 'REVEAL', isReveal: true }); }
    }
    if (isPlayer) { gameState.playerReshuffleCount++; }
    else { gameState.botReshuffleCount++; }
    updateReshuffleUI();
    if (isPlayer) { renderPlayerHand(); updateStatus(`You reshuffled ${numCardsToReplace} card(s). (${gameState.playerReshuffleCount}/${gameState.maxReshuffles})`); playSound('select'); }
    else { renderBotHand(); updateStatus(`Bot used reshuffle. (${gameState.botReshuffleCount}/${gameState.maxReshuffles})`); playSound('stand'); }
}
function updateReshuffleUI() {
    playerReshuffleCountEl.textContent = gameState.playerReshuffleCount;
    botReshuffleCountEl.textContent = gameState.botReshuffleCount;
    if (reshuffleBtn) { reshuffleBtn.disabled = gameState.playerReshuffleCount >= gameState.maxReshuffles || gameState.gameOver || gameState.currentTurn !== 'player'; }
}
function openRulesModal() { rulesModal.classList.add('show'); }
function closeRulesModal() { rulesModal.classList.remove('show'); }
function openHistoryModal() { renderHistoryModal(); historyModal.classList.add('show'); }
function closeHistoryModal() { historyModal.classList.remove('show'); }
function blurActiveElement() { if (document.activeElement && typeof document.activeElement.blur === 'function') { document.activeElement.blur(); } }

function startNewGame() {
    gameState = {
        ...gameState,
        targetNumber: 0,
        playerHand: [],
        botHand: [],
        playerTable: [],
        botTable: [],
        playerScore: 0,
        botScore: 0,
        totalRounds: 6,
        currentRound: 1,
        actionsThisRound: 0,
        firstActor: Math.random() < 0.5 ? 'player' : 'bot',
        currentTurn: 'player',
        selectedCard: null,
        winnerEvaluationInProgress: false,
        pendingHealthUpdate: null,
        gameOver: false,
        targetHidden: shouldHideTargetAtStart(),
        playerReshuffleCount: 0,
        botReshuffleCount: 0,
        x2Active: false,
        botX2Active: false,
        revealActive: false,
        playerRevealActive: false,
        botRevealActive: false,
        pendingPowerUpAction: null,
        pendingJokerAction: null
    };
    if (gameState.playerHealth <= 0 || gameState.botHealth <= 0) { gameState.playerHealth = 100; gameState.botHealth = 100; updateHealthBars(); }
    gameState.currentTurn = gameState.firstActor;
    const deck = shuffleDeck(createDeck());
    gameState.targetNumber = Math.floor(Math.random() * 43) + 8;
    gameState.playerHand = drawCards(deck, 5);
    gameState.botHand = drawCards(deck, 5);
    const powerUpChance = 0.25;
    if (Math.random() < powerUpChance) {
        const powerUpType = Math.random();
        if (powerUpType < 0.33) { gameState.playerHand.push({ value: 'JOKER', suit: 'JOKER', isJoker: true }); }
        else if (powerUpType < 0.66) { gameState.playerHand.push({ value: 'X2', suit: 'X2', isX2: true }); }
        else { gameState.playerHand.push({ value: 'REVEAL', suit: 'REVEAL', isReveal: true }); }
    }
    if (Math.random() < powerUpChance) {
        const powerUpType = Math.random();
        if (powerUpType < 0.33) { gameState.playerHand.push({ value: 'JOKER', suit: 'JOKER', isJoker: true }); }
        else if (powerUpType < 0.66) { gameState.playerHand.push({ value: 'X2', suit: 'X2', isX2: true }); }
        else { gameState.playerHand.push({ value: 'REVEAL', suit: 'REVEAL', isReveal: true }); }
    }
    if (Math.random() < powerUpChance) {
        const powerUpType = Math.random();
        if (powerUpType < 0.33) { gameState.botHand.push({ value: 'JOKER', suit: 'JOKER', isJoker: true }); }
        else if (powerUpType < 0.66) { gameState.botHand.push({ value: 'X2', suit: 'X2', isX2: true }); }
        else { gameState.botHand.push({ value: 'REVEAL', suit: 'REVEAL', isReveal: true }); }
    }
    if (Math.random() < powerUpChance) {
        const powerUpType = Math.random();
        if (powerUpType < 0.33) { gameState.botHand.push({ value: 'JOKER', suit: 'JOKER', isJoker: true }); }
        else if (powerUpType < 0.66) { gameState.botHand.push({ value: 'X2', suit: 'X2', isX2: true }); }
        else { gameState.botHand.push({ value: 'REVEAL', suit: 'REVEAL', isReveal: true }); }
    }
    targetNumberEl.textContent = gameState.targetNumber;
    renderPlayerHand();
    renderBotHand();
    renderTableCards();
    updateScores();
    updateDifficultyDisplay();
    updateHealthBars();
    updateMobileBotStickyLabel();
    updateReshuffleUI();
    setPlayerControlsEnabled(gameState.currentTurn === 'player');
    resultModal.classList.remove('show');
    blurActiveElement();
    updateStatus(`Game started! Round 1. ${gameState.currentTurn === 'player' ? 'Your turn first.' : 'Bot moves first.'}`);
    if (gameState.currentTurn === 'bot') { setTimeout(botTurn, 900); }
}

function selectDifficulty(diff) {
    if (!difficultyModal.classList.contains('show')) return;
    if (diff === 'veryHard' && !gameProgress.veryHardUnlocked) return;
    gameState.difficulty = diff;
    gameState.playerHealth = 100;
    gameState.botHealth = 100;
    difficultyModal.classList.remove('show');
    blurActiveElement();
    updateDifficultyDisplay();
    updateMobileBotStickyLabel();
    startNewGame();
}

// Event listeners
hitBtn.addEventListener('click', playerHit);
standBtn.addEventListener('click', playerStand);
newGameBtn.addEventListener('click', () => { if (gameState.playerHealth <= 0 || gameState.botHealth <= 0) { difficultyModal.classList.add('show'); } else { startNewGame(); } });
playAgainBtn.addEventListener('click', () => {
    if (!resultModal.classList.contains('show')) return;
    const pendingBeforeApply = gameState.pendingHealthUpdate ? { ...gameState.pendingHealthUpdate } : null;
    applyPendingHealthUpdate();
    if (pendingBeforeApply && pendingBeforeApply.winner === 'player' && gameState.botHealth <= 0) { registerHardModeWinIfUnlocked(); }
    if (gameState.playerHealth <= 0 || gameState.botHealth <= 0) { gameState.playerHealth = 100; gameState.botHealth = 100; updateHealthBars(); }
    startNewGame();
});
rulesBtn.addEventListener('click', openRulesModal);
historyBtn.addEventListener('click', openHistoryModal);
changeDifficultyBtn.addEventListener('click', () => difficultyModal.classList.add('show'));
closeRulesBtn.addEventListener('click', closeRulesModal);
closeHistoryBtn.addEventListener('click', closeHistoryModal);
rulesModal.addEventListener('click', (event) => { if (event.target === rulesModal) { closeRulesModal(); } });
historyModal.addEventListener('click', (event) => { if (event.target === historyModal) { closeHistoryModal(); } });
if (volumeSlider) { volumeSlider.addEventListener('input', (event) => { setMasterVolumeFromPercent(event.target.value); }); }
window.addEventListener('resize', refreshMobileBotStickyVisibility);
easyBtn.addEventListener('click', () => selectDifficulty('easy'));
normalBtn.addEventListener('click', () => selectDifficulty('normal'));
hardBtn.addEventListener('click', () => selectDifficulty('hard'));
veryHardBtn.addEventListener('click', () => selectDifficulty('veryHard'));
reshuffleBtn.addEventListener('click', () => performReshuffle('player'));
// Joker action buttons
swapCardBtn.addEventListener('click', swapCard);
reshuffleEnemyBtn.addEventListener('click', () => { showJokerPreviewModal('reshuffle'); });
// Power-up confirmation modal
confirmPowerUpBtn.addEventListener('click', executePowerUp);
cancelPowerUpBtn.addEventListener('click', hidePowerUpConfirmModal);
powerUpConfirmModal.addEventListener('click', (event) => { if (event.target === powerUpConfirmModal) { hidePowerUpConfirmModal(); } });
// Joker preview modal
confirmJokerActionBtn.addEventListener('click', executeJokerAction);
cancelJokerActionBtn.addEventListener('click', hideJokerPreviewModal);
jokerPreviewModal.addEventListener('click', (event) => { if (event.target === jokerPreviewModal) { hideJokerPreviewModal(); } });

// Initialize game
window.onload = () => {
    loadAudioSettings();
    syncVolumeUI();
    loadProgress();
    loadMatchHistory();
    renderHistoryModal();
    updateVeryHardButtonState();
    initMobileBotStickyObserver();
    renderMobileBotStickyCards();
    refreshMobileBotStickyVisibility();
    updateMobileBotStickyLabel();
    difficultyModal.classList.add('show');
};
