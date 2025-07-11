import express from 'express';
import {
  Server
} from 'socket.io';
import http from 'http';
import cors from 'cors';
import {
  v4 as uuidv4
} from 'uuid';

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
    rooms[roomId] = {
      players: [],
      board: [],
      topic: "",
      adminId: socket.id,
      submittedPlayers: new Set()
    } // ← ✅ Room initial state definition
    socket.join(roomId);

    rooms[roomId].players.push({
      id: socket.id,
      name: "Admin",
      isAdmin: true
    });

    socket.emit('room-created', {
      roomId
    });
    console.log(`[Room Created] ${roomId}`);
  });

  socket.on('join-room', ({
    roomId,
    name
  }) => {
    if (rooms[roomId]) {
      const isAdmin = socket.id === rooms[roomId].adminId;
      if (!isAdmin) {
        rooms[roomId].players.push({
          id: socket.id,
          name,
          isAdmin: false
        });
      }
      socket.join(roomId);

      console.log(`[Player Joined] ${name} (${socket.id}) to room ${roomId}`);
      console.log(`[Room Players] ${roomId}:`, JSON.stringify(rooms[roomId].players));

      io.to(roomId).emit('player-list', {
        players: rooms[roomId].players
      });

      // 🔥 Enviar estado actual del juego (aunque esté en curso)
      socket.emit('game-state', {
        letters: rooms[roomId].board,
        topic: rooms[roomId].topic,
      });
    } else {
      socket.emit('room-error', {
        message: 'Room does not exist'
      });
    }

  });

  socket.on('start-game', ({
    roomId
  }) => {
    if (rooms[roomId]) {
      const letters = generateLetters();
      const topic = getRandomTopic();
      rooms[roomId].board = letters;
      rooms[roomId].topic = topic;

      io.to(roomId).emit('game-started', {
        letters,
        topic
      });
    } else {
      socket.emit('room-error', {
        message: 'Room does not exist'
      });
    }
  });

  socket.on('submit-word', ({
    roomId,
    word,
    playerId
  }) => {
    const room = rooms[roomId];
    if (!room) return;

    // 👽 no se pueden volver a enviar palabras.
    room.submittedPlayers.add(playerId);

    // Filtrar las letras que están en el tablero y que coinciden con las usadas en la palabra
    const board = room.board.map(letter => letter.toLowerCase());
    const wordLetters = word.toLowerCase().split('');
    const lettersToRemove = [];

    wordLetters.forEach(letter => {
      const index = board.indexOf(letter);
      if (index !== -1) {
        lettersToRemove.push(index);
        board[index] = null; // Marcar la letra como usada
      }
    });

    // ✅ Avisamos a todos en la sala qué letras eliminar
    io.to(roomId).emit('word-submitted', {
      playerId,
      word,
      usedIndexes: lettersToRemove
    });

    // ¿Todos han enviado?
    if (room.submittedPlayers.size === room.players.length) {
      io.to(roomId).emit('round-ended');
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] ${socket.id}`);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) { // there are no players left in the room
        delete rooms[roomId];
      } else {
        io.to(roomId).emit('player-list', {
          players: room.players
        });
      }
    }
  });

  socket.on('reset-game', ({ roomId }) => {
    if (rooms[roomId]) {
      const letters = generateLetters();
      const topic = getRandomTopic();
      rooms[roomId].board = letters; // Reiniciar el tablero
      rooms[roomId].topic = topic; // Reiniciar el tema
      rooms[roomId].submittedPlayers = new Set(); // Limpiar jugadores que enviaron palabras
  
      io.to(roomId).emit('game-reset', {
        letters,
        topic,
      });
    } else {
      socket.emit('room-error', {
        message: 'Room does not exist',
      });
    }
  });

});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

function generateLetters() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({
    length: 8
  }, () => letters[Math.floor(Math.random() * letters.length)]);
}

function getRandomTopic() {
  const topics = ["Animales", "Países", "Comida", "Cine", "Videojuegos", "Viajes"];
  return topics[Math.floor(Math.random() * topics.length)];
}