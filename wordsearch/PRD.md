# Prompt:
Generate a complete HTML and JavaScript project for a dynamic Word Search game. The game should meet the following requirements:

## HTML Structure:
- A main container for the game board.
- An area to display the list of words to find.
- A mechanism to provide user feedback (e.g., "Word Found!").
- A button to generate a new game.

## JavaScript Functionality:
- Word List Input: Allow the user to input a custom list of words or use a predefined list.
- Grid Generation: Dynamically generate a square or rectangular grid of a specified size (e.g., 10x10, 15x15, 20x20 30x30, etc.).
- Word Placement Algorithm: Implement an algorithm to strategically place the words from the list into the grid, ensuring words can be placed horizontally, vertically, and diagonally (forward and backward). The algorithm should handle potential overlaps and ensure all words are placed if possible.
- Filler Letters: Populate the remaining empty cells in the grid with random letters.
- User Interaction:
    - Enable click-and-drag or click-and-click functionality to select letters on the grid.
    - Implement logic to check if a selected sequence of letters matches a word from the list.
    Highlight found words on the grid and mark them as found in the word list.
- Game State Management: Keep track of found words and total words.
- New Game Functionality: A function to reset the game and generate a new puzzle with either the same or a new word list.
- Basic Styling: Include inline CSS or a separate CSS file for a visually appealing game board and word list.
- Add an option to export the wordseach as a PNG image.