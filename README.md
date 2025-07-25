# Code Quest Junior 🤖

**A fun, interactive browser game that teaches the fundamentals of programming logic to young learners through visual puzzles.**


## 🌟 Introduction

Welcome to **Code Quest Junior**! This edutainment game is designed for children aged 8-13 to embark on their first coding adventure. Players control a friendly robot, guiding it through grid-based levels to solve puzzles. By writing simple, JavaScript-like commands, they learn core programming concepts like sequencing, functions, and loops in a tangible and rewarding way.

The goal is to make learning to code an act of play and discovery, removing intimidation and fostering a love for logical thinking.

### 🎮 [Live](https://cruze-tech.github.io/code-quest-junior/)


## ✨ Core Features

*   **Visual Code Execution:** Write code in the editor, press "Run", and watch the robot execute your commands step-by-step on the grid.
*   **Level-Based Puzzles:** A series of challenges that incrementally introduce new obstacles and concepts.
*   **Simple Command Set:** Easy-to-understand commands like `moveForward()`, `turnLeft()`, `turnRight()`, and `repeat()`.
*   **Instant Feedback:** The game provides immediate visual feedback for success and clear, friendly error messages for mistakes (e.g., "Ouch! Can't move there.").
*   **Star-Based Rewards:** Levels are rated with stars based on the efficiency of your code, encouraging logical optimization.
*   **Responsive Design:** Fully playable on desktops, tablets, and mobile phones for learning anywhere.
*   **No Setup Needed:** Runs directly in the browser with zero dependencies.

---

## 🕹️ How to Play

1.  **Observe the Puzzle:** Look at the grid. Where is your robot? Where are the goals? What obstacles are in the way?
2.  **Write Your Code:** In the code editor on the right, type commands to guide the robot.
3.  **Use the Commands:**
    *   `moveForward()` - Moves the robot one tile in the direction it's facing.
    *   `turnLeft()` - Rotates the robot 90 degrees to the left.
    *   `turnRight()` - Rotates the robot 90 degrees to the right.
    *   `repeat(n) { ... }` - Repeats the commands inside the `{ }` brackets `n` times.
4.  **Run Your Program:** Click the "▶ Run" button.
5.  **Debug and Retry:** If it doesn't work, press "↺ Reset", fix your code, and try again!

---

## 🛠️ Tech Stack

*   **Frontend:** Vanilla HTML5, CSS3, and JavaScript (ES6+ Modules)
*   **Assets:** SVG for clean, scalable graphics.
*   **Data:** Level definitions are managed in a simple `levels.json` file.
*   **Storage:** Player progress is saved in the browser's `localStorage`.

---

## 🚀 Local Setup & Development

To run the project on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/cruze-tech/code-quest-junior.git
    ```
2.  **Navigate to the directory:**
    ```bash
    cd code-quest-junior
    ```
3.  **Run a local server:**
    The project uses ES6 modules, which require a server environment to work correctly due to CORS policy. The easiest way is to use the **Live Server** extension in VS Code.
    *   Install the "Live Server" extension.
    *   Right-click on `index.html` and select "Open with Live Server".

The game will automatically open in your default browser.

---

## 🌱 How to Add New Levels

Adding more levels is easy and requires no code changes!

1.  Open the `js/data/levels.json` file.
2.  Copy an existing level object and paste it at the end of the array (before the closing `]`).
3.  Modify the new object's properties:
    *   `id`: Give it a new, unique number.
    *   `name`: A descriptive name for the level.
    *   `gridSize`: Set the `{ "width", "height" }` of the puzzle grid.
    *   `start`: The robot's starting `{ "x", "y", "direction" }`. (x/y are 0-indexed).
    *   `goals`: An array of goal locations `[{ "x", "y" }]`. You can have one or many.
    *   `obstacles`: An array of obstacle locations `[{ "x", "y" }]`.
    *   `optimalMoves`: The number of actions for a perfect 3-star solution.
    *   `hint`: A helpful message for players who get stuck.

4.  Save the file. The new level will automatically be available in the game after the previous last level is completed.

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
