import { useParams } from 'react-router-dom';
import { useState } from 'preact/hooks';
import GameBoard from '../components/GameBoard';

export default function Room() {
  const { roomId } = useParams();

  const [letters, setLetters] = useState([
    'A', 'M', 'R',
    'L', 'O',
    'G', 'N', 'E',
  ]);
  const topic = 'Comida';

  const [word, setWord] = useState('');
  const [submittedWord, setSubmittedWord] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [message, setMessage] = useState('');
  const [usedIndexes, setUsedIndexes] = useState([]);
  const [scorePile, setScorePile] = useState([]);

  const handleSubmit = () => {
    if (!word.trim()) {
      setMessage('Introduce una palabra.');
      return;
    }

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

    setWord('');
  };

  return (
    <div className="p-6 bg-green-50 min-h-screen flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Sala: {roomId}</h2>
      <GameBoard letters={letters} topic={topic} usedIndexes={usedIndexes} />

      {!isBlocked ? (
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
      )}

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
    </div>
  );
}