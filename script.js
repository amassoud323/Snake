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
