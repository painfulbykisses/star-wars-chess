import React, { useState, useEffect, useRef } from 'react';

// --- 8-Bit Pixel Art Data ---
const PALETTE = {
  '_': 'transparent',
  'W': '#f8fafc', // Putih
  'B': '#0f172a', // Hitam / Gelap
  'G': '#94a3b8', // Abu-abu
  'D': '#475569', // Abu-abu Tua
  'R': '#ef4444', // Merah
  'U': '#3b82f6', // Biru
  'E': '#22c55e', // Hijau
  'S': '#fcd3a1', // Kulit
  'H': '#8b5a2b', // Cokelat
  'Y': '#facc15', // Kuning
  'C': '#06b6d4', // Cyan
};

const SPRITES = {
  luke: [
    "___YYYY___", "__YYYYYY__", "__YSSSSY__", "__SSBSS___", "__SSSSS__U",
    "__HHHHH__U", "__H_H_H__U", "__G_G_G__U", "__D_D_D___", "__B___B___"
  ],
  leia: [
    "__H_HH_H__", "_HH_HH_HH_", "_HHSSSSHH_", "_HHBSSBHH_", "__HSSSSH__",
    "___WWWW___", "__WWWWWW__", "__WWWWWW__", "__WWWWWW__", "___W__W___"
  ],
  yoda: [
    "__________", "__________", "__EEEEEE__", "_EEEEEEEE_", "EEBEEEEBEE",
    "_EEEESEEE_", "___HHH____", "__HHHHH___", "__HHHHH___", "__H___H___"
  ],
  r2d2: [
    "___GGGG___", "__GUGUGG__", "__GGGGGG__", "_GWWWWWWG_", "_GWWUWWWG_",
    "_GWWWWWWG_", "_GWWUWWWG_", "_GWWWWWWG_", "__WWWWWW__", "__G____G__"
  ],
  xwing: [
    "____BB____", "____GG____", "R__WWWW__R", "B_GWWWWG_B", "_B_WWWW_B_",
    "__BWWWWB__", "__GGGGGG__", "__B_UU_B__", "_B______B_", "B________B"
  ],
  rebel: [
    "___GGGG___", "__GGGGGG__", "__GSSSSG__", "__SSBSS___", "__SSSSS___",
    "___WWWW_B_", "__W_W_W_B_", "__G_G_G_B_", "__D_D_D___", "__B___B___"
  ],
  palpatine: [
    "___BBBB___", "__BBBBBB__", "__BBWWBB__", "__BBWBWB__", "__BBWWBB__",
    "_C_BBBB_C_", "_C_BBBB_C_", "C__BBBB__C", "___B__B___", "___B__B___"
  ],
  vader: [
    "___BBBB___", "__BBBBBB__", "__BBDDBB__", "_BBDDDDBB_", "_BBBBBBBB_",
    "__BDBBDB__", "__BBBBBB_R", "__BBBBBB_R", "__B_BB_B_R", "__B____B_R"
  ],
  bobafett: [
    "___EEEE___", "__EEEEEE__", "__BBBBBB__", "__E_BB_E__", "__E_BB_E__",
    "__E_BB_E__", "__GGGGGG__", "__GRGGY___", "__GDGGD___", "__G___G___"
  ],
  tiefighter: [
    "B________B", "B___GG___B", "B__GDDG__B", "B_GDDDDG_B", "B_GDDDDG_B",
    "B__GDDG__B", "B___GG___B", "B________B", "B________B", "__________"
  ],
  deathstar: [
    "___GGGG___", "_GGGGGGGG_", "GGDDGGGGGG", "GDDDDGGGGG", "GDDDDGGGGG",
    "GGDDGGGGEE", "_GGGGGGGG_", "_GGGGGGGG_", "___GGGG___", "__________"
  ],
  stormtrooper: [
    "___WWWW___", "__WWWWWW__", "__WWBBWW__", "__WBBBBW__", "__WWBBWW__",
    "__W_WW_W__", "___WWWW_B_", "__W_W_W_B_", "__W_W_W___", "__W___W___"
  ]
};

const PixelArt = ({ data }) => (
  <svg viewBox="0 0 10 10" className="w-full h-full" shapeRendering="crispEdges">
    {data.map((row, y) =>
      row.split('').map((colorCode, x) => (
        colorCode !== '_' && <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={PALETTE[colorCode]} />
      ))
    )}
  </svg>
);

// --- JRPG Aesthetic Data ---
const PIECES = {
  w: {
    k: { sprite: SPRITES.luke, name: 'Luke', type: 'k' },
    q: { sprite: SPRITES.leia, name: 'Leia', type: 'q' },
    b: { sprite: SPRITES.yoda, name: 'Yoda', type: 'b' },
    n: { sprite: SPRITES.r2d2, name: 'R2-D2', type: 'n' },
    r: { sprite: SPRITES.xwing, name: 'X-Wing', type: 'r' },
    p: { sprite: SPRITES.rebel, name: 'Rebel', type: 'p' },
  },
  b: {
    k: { sprite: SPRITES.palpatine, name: 'Palpatine', type: 'k' },
    q: { sprite: SPRITES.vader, name: 'Vader', type: 'q' },
    b: { sprite: SPRITES.bobafett, name: 'Boba Fett', type: 'b' },
    n: { sprite: SPRITES.tiefighter, name: 'TIE Fighter', type: 'n' },
    r: { sprite: SPRITES.deathstar, name: 'Death Star', type: 'r' },
    p: { sprite: SPRITES.stormtrooper, name: 'Stormtrooper', type: 'p' },
  }
};

// --- Game Logic ---
const createInitialBoard = () => {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));

  const setupRow = (r, color) => {
    const types = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    b[r] = types.map(t => ({ color, type: t }));
  };

  setupRow(0, 'b');
  b[1] = Array(8).fill(null).map(() => ({ color: 'b', type: 'p' }));

  b[6] = Array(8).fill(null).map(() => ({ color: 'w', type: 'p' }));
  setupRow(7, 'w');

  return b;
};

const getPseudoLegalMoves = (board, r, c, color, type) => {
  const moves = [];

  const addIfValid = (nr, nc) => {
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      if (!board[nr][nc] || board[nr][nc].color !== color) {
        moves.push([nr, nc]);
        return board[nr][nc] ? false : true; // stop sliding if we hit a piece
      }
    }
    return false;
  };

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;

    // Move Forward
    if (r + dir >= 0 && r + dir < 8 && !board[r + dir][c]) {
      moves.push([r + dir, c]);
      // Double Forward Step
      if (r === startRow && !board[r + 2 * dir][c]) {
        moves.push([r + 2 * dir, c]);
      }
    }
    // Diagonal Captures
    if (r + dir >= 0 && r + dir < 8) {
      if (c - 1 >= 0 && board[r + dir][c - 1] && board[r + dir][c - 1].color !== color) moves.push([r + dir, c - 1]);
      if (c + 1 < 8 && board[r + dir][c + 1] && board[r + dir][c + 1].color !== color) moves.push([r + dir, c + 1]);
    }
  }

  if (type === 'n') {
    const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    knightMoves.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
  }

  if (type === 'k') {
    const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    kingMoves.forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
  }

  const slide = (dirs) => {
    dirs.forEach(([dr, dc]) => {
      let nr = r + dr, nc = c + dc;
      while (addIfValid(nr, nc)) {
        nr += dr; nc += dc;
      }
    });
  };

  if (type === 'r' || type === 'q') slide([[-1, 0], [1, 0], [0, -1], [0, 1]]);
  if (type === 'b' || type === 'q') slide([[-1, -1], [-1, 1], [1, -1], [1, 1]]);

  return moves;
};

// --- CSS Animations ---
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .animate-float {
    animation: float 1.5s ease-in-out infinite;
  }
  @keyframes phase-slide {
    0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
    15% { transform: translateX(0) skewX(-15deg); opacity: 1; }
    85% { transform: translateX(0) skewX(-15deg); opacity: 1; }
    100% { transform: translateX(100%) skewX(-15deg); opacity: 0; }
  }
  .animate-phase {
    animation: phase-slide 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }
  .emoji-shadow {
    filter: drop-shadow(0px 6px 4px rgba(0, 0, 0, 0.8));
  }
  .game-bg {
    background-color: #000;
    background-image: radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px),
                      radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px),
                      radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px);
    background-size: 550px 550px, 350px 350px, 250px 250px;
    background-position: 0 0, 40px 60px, 130px 270px;
  }
`;

// --- Main Application ---
export default function App() {
  const [board, setBoard] = useState(createInitialBoard());
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [battleLog, setBattleLog] = useState([{ id: 1, text: 'A long time ago in a galaxy far, far away...' }]);
  const [winner, setWinner] = useState(null);
  const [phaseAnim, setPhaseAnim] = useState(true);
  const logContainerRef = useRef(null);

  // Trigger phase animation on turn change
  useEffect(() => {
    if (winner) return;
    setPhaseAnim(true);
    const t = setTimeout(() => setPhaseAnim(false), 1800);
    return () => clearTimeout(t);
  }, [turn, winner]);

  const handleSquareClick = (r, c) => {
    if (winner || phaseAnim) return;

    const piece = board[r][c];

    // If a piece is already selected
    if (selected) {
      const isMoveValid = validMoves.some(m => m[0] === r && m[1] === c);

      if (isMoveValid) {
        executeMove(selected.r, selected.c, r, c);
        return;
      }

      // If clicking another of our own pieces, switch selection
      if (piece && piece.color === turn) {
        setSelected({ r, c });
        setValidMoves(getPseudoLegalMoves(board, r, c, piece.color, piece.type));
        return;
      }

      // If clicking invalid square, deselect
      setSelected(null);
      setValidMoves([]);
      return;
    }

    // Selecting a piece
    if (piece && piece.color === turn) {
      setSelected({ r, c });
      setValidMoves(getPseudoLegalMoves(board, r, c, piece.color, piece.type));
    }
  };

  const executeMove = (fromR, fromC, toR, toC) => {
    const newBoard = board.map(row => [...row]);
    const movingPiece = { ...newBoard[fromR][fromC] };
    const targetPiece = newBoard[toR][toC];

    let logText = '';
    const movingName = PIECES[movingPiece.color][movingPiece.type].name;

    // Handle Captures
    if (targetPiece) {
      const targetName = PIECES[targetPiece.color][targetPiece.type].name;
      logText = `CRITICAL HIT! ${movingName} destroys ${targetName}!`;

      if (targetPiece.type === 'k') {
        setWinner(movingPiece.color);
        logText += movingPiece.color === 'w' ? ' The Galaxy is saved!' : ' The Dark Side claims the Galaxy...';
      }
    } else {
      logText = `${movingName} advances.`;
    }

    // Handle Promotion
    if (movingPiece.type === 'p') {
      if ((movingPiece.color === 'w' && toR === 0) || (movingPiece.color === 'b' && toR === 7)) {
        movingPiece.type = 'q';
        logText += ` -> Promoted to ${PIECES[movingPiece.color]['q'].name}!`;
      }
    }

    newBoard[toR][toC] = movingPiece;
    newBoard[fromR][fromC] = null;

    setBoard(newBoard);
    setTurn(turn === 'w' ? 'b' : 'w');
    setSelected(null);
    setValidMoves([]);
    setBattleLog(prev => [{ id: Date.now(), text: logText }, ...prev]);
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn('w');
    setSelected(null);
    setValidMoves([]);
    setWinner(null);
    setBattleLog([{ id: Date.now(), text: 'A long time ago in a galaxy far, far away...' }]);
  };

  const getSquareClasses = (r, c) => {
    const isSelected = selected?.r === r && selected?.c === c;
    const isValidMove = validMoves.some(m => m[0] === r && m[1] === c);
    const targetPiece = board[r][c];
    const isCaptureMove = isValidMove && targetPiece;
    const isDark = (r + c) % 2 !== 0;

    let base = isDark ? 'bg-[#1e293b]' : 'bg-[#334155]'; // Sci-fi panel colors
    let highlight = '';

    if (isSelected) {
      highlight = 'ring-inset ring-4 ring-cyan-400 bg-cyan-900/60 z-10';
    } else if (isCaptureMove) {
      highlight = 'ring-inset ring-4 ring-red-500 bg-red-900/80 z-10 cursor-pointer hover:bg-red-800';
    } else if (isValidMove) {
      highlight = 'cursor-pointer hover:bg-cyan-500/30 z-10';
    }

    return `relative flex items-center justify-center transition-colors duration-200 ${base} ${highlight}`;
  };

  return (
    <div className="game-bg min-h-screen text-slate-200 font-mono p-4 md:p-8 flex flex-col items-center select-none overflow-x-hidden uppercase">
      <style>{styles}</style>

      {/* --- Phase Banner Animation --- */}
      {phaseAnim && !winner && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50 overflow-hidden">
          <div className={`
            animate-phase w-full py-6 md:py-10 flex justify-center items-center shadow-2xl border-y-4 border-black/80
            ${turn === 'w' ? 'bg-gradient-to-r from-cyan-900 via-cyan-600 to-cyan-900' : 'bg-gradient-to-r from-red-900 via-red-600 to-red-900'}
          `}>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] italic">
              {turn === 'w' ? 'REBEL PHASE' : 'EMPIRE PHASE'}
            </h2>
          </div>
        </div>
      )}

      {/* --- Title --- */}
      <h1 className="text-3xl md:text-5xl font-black mb-6 md:mb-10 text-center tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_15px_rgba(253,224,71,0.4)]">
        GALACTIC CHESS: 8-BIT WARS
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto items-start justify-center">

        {/* --- Left Column: Board --- */}
        <div className="w-full lg:w-auto flex flex-col items-center flex-shrink-0">

          <div className={`mb-4 px-6 py-2 rounded-sm font-bold text-xl md:text-2xl border-2 shadow-lg transition-colors
            ${turn === 'w' ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200' : 'bg-red-900/50 border-red-500 text-red-200'}`}>
            SYSTEM: {turn === 'w' ? 'LIGHT SIDE' : 'DARK SIDE'}
          </div>

          {/* Game Board Container */}
          <div className="border-4 border-slate-600 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-black p-2 md:p-3 relative">
            <div className="grid grid-cols-8 grid-rows-8 border-4 border-slate-500 w-full max-w-[400px] md:max-w-[600px] aspect-square">
              {board.map((row, r) => row.map((piece, c) => {
                const isValidMove = validMoves.some(m => m[0] === r && m[1] === c);
                const isSelected = selected?.r === r && selected?.c === c;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={getSquareClasses(r, c)}
                    onClick={() => handleSquareClick(r, c)}
                  >
                    {/* Valid move indicator (empty square) */}
                    {isValidMove && !piece && (
                      <div className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-cyan-400 rounded-sm opacity-70 shadow-[0_0_10px_#22d3ee]" />
                    )}

                    {/* Piece Sprite */}
                    {piece && (
                      <div className={`
                          w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 drop-shadow-[0_6px_4px_rgba(0,0,0,0.8)] transition-transform duration-200
                          ${isSelected ? 'animate-float scale-125 z-20' : ''} 
                          ${!isSelected && piece.color === turn ? 'hover:scale-110' : ''}
                        `}>
                        <PixelArt data={PIECES[piece.color][piece.type].sprite} />
                      </div>
                    )}
                  </div>
                );
              }))}
            </div>

            {/* --- Game Over Overlay --- */}
            {winner && (
              <div className="absolute inset-0 bg-black/90 z-40 flex items-center justify-center backdrop-blur-sm transition-all duration-500">
                <div className="text-center p-6 bg-black border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)] transform scale-105 rounded-sm">
                  <h2 className={`text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent 
                    ${winner === 'w' ? 'bg-gradient-to-b from-cyan-300 to-cyan-600' : 'bg-gradient-to-b from-red-400 to-red-700'}`}>
                    {winner === 'w' ? 'REBELLION VICTORIOUS' : 'EMPIRE TRIUMPHANT'}
                  </h2>
                  <p className="text-xl text-slate-300 mb-8 lowercase text-center">
                    {winner === 'w' ? 'the force is strong with this one.' : 'the galaxy falls to the dark side.'}
                  </p>
                  <button onClick={resetGame} className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl rounded-sm shadow-[0_0_15px_#eab308] transform active:scale-95 transition-all">
                    INSERT COIN TO REPLAY
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Right Column: Info & Logs --- */}
        <div className="w-full max-w-[400px] lg:max-w-md flex flex-col gap-6">

          {/* Mission UI */}
          <div className="bg-black border-4 border-slate-700 p-5 shadow-[0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>
            <h2 className="text-2xl font-black mb-3 text-yellow-500 tracking-wide border-b-2 border-slate-600 pb-2">
              MISSION BRIEFING
            </h2>
            <p className="text-slate-300 mb-4 text-sm md:text-base lowercase">
              classic chess protocols engaged. eliminate the enemy leader to secure victory!
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm md:text-base font-bold bg-[#0f172a] p-3 border-2 border-slate-700 rounded-sm">
              <div className="flex flex-col items-center gap-2 text-cyan-400">
                <div className="w-10 h-10"><PixelArt data={PIECES.w.k.sprite} /></div>
                Jedi Master
              </div>
              <div className="flex flex-col items-center gap-2 text-red-400">
                <div className="w-10 h-10"><PixelArt data={PIECES.b.k.sprite} /></div>
                Sith Lord
              </div>
            </div>
          </div>

          {/* Battle Log UI */}
          <div className="bg-black border-4 border-slate-700 shadow-2xl flex flex-col h-64 lg:h-96 rounded-sm">
            <div className="p-3 bg-slate-900 border-b-4 border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-200 tracking-wider">COMBAT LOG</h2>
              <div className="text-xs text-green-400 font-mono">ONLINE</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-mono text-sm md:text-base custom-scrollbar">
              {battleLog.map((log, i) => (
                <div key={log.id} className={`pb-2 border-b border-slate-800/50 ${i === 0 ? 'text-green-400 font-bold opacity-100' : 'text-slate-400 opacity-80'}`}>
                  <span className="text-green-500 mr-2 opacity-70">&gt;</span>
                  <span className={log.text.includes('CRITICAL') ? 'text-red-400' : ''}>{log.text}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={resetGame} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-yellow-500 font-black tracking-widest uppercase rounded-sm border-2 border-yellow-600 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(202,138,4,0.3)]">
            ABORT MISSION
          </button>

        </div>
      </div>
    </div>
  );
}
