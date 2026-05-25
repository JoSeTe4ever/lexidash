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


## CI/CD — Deploy automático con GitHub Actions

Cada push (o merge de PR) a `main` dispara automáticamente un deploy al servidor de producción `jopidevelops.software`.

### Cómo funciona

El workflow `.github/workflows/deploy.yml`:
1. Se conecta al servidor por SSH
2. Ejecuta `git pull origin main` para obtener los cambios
3. Ejecuta `docker compose up -d --build` para reconstruir y reiniciar los contenedores
4. Limpia imágenes huérfanas con `docker image prune -f`

> **Sin downtime forzado**: `docker compose up --build` recrea únicamente los contenedores cuya imagen cambió, preservando volúmenes y la red interna.

### Secrets de GitHub necesarios

Configúralos en **Settings → Secrets and variables → Actions**:

| Secret | Descripción |
|---|---|
| `DROPLET_HOST` | Hostname del servidor, e.g. `jopidevelops.software` |
| `DROPLET_USER` | Usuario SSH, e.g. `root` o `deploy` |
| `SSH_PRIVATE_KEY` | Contenido completo de la clave privada (empieza con `-----BEGIN ...-----`) |

### Cómo generar el par de claves SSH (Ed25519)

```bash
# En tu máquina local — genera un par de claves dedicado para el deploy
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/lexidash_deploy

# Copia la clave PÚBLICA al servidor (una sola vez)
ssh-copy-id -i ~/.ssh/lexidash_deploy.pub usuario@jopidevelops.software

# El contenido de la clave PRIVADA va al secret SSH_PRIVATE_KEY de GitHub
cat ~/.ssh/lexidash_deploy
```

### Estructura esperada en el servidor

```
~/lexidash/
├── docker-compose.yml
├── lexidash-backend/
│   └── Dockerfile
├── lexidash-preact/
│   └── Dockerfile
└── .env                  ← variables de entorno (nunca en git)
```

### Recomendaciones de seguridad

- Usa claves **Ed25519** (más modernas y seguras que RSA 2048)
- Desactiva la autenticación por contraseña en el servidor: `PasswordAuthentication no` en `/etc/ssh/sshd_config`
- Considera crear un usuario `deploy` con permisos de `docker` en lugar de usar `root`
- Rota las claves si el repositorio o los secrets se ven comprometidos

---

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
