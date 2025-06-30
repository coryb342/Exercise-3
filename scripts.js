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
        current_status: 'setting_players',
        current_player: null,
        move_number: 0,
        game_over: false,
        die_roll: null,
        previous_winner: null,
        die_guess_1: null,
        die_guess_2: null,
        player_1: { name: "Player 1", icon: player_1, held_positions: [] },
        player_2: { name: "Player 2", icon: player_2, held_positions: [] },
        player_1_assigned: false,
        player_2_assigned: false
    };

    await writable.write(JSON.stringify(makeState));
    await writable.close();

    game_state_file_handle = fileHandle;
    current_game_state = makeState;

    alert("Game Created Successfully!");
    start_clear_button.disabled = false;
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
    if (current_move > num_board_spaces) {
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
function setGameOver(is_game_over, player = '') {
    if (is_game_over && player === '') {
        disableBoard(); 
        start_clear_button.disabled = false; 
        setTimeout(() => {
            alert("It's a draw!");;
        }, 150); 
        return;
    }
    if (is_game_over && player === current_game_state.player_1.icon) {
        disableBoard();
        start_clear_button.disabled = false;
        setTimeout(() => {
            alert("Player 1 Wins!");;
        }, 150); 
        return;
    }
    if (is_game_over && player === current_game_state.player_2.icon) {
        disableBoard();
        start_clear_button.disabled = false;  
        setTimeout(() => {
            alert("Player 2 Wins!");;
        }, 150); 
        return;
    }
    return;
}

/**
 * Swaps the current player and handles the game state accordingly.
 * @param {string} player - The current player.
 * @return {void}
 */
function swapPlayer(player) {
    if (player === current_game_state.player_1.icon) {
        current_player = current_game_state.player_2.icon;
        disableBoard();
        setTimeout(() => {
            computerMove();
        }, 500);
    } else if (player === current_game_state.player_2.icon) {
        setTimeout(() => {
            enableBoard();
        }, 500);
        current_player = current_game_state.player_1.icon; 
    }
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
function playerMove(event) {
    const target = event.target;
    if (target.value === '' && !game_over) {
        target.value = human_player;
        current_move++;
        human_held_positions.push(target.id);
        if (isWinner(human_player)) {
            return;
        }
        if (current_move <= 2 && current_player === human_player) {
            return;
        } else {
            swapPlayer(human_player);
        }
    }
    return;
}

/**
 * Handles the computer's move on the board.
 * It randomly selects an empty space on the board, marks it with the computer player's symbol,
 * and checks for a win or a draw after the move.
 * If the game is not over, it swaps the player to the human.
 * @return {void}
 */
function computerMove() {
    let computer_move = Math.floor(Math.random() * num_board_spaces);
    while (board[computer_move].value !== '' || game_over) {
        computer_move = Math.floor(Math.random() * num_board_spaces);
    }
    board[computer_move].value = computer_player;
    comp_held_positions.push(board[computer_move].id);
    current_move++;
    if (current_move === 2) {
        disableBoard();
        setTimeout(() => {
            computerMove();
        }, 500);
    }
    if (isWinner(computer_player)) {
        return;
    }
    swapPlayer(computer_player);
}

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

/**
 * Resets the game state, clearing the board and resetting all variables.
 * This is called when the 'Clear' button is clicked.
 * It also resets the button to 'Start' and enables the board for a new game.
 * @return {void}
 */
function resetGame() {
    game_over = false;
    game_started = false;
    current_player = computer_player;
    current_move = 1;
    comp_held_positions = [];
    human_held_positions = [];
    start_clear_button.value = 'Start';
    start_clear_button.disabled = false;
    enableBoard();
    board.forEach(space => {
        space.value = '';
        space.classList.remove('winning-space');
    });
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