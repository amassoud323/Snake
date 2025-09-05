// Part 1 (Grid, Colours, Game Config)

// set size of one grid tile in pixels
const tile = 16;

// set number of tiles across and down. 
// Game area = 40*16 (=640px) wide and 30*16 (=480px) tall
const columns = 40;
const rows = 30;

// set the total width and height of the canvas
const width = columns * tile;
const height = rows * tile;

// set the colours for each variable
const colours = {
  bg: 0x5D688A,
  head: 0xF7A5A5,
  body: 0xFFF2EF,
  food: 0xFFDBB6
};

// set the possible directions using x and y coordinates
const directions = {
  left: { x: -1, y: 0, name: "left" },
  right: { x: 1, y: 0, name: "right" },
  up: { x: 0, y: -1, name: "up" },
  down: { x: 0, y: 1, name: "down" },
};

//Phaser game config
// - type: Phaser will use WebGL by default
// - parent: attach game canvas to HTML game ID
// - width/height: set canvas size using previously defined consts
// - backgroundColor: set colour using previously defined bg colour
// - scene: defines which functions run during preload, create, and update
const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: width,
  height: height,
  backgroundColor: colours.bg,
  scene: { preload, create, update }
};

// create a new Phaser game with above config
new Phaser.Game(config);

// Part 2 (States and Helper Functions)

// Snake state
let snake; // Array of grid cells [{x, y}, etc. ]; index[0] = snake's head
let snakeRects; // Array of Phaser rectangles that constitute snake body
let direction; // Current direction of snake movement
let nextDirection; //Next direction chosen by player input
let food; // Current food cell {x, y}
let score = 0; // Current score count, starting from 0
let scoreText; // Phaser object that displays score
let moveEvent; // Phaser timer event to move snake at fixed intervals
let speedMs = 130; // Delay in milliseconds between moves (lower = faster)

// Input state
let cursors; // Phaser helper object for arrow keys
let spaceKey; // Phaser key object for space bar (restart the game)

// Function to convert a grid cell to the centre of the canvas (used for respawning?)
function gridToPixelCenter(x, y) {
  return { px: x * tile + tile / 2, py: y * tile + tile / 2};
}

// Function to select a random unoccupied cell (useful e.g. for spawning food)
function randomFreeCell(excludeCells) {
  // create a lookup table of occupied cells to avoid choosing. 
  const occupied = new Set(excludeCells.map(c => `${c.x},${c.y}`));
  while (true) {
    // Generate a random x and y coordinate
    const x = Math.floor(Math.random() * columns);
    const y = Math.floor(Math.random() * rows);

    // Check if randomly generated cell is not in occupied set. If it's free, return it as an object {x,y}
    if (!occupied.has(`${x},${y}`)) return { x, y };
  }
}

// Function to prevent snake from turning 180° on itself. Checks if a direction 'a' is exactly the opposite of direction 'b'
function isOpposite(a, b) {
  return a.x === b.x && a.y === b.y;
}

// Part 3 (Preload and Create)

// preload function -- there's nothing to preload, so leave it empty
function preload() {}

// create function
function create() {
  // map arrow keys
  cursors = this.input.keyboard.createCursorKeys();

  // map spacebar to game restart
  spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  // initialise game state (snake, food, score, timer)
  initGame.call(this)
}

// Part 4 (Initialise the game)

function initGame() {
  // if an old movement timer exists, stop it (so only one timer is running)
  if (moveEvent) moveEvent.remove(false);

  // if old snake rectangles exist, remove them
  if (snakeRects) snakeRects.forEach(r => r.destroy());

  // Reset the score and snake direction
  score = 0;
  direction = DIR.right;
  nextDirection = DIR.right;

  // Find the starting position near centre of grid
  const startX = Math.floor(columns/2);
  const startY = Math.floor(rows/2);

  // Start the snake with 3 segments -- a head and 2 body pieces
  snake = [
    { x: startX,     y: startY }, // head
    { x: startX - 1, y: startY }, // first body segment
    { x: startX - 2, y: startY } // second body segment
  ];
}
