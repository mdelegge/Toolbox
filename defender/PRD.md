**Prompt:** Create a JavaScript game inspired by the classic arcade game Defender. The game should feature a player-controlled ship, multiple enemy types, scrolling terrain, and a scoring system. Focus on creating a functional and engaging core gameplay loop.

**Specific Requirements:**

1.  **Game Setup:**
    *   Initialize an HTML5 canvas for rendering the game.
    *   Set up a game loop using `requestAnimationFrame`.
    *   Define game states (e.g., "start screen," "playing," "game over").

2.  **Player Ship:**
    *   Implement a player-controlled ship that can move horizontally and vertically within the canvas.
    *   Allow the ship to fire projectiles in a specified direction.
    *   Include collision detection for the player ship with enemies and enemy projectiles.

3.  **Enemies:**
    *   Implement at least two distinct enemy types with different movement patterns and attack behaviors (e.g., ground-based enemies, flying enemies).
    *   Enemies should spawn at intervals and move across the screen.
    *   Implement collision detection for enemy ships with player projectiles.

4.  **Terrain:**
    *   Create a scrolling terrain background that gives the illusion of horizontal movement.
    *   Consider implementing a basic "humanoid" or "city" element on the terrain that enemies can interact with (e.g., abduct).

5.  **Scoring and UI:**
    *   Implement a scoring system that awards points for destroying enemies.
    *   Display the current score and player lives/health on the screen.
    *   Implement a "Game Over" screen when the player loses all lives.

6.  **Technical Considerations:**
    *   Organize the code into logical modules or classes for better maintainability (e.g., `Player`, `Enemy`, `Projectile`, `Game`).
    *   Utilize basic physics for movement and projectile trajectories.
    *   Ensure smooth animation and responsiveness.

**Optional Enhancements (if time permits):**

*   Sound effects and background music.
*   Power-ups for the player ship.
*   Multiple levels with increasing difficulty.
*   A radar or mini-map to show enemy locations.