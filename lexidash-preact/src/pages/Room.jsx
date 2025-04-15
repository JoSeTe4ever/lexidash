import { useParams } from 'react-router-dom';
import { useState } from 'preact/hooks';

export default function Room() {
  const { roomId } = useParams();
  const [players, setPlayers] = useState(['Jugador1', 'Jugador2']);

  return (
    <div className="p-6 bg-green-50 min-h-screen">
      <h2 className="text-2xl font-bold">Sala: {roomId}</h2>
      <div className="mt-4">
        <h3 className="font-semibold">Jugadores conectados:</h3>
        <ul className="list-disc pl-6 text-lg text-gray-700">
          {players.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}