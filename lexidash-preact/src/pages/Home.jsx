import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';

export default function Home() {
  const navigate = useNavigate();

  const createRoom = () => {
    socket.emit('create-room');
    socket.once('room-created', ({ roomId }) => {
      navigate(`/room/${roomId}`);
    });
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-yellow-50">
      <h1 className="text-4xl font-bold">Welcome to online</h1>
      <div class="title">
        <span class="fast"><span class="big-letter">F</span>ast</span>
        <span class="words"><span class="big-letter">W</span>ords</span><span class="big-letter exclamation">!</span>
      </div>
      <button
        onClick={createRoom}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 transition"
      >
        Crear sala
      </button>
    </div>
  );
}