import express from 'express';
import {
  Server
} from 'socket.io';
import http from 'http';
import cors from 'cors';
import {
  v4 as uuidv4
} from 'uuid';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DICTIONARY = new Set(
  readFileSync(join(__dirname, 'dictionary.txt'), 'utf-8')
    .split('\n')
    .map(w => w.trim().toLowerCase())
    .filter(Boolean)
);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const PORT = process.env.PORT || 3001;

const LETTER_POOL = [
  ...Array(2).fill('B'),
  ...Array(3).fill('D'),
  ...Array(7).fill('E'),
  ...Array(4).fill('R'),
  ...Array(4).fill('S'),
  'K',
  'H',
  ...Array(2).fill('F'),
  ...Array(2).fill('C'),
  'W',
  ...Array(6).fill('A'),
  ...Array(3).fill('M'),
  'Q',
  'J',
  ...Array(2).fill('V'),
  ...Array(4).fill('L'),
  'Z',
  ...Array(2).fill('G'),
  'Y',
  ...Array(2).fill('P'),
  ...Array(4).fill('N'),
  ...Array(4).fill('O'),
  ...Array(4).fill('U'),
  ...Array(5).fill('I'),
  'X',
  ...Array(4).fill('T')
];

const TOPICS = [
  'Animals',
  'Countries',
  'Food',
  'Movies',
  'Video Games',
  'Travel',
  'Sports',
  'Colors',
  'Famous People',
  'Brands',
  'Jobs',
  'Clothing',
  'Music',
  'Books',
  'TV Shows',
  'Hobbies',
  'Fruits',
  'Vegetables',
  'Drinks',
  'Vehicles',
  'Cities',
  'Flowers',
  'Instruments',
  'Languages',
  'Superheroes',
  'Tools',
  'Planets',
  'Body Parts',
  'Weather',
  'Holidays',
  'Mythical Creatures',
  'Board Games',
  'Sea Creatures',
  'Household Items',
  'Landmarks',
  'School Subjects',
  'Shapes',
  'Emotions',
  'Technology',
  'Desserts',
  'In the Park',
  'In the School',
  'In the Kitchen',
  'In the Bathroom',
  'In the Garden',
  'At the Beach',
  'At the Mall',
  'At the Airport',
  'At the Zoo',
  'At the Hospital',
  'At the Office',
  'At the Gym',
  'At the Restaurant',
  'At the Library',
  'On the Road',
  'On the Farm',
  'In the Forest',
  'In Space',
  'Under the Sea',
  'It Is in My Bedroom',
  'Something Pretty',
  'Game or Toy',
  'In a Pencil Case',
  'Has Holes',
  'Boy Name',
  'Something Dangerous',
  'It Is Cold',
  'Parts of the Body',
  'Country',
  'Tale',
  'Fruit',
  'Something Round',
  'Something Expensive',
  'Something Electric',
  'Type of Shop',
  'Something Hot',
  'Music Instrument',
  'Form of Transportation',
  'Something That Smells Bad',
  'Garment',
  'Something Heavy',
  'On the Beach',
  'It Flies',
  'Sport',
  'At a Park',
  'Subject',
  'Something Red',
  'Something Black',
  'Makes a Lot of Noise'
];

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
      submittedPlayers: new Set(),
      scores: {},
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
      if (isAdmin) {
        // Actualizar el nombre del administrador
        const adminPlayer = rooms[roomId].players.find(p => p.id === socket.id);
        if (adminPlayer) {
          adminPlayer.name = name;
        }
      } else {
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
        players: rooms[roomId].players,
        scores: rooms[roomId].scores || {},
      });

      // 🔥 Enviar estado actual del juego (aunque esté en curso)
      socket.emit('game-state', {
        letters: rooms[roomId].board,
        topic: rooms[roomId].topic,
        scores: rooms[roomId].scores || {},
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
      rooms[roomId].scores = {};
      rooms[roomId].players.forEach(p => {
        rooms[roomId].scores[p.id] = 0;
      });

      io.to(roomId).emit('game-started', {
        letters,
        topic,
        scores: rooms[roomId].scores,
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
    playerId,
    usedIndexes,
  }) => {
    const room = rooms[roomId];
    if (!room) return;

    const isValid = DICTIONARY.has(word.toLowerCase());

    if (!isValid) {
      socket.emit('word-invalid', { word, message: `"${word}" is not a valid word.` });
      return;
    }

    // 👽 Solo se cuentan como enviados los que envían palabra válida
    room.submittedPlayers.add(playerId);

    // Calcular score: 1 punto por letra del tablero usada
    const score = usedIndexes ? usedIndexes.length : 0;
    if (room.scores[playerId] === undefined) room.scores[playerId] = 0;
    room.scores[playerId] += score;

    // ✅ Avisamos a todos en la sala qué letras eliminar + scores actualizados
    io.to(roomId).emit('word-submitted', {
      playerId,
      word,
      usedIndexes: usedIndexes || [],
      score,
      scores: room.scores,
    });

    // ¿Todos han enviado?
    if (room.submittedPlayers.size === room.players.length) {
      io.to(roomId).emit('round-ended', { scores: room.scores });
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
          players: room.players,
          scores: room.scores || {},
        });
      }
    }
  });

  socket.on('reset-game', ({
    roomId
  }) => {
    if (rooms[roomId]) {
      const letters = generateLetters();
      const topic = getRandomTopic();
      rooms[roomId].board = letters; // Reiniciar el tablero
      rooms[roomId].topic = topic; // Reiniciar el tema
      rooms[roomId].submittedPlayers = new Set(); // Limpiar jugadores que enviaron palabras
      // ✅ scores se conservan (acumulativos entre rondas)

      io.to(roomId).emit('game-reset', {
        letters,
        topic,
        scores: rooms[roomId].scores || {},
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
  const available = [...LETTER_POOL];
  const letters = [];

  for (let i = 0; i < 8 && available.length > 0; i++) {
    const index = Math.floor(Math.random() * available.length);
    letters.push(available[index]);
    available.splice(index, 1);
  }

  return letters;
}

function getRandomTopic() {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}
