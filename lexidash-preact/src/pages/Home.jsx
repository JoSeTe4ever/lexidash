import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const navigate = useNavigate();

  const createRoom = () => {
    const roomId = uuidv4().slice(0, 6);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-yellow-50">
      <h1 className="text-4xl font-bold">LexiDash</h1>
      <button
        onClick={createRoom}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition"
      >
        Crear sala
      </button>
    </div>
  );
}