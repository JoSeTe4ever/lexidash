import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'preact/hooks';
import GameBoard from '../components/GameBoard';
import { socket } from '../services/socket';

export default function Room() {
  const { roomId } = useParams();

  const [name, setName] = useState("");

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


  useEffect(() => {
    const playerName = prompt("¿Tu nombre?") || "Anónimo";
    setName(playerName);

    if (!playerName) return;

    socket.emit('join-room', { roomId, name });

    socket.on('player-list', ({ players }) => {

      setPlayers(players);
      // am I the admin? 😮
      const me = players.find(p => p.id === socket.id);
      setIsAdmin(me?.isAdmin);
    });

    socket.on('game-started', ({ letters, topic }) => {
      setLetters(letters);
      setTopic(topic);
      setSubmittedWord(null);
      setIsBlocked(false);
      setScorePile([]);
      setHasGameStarted(true);
    });

    socket.on('word-submitted', ({ playerId, word, usedIndexes }) => {
      // Si tú fuiste quien envió, no hacer nada (ya se gestionó localmente)
      if (playerId === socket.id) return;
    
      setLetters(prevLetters => {
        const updated = [...prevLetters];
        usedIndexes.forEach(idx => {
          updated[idx] = null;
        });
        return updated;
      });
    });

    socket.on('room-error', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off('game-started');
      socket.off('word-submitted');
      socket.off('player-list');
    };
  }, [roomId]);

  const handleStartGame = () => {
    socket.emit('start-game', { roomId });
  };

  const handleSubmit = () => {
    if (!word.trim()) return;

    const upperWord = word.toUpperCase();
    const copyLetters = [...letters];
    const tempIndexes = [];

    for (let char of upperWord) {
      const index = copyLetters.findIndex((l, i) => l === char && !tempIndexes.includes(i));
      if (index !== -1) {
        tempIndexes.push(index);
      } else {
        setMessage('❌ Usa solo letras del tablero.');
        return;
      }
    }

    setUsedIndexes(tempIndexes);
    setSubmittedWord(upperWord);
    setIsBlocked(true);
    setMessage('✅ ¡Palabra aceptada!');

    setTimeout(() => {
      const updatedLetters = [...letters];
      const wonLetters = [];
      tempIndexes.forEach(idx => {
        wonLetters.push(updatedLetters[idx]);
        updatedLetters[idx] = null;
      });
      setLetters(updatedLetters);
      setUsedIndexes([]);
      setScorePile(prev => [...prev, ...wonLetters]);
    }, 500);

    socket.emit('submit-word', {
      roomId,
      word: upperWord,
      playerId: socket.id,
      usedIndexes: tempIndexes, 
    });

    setWord('');
  };

  return (
    <div className="p-6 bg-green-50 min-h-screen flex flex-col items-center">

    {error && (
      <div className="bg-red-100 text-red-800 border border-red-400 px-4 py-2 rounded mb-4 text-center max-w-lg">
        ⚠️ {error}
      </div>
    )}

      <h2 className="text-2xl font-bold mb-4">Sala: {roomId}</h2>

      <div className="mt-2 text-gray-800 text-sm">
        Jugadores en sala: {players.length}
        <ul className="list-disc ml-6">
          {players.map((p) => (
            <li key={p.id}>
              {p.name} {p.isAdmin && <span className="text-xs text-orange-600">(admin)</span>}
            </li>
          ))}
        </ul>
      </div>

      {!hasGameStarted && isAdmin && (
        <button onClick={handleStartGame} className="mb-4 bg-indigo-500 text-white px-4 py-2 rounded-md">
          Iniciar partida
        </button>
      )}

      {
        hasGameStarted && (
          <GameBoard letters={letters} topic={topic} usedIndexes={usedIndexes} />
        )
      }

      {hasGameStarted && (
        !isBlocked ? (
          <div className="mt-6 flex flex-col items-center gap-2">
            <input
              type="text"
              className="border-2 border-gray-300 rounded-md px-4 py-2 text-xl"
              placeholder="Escribe tu palabra"
              value={word}
              onInput={(e) => setWord(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Enviar palabra
            </button>
            {message && <p className="text-sm mt-1">{message}</p>}
          </div>
        ) : (
          <div className="mt-6 text-lg text-green-700 font-semibold">
            Has enviado: {submittedWord}
          </div>
        ))}

      {hasGameStarted && (
        <div className="mt-8 flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-700 mb-2">Tu montón de puntuación:</h3>
          <div className="flex gap-2 flex-wrap justify-center">
            {scorePile.map((letter, idx) => (
              <div
                key={idx}
                className="w-12 h-16 flex items-center justify-center text-xl font-bold bg-yellow-100 border-2 border-yellow-500 rounded-md shadow"
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}