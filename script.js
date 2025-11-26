let board = Array(9).fill('');
let currentPlayer = 'X';
let gameMode = 'pvp';
let scores = { X:0, O:0 };
let paused = false;

const cells = document.querySelectorAll('.cell');
const scoreboard = document.getElementById('scoreboard');
const messageBox = document.getElementById('messageBox');
const playerXInput = document.getElementById('playerXName');
const playerOInput = document.getElementById('playerOName');
const pvpBtn = document.getElementById('pvp');
const aiBtn = document.getElementById('ai');
const difficultySel = document.getElementById('difficulty');

const applause = document.getElementById('applause');
const cheer = document.getElementById('cheer');

document.body.addEventListener('click', () => {
  const bgFrame = document.getElementById('bgMusic');
  bgFrame.contentWindow.postMessage('play', '*');
}, { once: true });

const WIN_PATTERNS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function emptySquares(b = board) {
  return b.map((v,i)=>v===''?i:null).filter(v=>v!==null);
}

function getPlayerName(symbol) {
  const xName = playerXInput.value.trim() || "Player X 👥 ";
  const oName = (gameMode==='ai') ? "Robot   🤖" : (playerOInput.value.trim() || "Player O 👥");
  return symbol === 'X' ? xName : oName;
}

function updateScore() {
  scoreboard.textContent = `${getPlayerName('X')}: ${scores.X} | ${getPlayerName('O')}: ${scores.O}`;
}

function highlightWinner(pattern) {
  pattern.forEach(i => cells[i].classList.add('winner'));
}

function resetBoard() {
  board = Array(9).fill('');
  cells.forEach(c => { c.textContent=''; c.classList.remove('winner'); });
  currentPlayer = 'X';
  paused = false;
  messageBox.style.display='none';
}

function checkWinner(b = board) {
  for (const pattern of WIN_PATTERNS) {
    const [a,b1,c] = pattern;
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return { winner: b[a], pattern };
  }
  if (!b.includes('')) return { winner: 'draw', pattern:null };
  return null;
}

function makeMove(index) {
  if (paused || board[index] !== '') return;
  board[index] = currentPlayer;
  cells[index].textContent = currentPlayer;

  const result = checkWinner();
  if (result) {
    if (result.winner === 'draw') {
      messageBox.textContent = "It's a Draw! 🤝";
      messageBox.style.display = "block";
    } else {
      highlightWinner(result.pattern);
      scores[result.winner]++;
      updateScore();
      const winnerName = getPlayerName(result.winner);
      messageBox.style.display="block";
      if (gameMode==='ai' && result.winner==='O') {
        messageBox.textContent = `Oops! ${winnerName} beat ya  hahaha🤖👎🦶 🤡   `;
        cheer.play();
      } else {
        messageBox.textContent = `${winnerName} wins! 👏🎉🏆🤏`;
        applause.play();
      }
    }
    setTimeout(() => resetBoard(), 1800);
    return;
  }

  currentPlayer = currentPlayer==='X' ? 'O' : 'X';
  if (gameMode==='ai' && currentPlayer==='O' && !paused) setTimeout(aiMove, 400);
}

function aiMove() {
  if (paused) return;
  const difficulty = difficultySel.value;
  let moveIndex;

  if (difficulty === 'easy') {
    const empties = emptySquares();
    moveIndex = empties[Math.floor(Math.random() * empties.length)];

  } else if (difficulty === 'normal') {
    moveIndex = bestHeuristicMove(board);

  } else if (difficulty === 'hard') {
    const best = minimaxDecision(board, 'O');
    moveIndex = best.index;
  }

  if (moveIndex !== undefined) makeMove(moveIndex);
}

function bestHeuristicMove(b) {
  let idx = findWinningMove(b, 'O'); if (idx !== null) return idx;
  idx = findWinningMove(b, 'X'); if (idx !== null) return idx;
  if (b[4] === '') return 4;
  const corners = [0,2,6,8].filter(i => b[i] === ''); 
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const sides = [1,3,5,7].filter(i => b[i] === ''); 
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];
  return undefined;
}

function findWinningMove(b, player) {
  for (const [i,j,k] of WIN_PATTERNS) {
    if (b[i] === player && b[j] === player && b[k] === '') return k;
    if (b[i] === player && b[k] === player && b[j] === '') return j;
    if (b[j] === player && b[k] === player && b[i] === '') return i;
  }
  return null;
}

function minimaxDecision(b, player) {
  const avail = emptySquares(b);
  const winnerCheck = checkWinner(b);
  if (winnerCheck) {
    if (winnerCheck.winner === 'X') return { score: -10 };
    else if (winnerCheck.winner === 'O') return { score: 10 };
    else return { score: 0 };
  }
  if (avail.length === 0) return { score: 0 };

  const moves = [];
  for (let i of avail) {
    const newBoard = [...b];
    newBoard[i] = player;
    const result = minimaxDecision(newBoard, player === 'O' ? 'X' : 'O');
    moves.push({ index: i, score: result.score });
  }

  return player === 'O'
    ? moves.reduce((best,m) => m.score > best.score ? m : best)
    : moves.reduce((best,m) => m.score < best.score ? m : best);
}

// Event listeners
cells.forEach(cell => {
  cell.addEventListener('click', ()=> makeMove(parseInt(cell.dataset.index)));
});

pvpBtn.addEventListener('click', () => {
  gameMode='pvp';
  pvpBtn.classList.add('active'); aiBtn.classList.remove('active');
  playerOInput.style.display="inline-block";
  difficultySel.disabled=true;
  resetBoard(); updateScore();
});

aiBtn.addEventListener('click', () => {
  gameMode='ai';
  aiBtn.classList.add('active'); pvpBtn.classList.remove('active');
  playerOInput.style.display="none";
  difficultySel.disabled=false;
  resetBoard(); updateScore();
});

const pauseBtn = document.getElementById('pause');
document.getElementById('reset').addEventListener('click', resetBoard);
document.getElementById('pause').addEventListener('click', () => { 
  paused = !paused; 
  pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  pauseBtn.classList.toggle('paused', paused);
});
document.getElementById('stop').addEventListener('click', resetBoard);
