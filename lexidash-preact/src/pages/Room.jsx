import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'preact/hooks';
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
    const playerName = prompt("¿Tu nombre?") || "Anónimo";
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
      if (serverScores) setScores(serverScores);
      if (vd !== undefined) setValidateDictionary(vd);
    });

    socket.on('word-submitted', ({ playerId, usedIndexes, scores: serverScores }) => {
      // Si tú fuiste quien envió, no hacer nada (ya se gestionó localmente)
      if (playerId === socket.id) {
        if (serverScores) setScores(serverScores);
        return;
      }

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
    alert('¡Enlace de invitación copiado al portapapeles!');
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
    setMessage('✅ ¡Palabra aceptada!');

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

    setWord('');
  };

  return (
    <div className="room-container">
      <div className="w-full max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
        {error && (
          <div className="bg-red-100 text-red-800 border border-red-400 px-4 py-2 rounded mb-4 text-center w-full">
            ⚠️ {error}
          </div>
        )}

        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">Sala: {roomId}</h2>

        <div className="mt-2 text-gray-800 text-sm w-full">
          Jugadores en sala: {players.length}
          <ul className="list-disc ml-6">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                {p.name} {p.isAdmin && <span className="text-xs text-orange-600">(admin)</span>}
                {hasGameStarted && (
                  <span className="ml-1 font-bold text-indigo-700">{scores[p.id] ?? 0} pts</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isAdmin && (
          <>
            <button
              onClick={handleResetGame}
              className="mt-3 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition w-full sm:w-auto min-h-[48px]"
            >
              🔁 Nueva ronda
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
                  placeholder="Escribe tu palabra"
                  value={word}
                  onInput={(e) => setWord(e.target.value)}
                />
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 w-full sm:w-auto min-h-[48px]"
                >
                  Enviar palabra
                </button>
                {message && <p className="text-sm mt-1">{message}</p>}
              </div>
            ) : submittedWord && (
              <div className="mt-6 text-base sm:text-lg text-green-700 font-semibold text-center">
                Has enviado: {submittedWord}
              </div>
            )}

            {submittedWord && (
              <div className="mt-6 flex flex-col items-center w-full">
                <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-2">Tu montón de puntuación:</h3>
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
                  Total acumulado: {scores[socket.id] ?? 0} pts
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}