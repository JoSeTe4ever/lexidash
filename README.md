# lexidash
This is a online game based on "fast words" card game. Implemented using cursor and AI to get familiar with it.

# vibe coding experience thoughts
in my vibe coding experiments, as soon as the app gets reasonably complex, llms essentially never work perfectly on it again. leaving you to debug some reasonably complex codebase full of weird abandoned code that you have no mental context checkpoints for. 


# how to run

## Docker (recomendado)

```bash
docker compose up --build
```

La aplicación estará disponible en `http://localhost:1337`.  
El backend **no** se expone al exterior — nginx hace de proxy para las conexiones Socket.IO.

## Desarrollo local

Desde la raíz del proyecto:

```bash
# Instalar dependencias de ambos subpaquetes
npm run install:all

# Arrancar backend + frontend en paralelo (hot-reload)
npm run dev
```

O bien manualmente:

```bash
# Backend (puerto 3001)
cd lexidash-backend && npm start

# Frontend (puerto 5173)
cd lexidash-preact && npm run dev
```

## Producción (sin Docker)

```bash
npm run build   # compila el frontend
npm run start   # arranca backend + frontend preview en paralelo
```

## Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto del backend | `3001` |
| `VITE_SOCKET_URL` | URL del backend para el cliente Socket.IO | `""` (mismo origen) |

Para desarrollo local crea `lexidash-preact/.env.local`:
```
VITE_SOCKET_URL=http://localhost:3001
```


## TODO 
- [ ] Add a Score table that is displayed on the frontend showing the players and their scores (and their words).
- [ ] Add a feature to allow players to change their names during the game.
- [ ] Implement a feature to reset the game without disconnecting players.
- [ ] Add a feature to allow players to submit words during the game.
- [ ] Implement a feature to display the current topic and letters on the game board.
- [ ] Add a feature to allow players to view the list of submitted words.
- [ ] Implement a feature to allow players to vote on the best word submitted by other players.
- [ ] Add a feature to allow players to view the game history.
- [ ] Implement a feature to allow players to view the leaderboard.
- [ ] Add a feature to allow players to invite friends to join the game.
- [ ] Implement a feature to allow players to leave the game.
- [ ] Add a feature to allow players to view the game rules.
- [ ] Implement a feature to allow players to view the game settings.
- [ ] Add a feature to allow players to customize their avatars.
- [ ] Implement a feature to allow players to chat with each other during the game.
- [ ] Add a feature to allow players to report inappropriate behavior.
