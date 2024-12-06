class Othello {
    constructor() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'black';
        this.lastMove = null;
        this.selectedPiece = null;
        this.isAIEnabled = true;
        this.gameOver = false;
        this.initialize();
        this.createBoard();
        this.updateScore();
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.gameOver) {
                this.resetGame();
            }
        });
    }

    initialize() {
        this.board[3][3] = 'white';
        this.board[3][4] = 'black';
        this.board[4][3] = 'black';
        this.board[4][4] = 'white';
    }

    resetGame() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = 'black';
        this.lastMove = null;
        this.selectedPiece = null;
        this.gameOver = false;
        this.initialize();
        this.createBoard();
        this.updateScore();
        document.getElementById('gameOverOverlay').style.display = 'none';
    }

    showGameOver() {
        let blackCount = 0;
        let whiteCount = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] === 'black') blackCount++;
                if (this.board[i][j] === 'white') whiteCount++;
            }
        }

        const overlay = document.getElementById('gameOverOverlay');
        const message = document.getElementById('gameOverMessage');
        let resultMessage;
        if (blackCount > whiteCount) {
            resultMessage = `Game Over! Black wins ${blackCount}-${whiteCount}!`;
        } else if (whiteCount > blackCount) {
            resultMessage = `Game Over! White wins ${whiteCount}-${blackCount}!`;
        } else {
            resultMessage = `Game Over! It's a tie ${blackCount}-${whiteCount}!`;
        }
        
        message.textContent = resultMessage;
        overlay.style.display = 'flex';
    }

    createBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < 8; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                if (this.board[i][j]) {
                    const piece = document.createElement('div');
                    piece.className = `piece ${this.board[i][j]}`;
                    if (this.lastMove && this.lastMove.row === i && this.lastMove.col === j) {
                        cell.classList.add('moved-cell');
                        setTimeout(() => {
                            this.lastMove = null;
                        }, 800);
                    }
                    if (this.selectedPiece && this.selectedPiece.row === i && this.selectedPiece.col === j) {
                        piece.classList.add('selected-piece');
                    }
                    cell.appendChild(piece);
                }
                if (this.selectedPiece && !this.board[i][j] && this.isValidMove(i, j)) {
                    cell.classList.add('valid-move');
                }
                cell.addEventListener('click', () => this.handleClick(i, j));
                row.appendChild(cell);
            }
            boardElement.appendChild(row);
        }
    }

    isValidMove(row, col) {
        if (this.board[row][col]) return false;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        return directions.some(([dx, dy]) => 
            this.wouldFlip(row, col, dx, dy, this.currentPlayer).length > 0
        );
    }

    wouldFlip(row, col, dx, dy, player) {
        const flips = [];
        let x = row + dx;
        let y = col + dy;
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
            if (!this.board[x][y]) return [];
            if (this.board[x][y] === player) return flips;
            flips.push({row: x, col: y});
            x += dx;
            y += dy;
        }
        return [];
    }

    getAllValidMoves() {
        const moves = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.isValidMove(i, j)) {
                    moves.push({row: i, col: j});
                }
            }
        }
        return moves;
    }

    evaluateMove(row, col) {
        let score = 0;
        
        if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
            score += 25; 
        }
    
        else if (row === 0 || row === 7 || col === 0 || col === 7) {
            score += 8; 
        }
        
        if ((row === 0 || row === 1 || row === 6 || row === 7) && 
            (col === 0 || col === 1 || col === 6 || col === 7)) {
            if ((row === 1 && col === 1 && !this.board[0][0]) ||
                (row === 1 && col === 6 && !this.board[0][7]) ||
                (row === 6 && col === 1 && !this.board[7][0]) ||
                (row === 6 && col === 6 && !this.board[7][7])) {
                score -= 15;
            }
        }
        
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        let totalFlips = 0;
        directions.forEach(([dx, dy]) => {
            const flips = this.wouldFlip(row, col, dx, dy, this.currentPlayer);
            totalFlips += flips.length;
        });
        score += totalFlips * 2;
        const tempBoard = this.board.map(row => [...row]);
        this.board[row][col] = this.currentPlayer;
        let stableCount = this.countStablePieces();
        score += stableCount * 3;
        this.board = tempBoard;
        
        const gameStage = this.getGameStage();
        if (gameStage === 'early') {
            if ((row >= 2 && row <= 5) && (col >= 2 && col <= 5)) {
                score += 4;
            }
        }
        else if (gameStage === 'late') {
            score += totalFlips * 3;
        }
        
        return score;
    }

    getGameStage() {
        let pieceCount = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j]) pieceCount++;
            }
        }
        if (pieceCount < 20) return 'early';
        if (pieceCount < 40) return 'mid';
        return 'late';
    }

    countStablePieces() {
        const stable = Array(8).fill().map(() => Array(8).fill(false));
        let count = 0;
        
        const corners = [[0,0], [0,7], [7,0], [7,7]];
        corners.forEach(([r, c]) => {
            if (this.board[r][c]) {
                this.markStablePieces(r, c, stable);
            }
        });
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (stable[i][j]) count++;
            }
        }
        
        return count;
    }

    markStablePieces(row, col, stable) {
        if (stable[row][col]) return;
        stable[row][col] = true;
        
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        directions.forEach(([dx, dy]) => {
            const newRow = row + dx;
            const newCol = col + dy;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 &&
                this.board[newRow][newCol] === this.board[row][col]) {
                this.markStablePieces(newRow, newCol, stable);
            }
        });
    }

    makeAIMove() {
        const validMoves = this.getAllValidMoves();
        if (validMoves.length === 0) return false;

        const scoredMoves = validMoves.map(move => ({
            ...move,
            score: this.evaluateMove(move.row, move.col)
        }));

        scoredMoves.sort((a, b) => b.score - a.score);
        const bestMove = scoredMoves[0];

        setTimeout(() => {
            this.makeMove(bestMove.row, bestMove.col);
            this.createBoard();
        }, 500);

        return true;
    }

    makeMove(row, col) {
        if (!this.isValidMove(row, col)) return false;

        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        this.board[row][col] = this.currentPlayer;
        this.lastMove = {row, col};

        directions.forEach(([dx, dy]) => {
            const flips = this.wouldFlip(row, col, dx, dy, this.currentPlayer);
            flips.forEach(({row: x, col: y}) => {
                this.board[x][y] = this.currentPlayer;
            });
        });

        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.selectedPiece = null;
        this.updateScore();

        if (!this.hasValidMoves()) {
            this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
            if (!this.hasValidMoves()) {
                this.gameOver = true;
                this.showGameOver();
                return true;
            }
        }

        if (this.isAIEnabled && this.currentPlayer === 'white' && !this.gameOver) {
            if (!this.hasValidMoves()) {
                this.currentPlayer = 'black';
                if (!this.hasValidMoves()) {
                    this.gameOver = true;
                    this.showGameOver();
                }
            } else {
                this.makeAIMove();
            }
        }

        return true;
    }

    handleClick(row, col) {
        if (this.gameOver || (this.isAIEnabled && this.currentPlayer === 'white')) return;

        if (this.board[row][col] && this.board[row][col] === this.currentPlayer) {
            if (this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col) {
                this.selectedPiece = null;
            } else {
                this.selectedPiece = {row, col};
            }
            this.createBoard();
            return;
        }

        if (this.makeMove(row, col)) {
            this.createBoard();
        }
    }

    hasValidMoves() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.isValidMove(i, j)) return true;
            }
        }
        return false;
    }

    updateScore() {
        let blackCount = 0;
        let whiteCount = 0;
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.board[i][j] === 'black') blackCount++;
                if (this.board[i][j] === 'white') whiteCount++;
            }
        }

        document.getElementById('blackScore').textContent = `Black: ${blackCount}`;
        document.getElementById('whiteScore').textContent = `White: ${whiteCount}`;

        document.getElementById('blackScore').classList.toggle('current-player', this.currentPlayer === 'black');
        document.getElementById('whiteScore').classList.toggle('current-player', this.currentPlayer === 'white');
    }
}

const game = new Othello();