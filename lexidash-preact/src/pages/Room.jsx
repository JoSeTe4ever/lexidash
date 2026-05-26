import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'preact/hooks';
import GameBoard from '../components/GameBoard';
import { socket } from '../services/socket';

export default function Room() {
  const { roomId } = useParams();

  const [name, setName] = useState("");
  const [roundEnded, setRoundEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [letters, setLetters] = useState([]);
  const [topic, setTopic] = useState('');
  const [word, setWord] = useState('');
  const [submittedWord, setSubmittedWord] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [usedIndexes, setUsedIndexes] = useState([]);
  const [scorePile, setScorePile] = useState([]);
  const [message, setMessage] = useState('');

  const [players, setPlayers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({});
  const [validateDictionary, setValidateDictionary] = useState(true);
  const [roundHistory, setRoundHistory] = useState([]);
  const [currentRound, setCurrentRound] = useState(-1);

  const roundStartTimeRef = useRef(null);
  const lettersRef = useRef([]);
  const currentRoundRef = useRef(-1);
  const playersRef = useRef([]);


  // Keep refs in sync so socket handlers can read current state without stale closures
  useEffect(() => {
    lettersRef.current = letters;
  }, [letters]);

  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    socket.on('round-ended', ({ scores: serverScores } = {}) => {
      setRoundEnded(true);
      if (serverScores) setScores(serverScores);
    });

    return () => {
      socket.off('round-ended');
    };
  }, []);


  useEffect(() => {
    const playerName = prompt("What's your name?") || "Anonymous";
    setName(playerName);

    if (!playerName) return;

    socket.emit('join-room', { roomId: roomId, name: playerName });

    socket.on('player-list', ({ players, scores: serverScores, validateDictionary: vd }) => {
      setPlayers(players);
      if (serverScores) setScores(serverScores);
      if (vd !== undefined) setValidateDictionary(vd);
      // am I the admin? 😮
      const me = players.find(p => p.id === socket.id);
      setIsAdmin(me?.isAdmin);
    });

    socket.on('game-started', ({ letters, topic, scores: serverScores, validateDictionary: vd }) => {
      setLetters(letters);
      setTopic(topic);
      setSubmittedWord(null);
      setIsBlocked(false);
      setScorePile([]);
      setHasGameStarted(true);
      setUsedIndexes([]);
      setCurrentRound(0);
      currentRoundRef.current = 0;
      roundStartTimeRef.current = Date.now();
      if (serverScores) setScores(serverScores);
      if (vd !== undefined) setValidateDictionary(vd);
    });

    socket.on('game-reset', ({ letters, topic, scores: serverScores, validateDictionary: vd }) => {
      setLetters(letters);
      setTopic(topic);
      setSubmittedWord(null);
      setScorePile([]);
      setIsBlocked(false);
      setUsedIndexes([]);
      setMessage('');
      setHasGameStarted(true);
      setCurrentRound(prev => {
        const next = prev + 1;
        currentRoundRef.current = next;
        return next;
      });
      roundStartTimeRef.current = Date.now();
      if (serverScores) setScores(serverScores);
      if (vd !== undefined) setValidateDictionary(vd);
    });

    socket.on('word-submitted', ({ playerId, word, usedIndexes, score, scores: serverScores }) => {
      // Si tú fuiste quien envió, no hacer nada (ya se gestionó localmente)
      if (playerId === socket.id) {
        if (serverScores) setScores(serverScores);
        return;
      }

      // Capture letters from board before nullifying, and compute elapsed time
      const usedLetters = usedIndexes.map(idx => lettersRef.current[idx]).filter(Boolean);
      const elapsed = roundStartTimeRef.current
        ? Math.round((Date.now() - roundStartTimeRef.current) / 1000)
        : null;
      const playerName = playersRef.current.find(p => p.id === playerId)?.name ?? playerId;
      const isPlayerAdmin = playersRef.current.find(p => p.id === playerId)?.isAdmin ?? false;
      setRoundHistory(prev => [...prev, {
        round: currentRoundRef.current,
        playerId,
        name: playerName,
        isAdmin: isPlayerAdmin,
        word,
        letters: usedLetters,
        time: elapsed,
        pts: score ?? usedLetters.length,
      }]);

      setLetters(prevLetters => {
        const updated = [...prevLetters];
        usedIndexes.forEach(idx => {
          updated[idx] = null;
        });
        return updated;
      });
      if (serverScores) setScores(serverScores);
    });

    socket.on('word-invalid', ({ message: invalidMsg }) => {
      setIsBlocked(false);
      setSubmittedWord(null);
      setScorePile([]);
      setUsedIndexes([]);
      setMessage(`❌ ${invalidMsg}`);
    });

    socket.on('room-error', ({ message }) => {
      setError(message);
    });

    socket.on('game-state', ({ letters, topic, scores: serverScores, validateDictionary: vd }) => {
      if (letters && letters.length > 0) {
        setHasGameStarted(true);
        setLetters(letters);
        setTopic(topic);
      }
      if (serverScores) setScores(serverScores);
      if (vd !== undefined) setValidateDictionary(vd);
    });

    return () => {
      socket.off('game-started');
      socket.off('word-submitted');
      socket.off('word-invalid');
      socket.off('player-list');
      socket.off('game-reset');
      socket.off('join-room');
    };
  }, [roomId]);

  const handleInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Invitation link copied to clipboard!');
  };

  const handleResetGame = () => {
    setIsLoading(true);
    setRoundEnded(false); // ✅ resetear visualmente
    socket.emit('reset-game', { roomId });
  };

  const handleSubmit = () => {
    if (!word.trim()) return;

    const upperWord = word.toUpperCase();
    const copyLetters = [...letters];
    const tempIndexes = [];

    // Solo eliminar letras que están en el tablero
    for (let char of upperWord) {
      const index = copyLetters.findIndex((l, i) => l === char && !tempIndexes.includes(i));
      if (index !== -1) {
        tempIndexes.push(index);
        copyLetters[index] = null; // Marcar la letra como usada
      }
    }

    // Actualizar estado local
    setUsedIndexes(tempIndexes);
    setSubmittedWord(upperWord);
    setIsBlocked(true);
    setMessage('✅ Word accepted!');

    const updatedLetters = [...letters];
    setLetters([...letters]);
    const wonLetters = [];
    tempIndexes.forEach(idx => {
      wonLetters.push(updatedLetters[idx]);
    });
    setScorePile(prev => [...prev, ...wonLetters]);

    // Emitir evento al servidor
    socket.emit('submit-word', {
      roomId,
      word: upperWord,
      playerId: socket.id,
      usedIndexes: tempIndexes,
    });

    // Guardar submission propia en el historial
    const elapsed = roundStartTimeRef.current
      ? Math.round((Date.now() - roundStartTimeRef.current) / 1000)
      : null;
    const mePlayer = playersRef.current.find(p => p.id === socket.id);
    setRoundHistory(prev => [...prev, {
      round: currentRoundRef.current,
      playerId: socket.id,
      name: name,
      isAdmin: mePlayer?.isAdmin ?? false,
      word: upperWord,
      letters: wonLetters,
      time: elapsed,
      pts: tempIndexes.length,
    }]);

    setWord('');
  };

  return (
    <div className="room-container">
      <div className="w-full max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-100 text-red-800 border border-red-400 px-4 py-2 rounded mb-4 text-center w-full">
            ⚠️ {error}
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">Room: {roomId}</h2>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT: round history table */}
          <div className="w-full lg:w-2/5 text-gray-800 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">Players: {players.length}</span>
              {currentRound >= 0 && (
                <span className="text-xs text-indigo-600 font-medium">Round {currentRound}</span>
              )}
            </div>
            <div className="overflow-y-auto max-h-[60vh] rounded-md border border-gray-200">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-indigo-50 text-indigo-800 sticky top-0 z-10">
                    <th className="text-center px-2 py-1.5 font-semibold border-b border-indigo-100">#</th>
                    <th className="text-left px-2 py-1.5 font-semibold border-b border-indigo-100">Player</th>
                    <th className="text-center px-2 py-1.5 font-semibold border-b border-indigo-100">Pts</th>
                    {hasGameStarted && (
                      <>
                        <th className="text-left px-2 py-1.5 font-semibold border-b border-indigo-100">Word</th>
                        <th className="text-left px-2 py-1.5 font-semibold border-b border-indigo-100">Play</th>
                        <th className="text-center px-2 py-1.5 font-semibold border-b border-indigo-100">Time</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {roundHistory.length === 0 && !hasGameStarted ? (
                    players.map((p, i) => (
                      <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100 text-gray-400">—</td>
                        <td className="px-2 py-1.5 border-b border-gray-100">
                          <span className="font-medium">{p.name}</span>
                          {p.isAdmin && <span className="ml-1.5 text-xs text-orange-600 font-semibold">(admin)</span>}
                        </td>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100 font-bold text-indigo-700">
                          {scores[p.id] ?? 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    roundHistory.map((entry, i) => (
                      <tr key={`${entry.round}-${entry.playerId}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100 font-mono text-indigo-500 font-semibold">
                          {entry.round}
                        </td>
                        <td className="px-2 py-1.5 border-b border-gray-100">
                          <span className="font-medium">{entry.name}</span>
                          {entry.isAdmin && <span className="ml-1.5 text-xs text-orange-600 font-semibold">(admin)</span>}
                        </td>
                        <td className="px-2 py-1.5 text-center border-b border-gray-100 font-bold text-indigo-700">
                          {entry.pts}
                        </td>
                        {hasGameStarted && (
                          <>
                            <td className="px-2 py-1.5 border-b border-gray-100 font-mono tracking-wide">
                              {entry.word ?? <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-2 py-1.5 border-b border-gray-100">
                              {entry.letters?.length > 0 ? (
                                <div className="flex gap-0.5 flex-wrap">
                                  {entry.letters.map((l, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center justify-center w-4 h-5 text-xs font-bold bg-yellow-100 border border-yellow-400 rounded shadow-sm"
                                    >
                                      {l}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-center border-b border-gray-100 text-gray-600">
                              {entry.time != null ? `${entry.time}s` : <span className="text-gray-300">—</span>}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: game board + controls */}
          <div className="w-full lg:w-3/5 flex flex-col items-center">
            {isAdmin && (
              <>
                <button
                  onClick={handleResetGame}
                  className="mt-3 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition w-full sm:w-auto min-h-[48px]"
                >
                  🔁 New round
                </button>
                <button
                  onClick={handleInvite}
                  className="mt-2 bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition w-full sm:w-auto min-h-[48px]"
                >
                  📋 Invite
                </button>
              </>
            )}

            {hasGameStarted && (
              <GameBoard letters={letters} topic={topic} usedIndexes={usedIndexes} />
            )}

            {hasGameStarted && (
              <>
                {!isBlocked ? (
                  <div className="mt-6 flex flex-col items-center gap-2 w-full">
                    <input
                      type="text"
                      className="border-2 border-gray-300 rounded-md px-4 py-2 text-lg sm:text-xl w-full"
                      placeholder="Type your word"
                      value={word}
                      onInput={(e) => setWord(e.target.value)}
                    />
                    <button
                      onClick={handleSubmit}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 w-full sm:w-auto min-h-[48px]"
                    >
                      Submit word
                    </button>
                    {message && <p className="text-sm mt-1">{message}</p>}
                  </div>
                ) : submittedWord && (
                  <div className="mt-6 text-base sm:text-lg text-green-700 font-semibold text-center">
                    You submitted: {submittedWord}
                  </div>
                )}

                {submittedWord && (
                  <div className="mt-6 flex flex-col items-center w-full">
                    <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-2">Your score pile:</h3>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {scorePile.map((letter, idx) => (
                        <div
                          key={idx}
                          className="w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center text-lg sm:text-xl font-bold bg-yellow-100 border-2 border-yellow-500 rounded-md shadow"
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-indigo-700 font-bold text-base sm:text-lg">
                      Total: {scores[socket.id] ?? 0} pts
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}