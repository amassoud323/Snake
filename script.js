// 1. Grid, Colours, Game Config

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

// 2. States and Helper Functions

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
  return a.x === -b.x && a.y === -b.y;
}

// 3. Preload and Create

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

// 4. Initialise the game

function initGame() {
  // if an old movement timer exists, stop it (so only one timer is running)
  if (moveEvent) moveEvent.remove(false);

  // if old snake rectangles exist, remove them
  if (snakeRects) snakeRects.forEach(r => r.destroy());

  // Reset the score and snake direction
  score = 0;
  direction = directions.right;
  nextDirection = directions.right;

  // Find the starting position near centre of grid
  const startX = Math.floor(columns/2);
  const startY = Math.floor(rows/2);

  // Start the snake with 3 segments -- a head and 2 body pieces
  snake = [
    { x: startX,     y: startY }, // head
    { x: startX - 1, y: startY }, // first body segment
    { x: startX - 2, y: startY } // second body segment
  ];


// Create snake segments in Phaser using rectangles
snakeRects = snake.map((cell, i) => { //loop through each segment of the snake array (i = the index)
  const { px, py } = gridToPixelCenter(cell.x, cell.y); // converts grid coordinates to pixel coords at the centre
  const color = i === 0 ? colours.head : colours.body; // sets colour; if head, use head colour, otherwise use body colour (? is shorthand for if/else)
  const rect = this.add.rectangle(px, py, tile - 2, tile - 2, color); // creates the new rectangle, makes it 2px smaller than the tile size for spacing
  rect.setOrigin(0.5, 0.5); // sets origin of the rectangle to the centre
  return rect;
});

// Spawn food at a random free cell (make sure snake isn't overlapping the cell)
food = randomFreeCell(snake);
const { px, py } = gridToPixelCenter(food.x, food.y);

// If food already exists from a previous game, remove it
if (this.foodRect) this.foodRect.destroy();

// Draw new food (same code as to draw new snake rectangles, but just using food colour)
this.foodRect = this.add.rectangle(px, py, tile - 2, tile - 2, colours.food);

// Create score text (or, on restart, reset its value)
if (!scoreText) {
  scoreText = this.add.text(8, 6, "Score: 0", { fontFamily: "monospace", fontSize: 18, color: "#fff"});
  this.add.text(8, 28, "Use arrows to move. Use space to restart.", { fontFamily: "monospace", fontSize: 14, color: "#aaa"});
} else {
  scoreText.setText("Score: 0");
}

// Reset speed and create a repeating timer.
// Every 'speedMs' milliseconds, stepSnake() will run to move the snake
speedMs = 130;
moveEvent = this.time.addEvent({ // creates the repeating timer, which will trigger at set time interval
  delay: speedMs, // sets the time interval
  loop: true, // makes the timer repeat indefinitely, so the snake keeps moving
  callback: () => stepSnake.call(this) // sets the function to run on each timer tick -- calls stepSnake, and binds (this) to the current Phaser scene context
});

// Removing any preexisting 'game over' message from a previous attempt
if (this.gameOverText) {
  this.gameOverText.destroy();
  this.gameOverText = null;
}
}
// 5. Reading Input

/* update():
    - runs each game loop
    - reads player input from arrow keys (note, player doesn't need to hold down keys to move snake; simply set the direction of movement using arrow keys)
    - updates "nextDirection" so snake turns on next frame if key pressed
    - listens for space bar press to restart game
*/
function update() {
  // check if LEFT arrow pressed AND not opposite direction
  if (cursors.left.isDown && !isOpposite(directions.left, direction)) {
    nextDirection = directions.left;
  
  // check if RIGHT arrow pressed  
  } else if (cursors.right.isDown && !isOpposite(directions.right, direction)) {
    nextDirection = directions.right;

  // check if UP arrow pressed  
  } else if (cursors.up.isDown && !isOpposite(directions.up, direction)) {
    nextDirection = directions.up;

  // check if DOWN arrow pressed
  } else if (cursors.down.isDown && !isOpposite(directions.down, direction)) {
    nextDirection = directions.down;
  }

  // if game over AND space bar pressed -> restart game
  if (this.gameOverText && Phaser.Input.Keyboard.JustDown(spaceKey)) {
    initGame.call(this); // Reset everything (snake, food, score, etc.)
  }
}

// 6. Stepping the Snake, Eating, and Drawing

/* stepSnake()
   This functions runs every 'tick' (based on timer)
   - Moves the snake forward by one cell
   - Checks for collisions (wall or self)
   - Handles eating food (grow and add to score)
   - Updates the snake's rectangles on the screen
*/
function stepSnake() {
  // Apply the direction chosen in update() (queued by player input with keys)
  direction = nextDirection;

  // Get the current head of the snake
  const head = snake[0];

  // Create new head position by moving one cell in current direction
  const newHead = { x: head.x + direction.x, y: head.y + direction.y };

  // Collision check 1: wall
  // If the new head is outside the grid, the game ends
  if (newHead.x < 0 || newHead.x >= columns || newHead.y < 0 || newHead.y >= rows) {
    return endGame.call(this); 
  }

  // Collision check 2: self
  // If the new head overlaps any existing snake cell, the game ends
  for (let i = 0; i < snake.length; i++) {
    if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
      return endGame.call(this);
    }
  }

  // Check if food was eaten
  const ate = newHead.x === food.x && newHead.y === food.y;

  // == Add new head cell to the front of the snake ==
  snake.unshift(newHead);

  if (!ate) {
    // If snake didn't eat anything, keep length the same
    // (i.e. remove the last cell from the snake while adding the new head)
    snake.pop()

    // Reuse the last rectangle object for performance
    const tailRect = snakeRects.pop();
    const { px, py} = gridToPixelCenter(newHead.x, newHead.y);
    tailRect.setPosition(px, py); // Move it to the new head
    snakeRects.unshift(tailRect); // Put it at the front of the snake
  } else {
    // Snake did eat something, -> grow longer
    const { px, py} = gridToPixelCenter(newHead.x, newHead.y);
    const headRect = this.add.rectangle(px, py, tile - 2, tile -2, colours.head);
    snakeRects.unshift(headRect);

    // Increase and update score
    score += 10;
    scoreText.setText(`Score: ${score}`);

    // Place new food somewhere else on the grid
    placeFood.call(this);

    // Speed up slightly to increase difficulty as game continues
    maybeSpeedUp.call(this);
  }

  // == Update colours ==
  // Ensure only index 0 is drawn as 'head', and rest is 'body'
  if (snakeRects[1]) snakeRects[1].setFillStyle(colours.body);
  snakeRects[0].setFillStyle(colours.head);
}

// 7. Spawning FOod and Increasing Speed

/* placeFood()
   - Spawns food at a new random cell that isn't part of snake
   - Uses randomFreeCell() to avoid collisions with the snake
   - Moves the existing foodRect to the new spot
*/
function placeFood() {
  // Pick a random free cell on the grid not occupied by snake
  food = randomFreeCell(snake);

  // Convert that cell into pixel coordinates
  const { px, py } = gridToPixelCenter(food.x, food.y);

  // Move existing food rectangle to the new position
  this.foodRect.setPosition(px, py);
}

/* maybeSpeedUp()
   - Slightly increases difficulty each time food is eaten
   - Decreases move delay (i.e. snake moves faster)
   - Restarts the timer with new speed
   - Stops speeding up once a lower bound is reached
*/
function maybeSpeedUp() {
  // Only speed up if the current speed is above minimum threshold (70ms)
  if (speedMs > 70) {
    // Increase speed by reducing the delay
    speedMs -= 3;

    // Remove the old movement timer
    moveEvent.remove(false);

    // Create a new timer with the updated speed
    moveEvent = this.time.addEvent({
      delay: speedMs,     // shorter delay -> faster movement
      loop: true,         // repeat indefinitely until game over
      callback: () => stepSnake.call(this)  // keep "this" as the scene
    });
  }
}

// 8. Game Over and Restart

/* endGame()
    - Called when snake hits wall or itself
    - Stops movement timer (snake no longer moves)
    - Displays "game over" message with the final score
    - Waits for the player to press Space (handled in update()) to restart
*/

function endGame() {
  // Stop movement timer so snake no longer steps forward
  moveEvent.remove(false);

  // Define text style for the 'game over' message
  const style = {
    fontFamily: "monospace",
    fontSize: 28,
    color: "#fff",
    align: "center"
  };

  // Message shows "game over", final score, and restart instructions
  const msg = `Game Over\nScore: ${score}\nPress Space to Restart`;

  // Add text to the centre of the screen
  // .setOrigin(0.5, 0.5) makes the text anchor at its centre
  this.gameOverText = this.add.text(width / 2, height / 2, msg, style).setOrigin(0.5, 0.5);
}