import React, { useState, useEffect, useRef } from 'react';

// --- Firebase Imports for Online PvP ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, collection } from 'firebase/firestore';

// --- Firebase Initialization ---
let db = null;
let auth = null;
let appId = 'default-app-id';

try {
  if (typeof __firebase_config !== 'undefined') {
    const firebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  if (typeof __app_id !== 'undefined') {
    appId = __app_id;
  }
} catch (error) {
  console.warn("Firebase is not available in this environment. Online mode may not work.");
}

// --- Audio System (Web Audio API) ---
const playSFX = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'move') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'capture') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'error') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    }
  } catch (e) {
    console.error("Audio failed", e);
  }
};


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

// --- Game Data ---
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
        return board[nr][nc] ? false : true;
      }
    }
    return false;
  };

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    if (r + dir >= 0 && r + dir < 8 && !board[r + dir][c]) {
      moves.push([r + dir, c]);
      if (r === startRow && !board[r + 2 * dir][c]) {
        moves.push([r + 2 * dir, c]);
      }
    }
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
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #0f172a; 
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155; 
    border-radius: 4px;
  }
`;

// --- Main Application ---
export default function App() {
  const [viewState, setViewState] = useState('menu'); // 'menu', 'playing'
  const [gameMode, setGameMode] = useState('local'); // 'local', 'online'

  // Game State
  const [board, setBoard] = useState(createInitialBoard());
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [battleLog, setBattleLog] = useState([{ id: 1, text: 'System online... Ready for combat!' }]);
  const [winner, setWinner] = useState(null);
  const [phaseAnim, setPhaseAnim] = useState(false);

  // Settings
  const [autoFlip, setAutoFlip] = useState(true);

  // Online Multiplayer State
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Firebase Auth Setup
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Listen to Firestore Room Changes
  useEffect(() => {
    if (gameMode !== 'online' || !roomId || !user || !db) return;

    const roomRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'chess_rooms'), roomId);
    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBoard(JSON.parse(data.boardState));
        setTurn(data.turn);
        setWinner(data.winner);

        if (data.lastLog) {
          const parsedLog = JSON.parse(data.lastLog);
          setBattleLog(prev => {
            if (prev.length > 0 && prev[0].id === parsedLog.id) return prev;
            return [parsedLog, ...prev];
          });
        }

        // Ensure player retains correct color if rejoining
        if (data.playerW === user.uid) setPlayerColor('w');
        else if (data.playerB === user.uid) setPlayerColor('b');
      }
    }, (err) => {
      console.error(err);
      setErrorMsg("Connection to room lost.");
    });

    return () => unsub();
  }, [gameMode, roomId, user]);

  // Trigger phase animation on turn change
  useEffect(() => {
    if (winner || viewState !== 'playing') return;
    setPhaseAnim(true);
    const t = setTimeout(() => setPhaseAnim(false), 1800);
    return () => clearTimeout(t);
  }, [turn, winner, viewState]);

  // Handle Online Creation
  const handleCreateRoom = async () => {
    if (!user || !db) return setErrorMsg("Firebase connection not available.");
    try {
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const roomRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'chess_rooms'), newRoomId);
      await setDoc(roomRef, {
        boardState: JSON.stringify(createInitialBoard()),
        turn: 'w',
        winner: null,
        lastLog: JSON.stringify({ id: Date.now(), text: 'Room created. Waiting for opponent...' }),
        playerW: user.uid,
        playerB: null,
        status: 'waiting'
      });
      setRoomId(newRoomId);
      setGameMode('online');
      setPlayerColor('w');
      setViewState('playing');
      setBoard(createInitialBoard());
      setTurn('w');
      setWinner(null);
    } catch (err) {
      setErrorMsg("Failed to create room: " + err.message);
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !db) return setErrorMsg("Firebase connection not available.");
    if (!joinInput.trim()) return setErrorMsg("Enter a room code!");

    try {
      const idToJoin = joinInput.trim().toUpperCase();
      const roomRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'chess_rooms'), idToJoin);
      const snap = await getDoc(roomRef);

      if (snap.exists()) {
        const data = snap.data();
        if (!data.playerB && data.playerW !== user.uid) {
          // Join as Black
          await setDoc(roomRef, { ...data, playerB: user.uid, status: 'playing' });
          setRoomId(idToJoin);
          setGameMode('online');
          setPlayerColor('b');
          setViewState('playing');
        } else if (data.playerW === user.uid || data.playerB === user.uid) {
          // Rejoin
          setRoomId(idToJoin);
          setGameMode('online');
          setPlayerColor(data.playerW === user.uid ? 'w' : 'b');
          setViewState('playing');
        } else {
          setErrorMsg('Room is full!');
        }
      } else {
        setErrorMsg('Room not found!');
      }
    } catch (err) {
      setErrorMsg("Failed to join: " + err.message);
    }
  };

  const startLocalGame = () => {
    setGameMode('local');
    setPlayerColor(null);
    setBoard(createInitialBoard());
    setTurn('w');
    setWinner(null);
    setBattleLog([{ id: Date.now(), text: 'Local system online. Ready for combat!' }]);
    setViewState('playing');
  };

  const quitToMenu = () => {
    setViewState('menu');
    setRoomId('');
    setErrorMsg('');
  };

  const handleSquareClick = (r, c) => {
    if (winner || phaseAnim) return;

    // Online Mode Check: Prevents moving opponent's pieces
    if (gameMode === 'online' && turn !== playerColor) {
      playSFX('error');
      return;
    }

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
      playSFX('error');
      setSelected(null);
      setValidMoves([]);
      return;
    }

    // Selecting a piece
    if (piece && piece.color === turn) {
      setSelected({ r, c });
      setValidMoves(getPseudoLegalMoves(board, r, c, piece.color, piece.type));
    } else {
      playSFX('error');
    }
  };

  const executeMove = (fromR, fromC, toR, toC) => {
    const newBoard = board.map(row => [...row]);
    const movingPiece = { ...newBoard[fromR][fromC] };
    const targetPiece = newBoard[toR][toC];

    let logText = '';
    const movingName = PIECES[movingPiece.color][movingPiece.type].name;
    let newWinner = winner;

    // Handle Captures
    if (targetPiece) {
      playSFX('capture');
      const targetName = PIECES[targetPiece.color][targetPiece.type].name;
      logText = `CRITICAL HIT! ${movingName} destroys ${targetName}!`;

      if (targetPiece.type === 'k') {
        newWinner = movingPiece.color;
        logText += movingPiece.color === 'w' ? ' The Galaxy is saved!' : ' The Dark Side claims the Galaxy...';
      }
    } else {
      playSFX('move');
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

    const newTurn = turn === 'w' ? 'b' : 'w';
    const newLogEntry = { id: Date.now(), text: logText };

    // Update Local State immediately
    setBoard(newBoard);
    setTurn(newTurn);
    setSelected(null);
    setValidMoves([]);
    setWinner(newWinner);
    setBattleLog(prev => [newLogEntry, ...prev]);

    // Send to Firebase if Online
    if (gameMode === 'online' && roomId && db) {
      const roomRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'chess_rooms'), roomId);
      setDoc(roomRef, {
        boardState: JSON.stringify(newBoard),
        turn: newTurn,
        winner: newWinner,
        lastLog: JSON.stringify(newLogEntry)
      }, { merge: true }).catch(err => console.error(err));
    }
  };

  const getSquareClasses = (r, c) => {
    const isSelected = selected?.r === r && selected?.c === c;
    const isValidMove = validMoves.some(m => m[0] === r && m[1] === c);
    const targetPiece = board[r][c];
    const isCaptureMove = isValidMove && targetPiece;
    const isDark = (r + c) % 2 !== 0;

    let base = isDark ? 'bg-[#1e293b]' : 'bg-[#334155]';
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

  // Flip logic
  const shouldFlip = autoFlip && (gameMode === 'online' && playerColor ? playerColor === 'b' : turn === 'b');

  return (
    <div className="game-bg min-h-screen text-slate-200 font-mono p-4 md:p-8 flex flex-col items-center select-none overflow-x-hidden uppercase">
      <style>{styles}</style>

      {/* --- MENU LOBI --- */}
      {viewState === 'menu' && (
        <div className="flex flex-col items-center mt-10 md:mt-20 max-w-lg w-full">
          <h1 className="text-4xl md:text-6xl font-black mb-10 text-center tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_15px_rgba(253,224,71,0.4)]">
            GALACTIC CHESS: 8-BIT WARS
          </h1>

          <div className="bg-black/80 border-4 border-slate-600 p-8 rounded-sm w-full flex flex-col gap-6 shadow-2xl">
            {errorMsg && (
              <div className="bg-red-900/50 border-2 border-red-500 text-red-300 p-3 text-sm text-center font-bold">
                ! {errorMsg} !
              </div>
            )}

            <button onClick={startLocalGame} className="w-full py-4 bg-slate-800 hover:bg-cyan-900 text-cyan-400 font-black tracking-widest border-2 border-cyan-700 active:scale-95 transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              LOCAL PLAY (1 SCREEN)
            </button>

            <div className="border-b-2 border-slate-700 my-2"></div>

            <button onClick={handleCreateRoom} className="w-full py-4 bg-slate-800 hover:bg-green-900 text-green-400 font-black tracking-widest border-2 border-green-700 active:scale-95 transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)]">
              CREATE ONLINE ROOM
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                value={joinInput}
                onChange={e => setJoinInput(e.target.value)}
                placeholder="ROOM CODE"
                maxLength={6}
                className="w-full bg-slate-900 border-2 border-slate-600 text-white px-4 py-2 uppercase tracking-widest text-center focus:outline-none focus:border-yellow-500"
              />
              <button onClick={handleJoinRoom} className="px-6 bg-yellow-600 hover:bg-yellow-500 text-black font-black border-2 border-yellow-700 active:scale-95 transition-all">
                JOIN
              </button>
            </div>
          </div>
        </div>
      )}


      {/* --- AREA PERMAINAN --- */}
      {viewState === 'playing' && (
        <>
          {/* Phase Banner Animation */}
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

          <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto items-start justify-center">

            {/* Left Column: Board */}
            <div className="w-full lg:w-auto flex flex-col items-center flex-shrink-0">

              <div className="flex justify-between w-full max-w-[400px] md:max-w-[600px] mb-4 gap-4">
                <div className={`flex-1 px-4 py-2 text-center rounded-sm font-bold text-sm md:text-lg border-2 shadow-lg transition-colors
                  ${turn === 'w' ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200' : 'bg-red-900/50 border-red-500 text-red-200'}`}>
                  SYSTEM: {turn === 'w' ? 'LIGHT SIDE' : 'DARK SIDE'}
                </div>

                <button
                  onClick={() => setAutoFlip(!autoFlip)}
                  className={`px-4 py-2 border-2 font-bold text-xs md:text-sm rounded-sm transition-colors ${autoFlip ? 'bg-green-900/50 border-green-500 text-green-200' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                  FLIP: {autoFlip ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Game Board Container */}
              <div className="border-4 border-slate-600 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-black p-2 md:p-3 relative">
                <div className={`grid grid-cols-8 grid-rows-8 border-4 border-slate-500 w-full max-w-[400px] md:max-w-[600px] aspect-square transition-transform duration-700 ease-in-out ${shouldFlip ? 'rotate-180' : ''}`}>
                  {board.map((row, r) => row.map((piece, c) => {
                    const isValidMove = validMoves.some(m => m[0] === r && m[1] === c);
                    const isSelected = selected?.r === r && selected?.c === c;

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={getSquareClasses(r, c)}
                        onClick={() => handleSquareClick(r, c)}
                      >
                        {/* Valid move indicator */}
                        {isValidMove && !piece && (
                          <div className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-cyan-400 rounded-sm opacity-70 shadow-[0_0_10px_#22d3ee]" />
                        )}

                        {/* Piece Sprite */}
                        {piece && (
                          <div className={`
                              w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 drop-shadow-[0_6px_4px_rgba(0,0,0,0.8)] transition-all duration-300
                              ${shouldFlip ? 'rotate-180' : ''}
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

                {/* Game Over Overlay */}
                {winner && (
                  <div className="absolute inset-0 bg-black/90 z-40 flex items-center justify-center backdrop-blur-sm transition-all duration-500">
                    <div className="text-center p-6 bg-black border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)] transform scale-105 rounded-sm">
                      <h2 className={`text-3xl md:text-5xl font-black mb-4 bg-clip-text text-transparent 
                        ${winner === 'w' ? 'bg-gradient-to-b from-cyan-300 to-cyan-600' : 'bg-gradient-to-b from-red-400 to-red-700'}`}>
                        {winner === 'w' ? 'REBELLION VICTORIOUS' : 'EMPIRE TRIUMPHANT'}
                      </h2>
                      <p className="text-lg text-slate-300 mb-8 lowercase text-center">
                        {winner === 'w' ? 'the force is strong with this one.' : 'the galaxy falls to the dark side.'}
                      </p>
                      <button onClick={quitToMenu} className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl rounded-sm shadow-[0_0_15px_#eab308] transform active:scale-95 transition-all">
                        RETURN TO LOBBY
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Info & Logs */}
            <div className="w-full max-w-[400px] lg:max-w-md flex flex-col gap-6">

              {/* Online Info Panel */}
              {gameMode === 'online' && (
                <div className="bg-[#0f172a] border-2 border-cyan-700 p-4 rounded-sm flex flex-col items-center shadow-lg">
                  <div className="text-slate-400 text-xs tracking-widest mb-1">ROOM CODE:</div>
                  <div className="text-3xl font-black text-cyan-400 tracking-widest select-all">{roomId}</div>
                  <div className={`mt-2 text-sm font-bold ${playerColor === 'w' ? 'text-cyan-200' : 'text-red-200'}`}>
                    YOU ARE PLAYING AS: {playerColor === 'w' ? 'LIGHT SIDE' : 'DARK SIDE'}
                  </div>
                </div>
              )}

              {/* Mission UI */}
              <div className="bg-black border-4 border-slate-700 p-5 shadow-[0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden rounded-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>
                <h2 className="text-xl font-black mb-3 text-yellow-500 tracking-wide border-b-2 border-slate-600 pb-2">
                  MISSION BRIEFING
                </h2>
                <p className="text-slate-300 mb-4 text-xs md:text-sm lowercase">
                  classic chess protocols engaged. eliminate the enemy leader to secure victory!
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm font-bold bg-[#0f172a] p-3 border-2 border-slate-700 rounded-sm">
                  <div className="flex flex-col items-center gap-2 text-cyan-400">
                    <div className="w-8 h-8"><PixelArt data={PIECES.w.k.sprite} /></div>
                    Jedi Master
                  </div>
                  <div className="flex flex-col items-center gap-2 text-red-400">
                    <div className="w-8 h-8"><PixelArt data={PIECES.b.k.sprite} /></div>
                    Sith Lord
                  </div>
                </div>
              </div>

              {/* Battle Log UI */}
              <div className="bg-black border-4 border-slate-700 shadow-2xl flex flex-col h-56 lg:h-80 rounded-sm">
                <div className="p-3 bg-slate-900 border-b-4 border-slate-700 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-200 tracking-wider">COMBAT LOG</h2>
                  <div className={`text-xs font-mono ${gameMode === 'online' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {gameMode === 'online' ? 'ONLINE' : 'LOCAL'}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-mono text-xs md:text-sm custom-scrollbar">
                  {battleLog.map((log, i) => (
                    <div key={log.id} className={`pb-2 border-b border-slate-800/50 ${i === 0 ? 'text-green-400 font-bold opacity-100' : 'text-slate-400 opacity-80'}`}>
                      <span className="text-green-500 mr-2 opacity-70">&gt;</span>
                      <span className={log.text.includes('CRITICAL') ? 'text-red-400' : ''}>{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={quitToMenu} className="w-full py-3 bg-slate-800 hover:bg-red-900 text-red-400 font-black tracking-widest uppercase rounded-sm border-2 border-red-700 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                ABORT MISSION (RETURN TO LOBBY)
              </button>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
