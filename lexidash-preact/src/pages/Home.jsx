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
    <div className="home-screen">
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-center">Welcome to online</h1>
        <div class="title">
          <span class="fast"><span class="big-letter">F</span>ast</span>
          <span class="words"><span class="big-letter">W</span>ords</span><span class="big-letter exclamation">!</span>
        </div>
        <button
          onClick={createRoom}
          className="bg-blue-600 text-white px-8 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition text-lg w-full max-w-xs min-h-[48px]"
        >
          Crear sala
        </button>
      </div>
    </div>
  );
}