Generate a complete, functional Snake game in JavaScript. The game should include:

1.  **HTML Structure:** A basic HTML file (`index.html`) to host the canvas and display game information (score, game over message).
2.  **CSS Styling:** A CSS file (`style.css`) to style the canvas, score display, and any other UI elements.
3.  **JavaScript Logic:** A JavaScript file (`script.js`) containing all game logic. This includes:
    *   **Canvas Setup:** Initialize a 2D canvas context for drawing the game.
    *   **Snake Representation:** An array of objects representing the snake's segments, each with `x` and `y` coordinates.
    *   **Food Representation:** An object representing the food's `x` and `y` coordinates.
    *   **Game Loop:** A `requestAnimationFrame` based game loop to continuously update and render the game state.
    *   **Movement Logic:** Functions to handle snake movement based on user input (arrow keys), preventing movement in the opposite direction.
    *   **Collision Detection:**
        *   Collision with walls (canvas boundaries).
        *   Collision with the snake's own body.
    *   **Food Consumption:** Logic for when the snake eats the food, including increasing the snake's length and generating new food at a random valid location.
    *   **Score Tracking:** Displaying the current score.
    *   **Game Over State:** Handling the game over condition, displaying a message, and providing an option to restart.
    *   **Drawing Functions:** Functions to draw the snake, food, and other game elements on the canvas.

**Constraints:**

*   Use plain JavaScript, HTML, and CSS without external libraries or frameworks.
*   Ensure the game is responsive to user input for controlling the snake.
*   Implement clear game over and restart mechanisms.
*   The food should not spawn on top of the snake.
*   The game speed should increase gradually as the score increases, making the game more challenging.