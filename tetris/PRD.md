Create a complete, functional Tetris game using HTML, CSS, and JavaScript.

**Requirements:**

1.  **Game Board:**
    *   Implement a game board (grid) using HTML Canvas or a grid of `div` elements.
    *   Define the dimensions of the board (e.g., 10 columns by 20 rows).

2.  **Tetrominoes:**
    *   Represent the seven standard Tetromino shapes (I, O, T, S, Z, J, L).
    *   Each Tetromino should have its own array of possible rotations.
    *   Implement a mechanism to randomly generate the next falling Tetromino.

3.  **Movement and Rotation:**
    *   Implement keyboard controls for moving the falling Tetromino left, right, and down (soft drop).
    *   Implement a hard drop feature (instantly drops the Tetromino to the bottom).
    *   Implement rotation for the Tetrominoes, handling wall kicks and floor kicks as needed to ensure valid rotations.

4.  **Collision Detection:**
    *   Develop robust collision detection for checking if a Tetromino can move or rotate without overlapping with existing blocks or going out of bounds.

5.  **Line Clearing:**
    *   Detect full horizontal lines and clear them from the board.
    *   Shift remaining blocks down to fill the cleared lines.

6.  **Scoring System:**
    *   Implement a scoring system that awards points for clearing lines (e.g., more points for clearing multiple lines at once).

7.  **Game State Management:**
    *   Track the current score, level, and game over state.
    *   Implement a game loop that handles piece movement, updates the board, and checks for game over conditions.
    *   Increase game speed or difficulty as the player clears more lines or levels up.

8.  **User Interface:**
    *   Display the current score and level.
    *   Display the "next" Tetromino.
    *   Implement a "Game Over" screen or message.
    *   Include basic styling for the game board and Tetrominoes.

**Bonus Features (Optional):**

*   **Hold Feature:** Allow the player to store a Tetromino for later use.
*   **Ghost Piece:** Display a translucent outline of where the current Tetromino will land.
*   **Sound Effects:** Add sound effects for actions like dropping pieces, clearing lines, and game over.
*   **Responsive Design:** Ensure the game is playable on different screen sizes.