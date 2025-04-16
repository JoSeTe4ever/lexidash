import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const PORT = process.env.PORT || 3001;

let rooms = {}; // roomId -> { players: [], board: [], topic: "" }

app.use(cors());

app.get('/', (req, res) => {
  res.send('Lexidash backend is running!');
});

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ${socket.id}`);

  socket.on('create-room', () => {
    const roomId = uuidv4().slice(0, 6);
    rooms[roomId] = { players: [], board: [], topic: "" };
    socket.join(roomId);
    rooms[roomId].players.push(socket.id);

    socket.emit('room-created', { roomId });
    console.log(`[Room Created] ${roomId}`);
  });

  socket.on('join-room', ({ roomId }) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId].players.push(socket.id);
      io.to(roomId).emit('player-joined', { playerId: socket.id });
    } else {
      socket.emit('error', { message: 'Room does not exist' });
    }
  });

  socket.on('start-game', ({ roomId }) => {
    const letters = generateLetters();
    const topic = getRandomTopic();
    rooms[roomId].board = letters;
    rooms[roomId].topic = topic;

    io.to(roomId).emit('game-started', { letters, topic });
  });

  socket.on('submit-word', ({ roomId, word, playerId }) => {
    io.to(roomId).emit('word-submitted', { playerId, word });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ${socket.id}`);
    for (const roomId in rooms) {
      rooms[roomId].players = rooms[roomId].players.filter(p => p !== socket.id);
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

function generateLetters() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: 8 }, () => letters[Math.floor(Math.random() * letters.length)]);
}

function getRandomTopic() {
  const topics = ["Animales", "Países", "Comida", "Cine", "Videojuegos", "Viajes"];
  return topics[Math.floor(Math.random() * topics.length)];
}