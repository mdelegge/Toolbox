Create a classic Asteroids-style game using HTML5 Canvas and JavaScript. The game should feature:

**Core Mechanics:**
1.  **Spaceship Control:**
    *   A player-controlled spaceship represented by a simple triangle.
    *   Controls for rotation (left/right arrow keys or 'A'/'D') and thrust (up arrow key or 'W').
    *   The spaceship should wrap around the screen edges when it goes off-bounds.
2.  **Asteroids:**
    *   Multiple asteroids of varying sizes (e.g., large, medium, small) that move across the screen at different speeds and directions.
    *   Asteroids should also wrap around the screen edges.
    *   When an asteroid is hit by a laser, it should break into smaller fragments (if it's not already the smallest size).
3.  **Lasers:**
    *   The spaceship can fire lasers (spacebar or 'J').
    *   Lasers travel in a straight line from the spaceship's current direction.
    *   Lasers should disappear after a certain distance or when they hit an asteroid.
4.  **Collision Detection:**
    *   Detect collisions between lasers and asteroids.
    *   Detect collisions between the spaceship and asteroids.
5.  **Game State:**
    *   A scoring system for destroying asteroids (larger asteroids yield more points).
    *   A limited number of lives for the player.
    *   A "Game Over" state when all lives are lost, displaying the final score and an option to restart.

**Visuals & Enhancements:**
*   **HTML Structure:** Use a simple `index.html` file with a `<canvas>` element.
*   **JavaScript Structure:** Organize your JavaScript code into logical classes or objects (e.g., `Ship`, `Asteroid`, `Laser`) for better maintainability.
*   **Rendering:** Use `requestAnimationFrame` for smooth animation.
*   **Sound Effects:** (Optional) Add basic sound effects for firing lasers, asteroid explosions, and collisions.
*   **Difficulty Scaling:** (Optional) Increase the number or speed of asteroids as the player's score increases.