/**
 * File: scripts.js
 * Author: Cory Bateman     
 * Date: 06/08/2025
 * Description: This script is used for the tick-tac-toe game.
 */

/**
 * Human Player Icon
 * @const {string}
 */
const player_2 = 'X';
/**
 * Computer Player Icon
 * @const {string}
 */
const player_1 = 'O';
/**
 * Number of board spaces
 * @const {number}
 */
const num_board_spaces = 9;
/**
 * Winning combinations for the game
 * @const {Array}
 */
const winning_combos = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7], [2, 5, 8], [3, 6, 9], [1, 5, 9], [3, 5, 7]];
/**
 * Board spaces in the game
 * @const {NodeList}
 */                         
const board = document.querySelectorAll('.board-space');

let start_clear_button = document.querySelector('#start-clear');

let current_game_state = null;
let game_state_file_handle = null;
let assigned_player = null;


// Game state logic
async function loadGameStateJson() {
    const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Game State JSON File', accept: { 'application/json': ['.json'] } }],
        excludeAcceptAllOption: true,
        multiple: false
    });

    const file = await fileHandle.getFile();
    const contents = await file.text();
    const gameState = JSON.parse(contents);

    game_state_file_handle = fileHandle;
    current_game_state = gameState;

    alert("You have joined the game!");
    start_clear_button.disabled = false;
    //need to update board here
}

// File creation
async function createGameStateJson() {
    const fileHandle = await window.showSaveFilePicker({
        suggestedName: 'game_state.json',
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
        excludeAcceptAllOption: true
    });

    const writable = await fileHandle.createWritable();

    const makeState = {
        current_status: 'player_assign',
        current_player: null,
        move_number: 1,
        game_over: false,
        last_winner: null,
        player_1: { name: "Player 1", icon: player_1, held_positions: [] },
        player_2: { name: "Player 2", icon: player_2, held_positions: [] },
    };

    await writable.write(JSON.stringify(makeState));
    await writable.close();

    game_state_file_handle = fileHandle;
    current_game_state = makeState;

    alert("Game Created Successfully!");
    start_clear_button.disabled = false;
    //need to update board here
}




/**
 * Checks if the player has a winning combination or if the game is a draw.
 * Highlights the winning combination if the player has won.
 * @param {string} player - The player to check for a win.
 * @returns boolean - Returns true if the player has won, false otherwise.
 */
function isWinner(player_icon) {
    const held_positions = player_icon === player_1 ? current_game_state.player_1.held_positions : current_game_state.player_2.held_positions;
    for (const combo of winning_combos) {
        if (combo.every(pos => held_positions.includes(pos.toString()))) {
            highligtWinningCombo(combo);
            setGameOver(true, player_icon);
            return true;
        }
    }
    if (current_game_state.move_number > num_board_spaces) {
        setGameOver(true);
        return true;
    }
    return false;
}

/**
 * Sets the game over state and displays an alert based on the outcome.
 * @param {boolean} is_game_over - The game over state.
 * @param {string} player - The player who won, if applicable.
 * @return {void}
 */
async function setGameOver(is_game_over, player = '') {
    current_game_state.game_over = is_game_over;

    if (is_game_over && player === '') {
        disableBoard();
        alert("It's a draw!");
        return;
    }

    if (is_game_over && player === current_game_state.player_1.icon) {
        disableBoard();
        current_game_state.last_winner = current_game_state.player_1.name;
        await saveGameState();
        alert("Player 1 Wins!");

    } else if (is_game_over && player === current_game_state.player_2.icon) {
        disableBoard();
        current_game_state.last_winner = current_game_state.player_2.name;
        await saveGameState()
        alert("Player 2 Wins!");
    }
}

/**
 * Swaps the current player and handles the game state accordingly.
 * @param {string} player - The current player.
 * @return {void}
 */
function swapPlayer() {
    current_game_state.current_player =
        current_game_state.current_player === player_1 ? player_2 : player_1;
}

// GUI Logic

/**
 * Starts the game or clears the board based on the button state.
 * If the button value is 'Start', it initializes the game.
 * If the button value is 'Clear', it resets the game state.
 * @param {Event} event - The click event on the board space, signifying human player starting the game. Defaults to null.
 * @return {void}
 */
function startGame(event = null) {
    if (start_clear_button.value === 'Start') {
        start_clear_button.value = 'Clear';
        if (event) {
            current_player = human_player;
            playerMove(event);
        }
        if (current_player === computer_player) {
            game_started = true;
            disableBoard();
            setTimeout(() => {
                computerMove();
            }, 500);
        }
        
    } else {
        resetGame();
    }
}

/**
 * Handles the click event on the board spaces.
 * If the game has not started, it initializes the game.
 * If the game is ongoing and the clicked space is empty, it processes the player's move.
 * @param {Event} event - The click event on the board space.
 * @return {void}
 */
document.addEventListener('click', function(event) {
    if (!game_started && event.target.classList.contains('board-space')) {
        current_player = human_player;
        game_started = true;
        startGame(event);
        return;
    }

    if (event.target.classList.contains('board-space') && !game_over && current_player === human_player) {
        playerMove(event);
    }
});

/**
 * Handles the player's move on the board.
 * If the clicked space is empty and the game is not over, it marks the space with the human player's symbol.
 * It checks for a win or a draw after the move.
 * If the game is not over, it swaps the player to the computer.
 * @param {Event} event - The click event on the board space.
 * @return {void}
 */
async function playerMove(event) {
    if (!current_game_state || current_game_state.game_over) return;

    const target = event.target;
    const pos = target.id;

    if (target.value !== '') return;

    const current_icon = current_game_state.current_player;

    target.value = current_icon;
    current_game_state.move_number++;

    if (current_icon === player_1) {
        current_game_state.player_1.held_positions.push(pos);
    } else {
        current_game_state.player_2.held_positions.push(pos);
    }

    if (!isWinner(current_icon)) {
        swapPlayer();
    }

    await saveGameState();
    updateBoard();
}

document.addEventListener('click', async function (event) {
    if (event.target.classList.contains('board-space')) {
        await playerMove(event);
    }

    if (event.target.id === 'start-clear') {

        current_game_state.current_status = 'player_assign';
        current_game_state.current_player = null;
        current_game_state.move_number = 1;
        current_game_state.game_over = false;
        current_game_state.player_1.held_positions = [];
        current_game_state.player_2.held_positions = [];

        await saveGameState();
        updateBoard();
    }
});


/**
 * Disables all board spaces, preventing further moves.
 * This is used when the game is over or when the computer is making a move.
 * @return {void}
 */
function disableBoard() {
    board.forEach(space => {
        space.disabled = true;
    });
}

/**
 * Enables all board spaces, allowing the player to make moves.
 * This is used when the game is reset or when it's the player's turn.
 * @return {void}
 */
function enableBoard() {
    board.forEach(space => {
        space.disabled = false;
    });
}

function updateBoard() {
    board.forEach(space => {
        space.value = '';
        space.disabled = false;
        space.classList.remove('winning-space');
    });

    current_game_state.player_1.held_positions.forEach(pos => {
        const el = document.getElementById(pos);
        if (el) el.value = player_1;
    });

    current_game_state.player_2.held_positions.forEach(pos => {
        const el = document.getElementById(pos);
        if (el) el.value = player_2;
    });

    if (current_game_state.game_over) {
        disableBoard();
    } else {
        enableBoard();
    }
}

/**
 * Highlights the winning combination on the board.
 * It adds a specific class to the winning spaces to visually indicate the win.
 * @param {Array} combo - The winning combination of positions.
 * @return {void}
 */
function highligtWinningCombo(combo) {
    combo.forEach(pos => {
        const space = document.getElementById(pos);
        if (space) {
            space.classList.add('winning-space');
        }
    });
}