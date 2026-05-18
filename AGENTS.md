# Lexidash Agent Handbook
This document orients autonomous agents working in this repository.
Follow the practices below to keep the project reproducible and easy to extend.

## Repository Map
- Root `README.md` contains legacy setup wording; prefer this handbook when directions diverge.
- Frontend lives in `lexidash-preact/`; Vite drives the build and Tailwind powers utility classes.
- Backend lives in `lexidash-backend/`; it is an Express + Socket.IO server written in ESM JavaScript.
- Built artifacts under `lexidash-preact/dist/` are checked in; treat them as outputs, not sources.
- No Cursor or GitHub Copilot rule files exist as of May 2026.

## Runtime Environment
- Use Node.js 18 LTS or newer for both packages; npm is the expected package manager.
- Run `npm install` inside `lexidash-preact/` and `lexidash-backend/` separately; there is no root workspace.
- The backend listens on `http://localhost:3001` by default; the frontend socket client assumes the same.
- Tailwind requires PostCSS; Vite handles this automatically through the dev server and build steps.
- Static assets are served from the frontend `public/images/` directory; keep paths consistent with CSS references.

## Core Commands
- `cd lexidash-backend && npm start` launches the Socket.IO server in watchless node mode.
- `cd lexidash-preact && npm run dev` starts the Vite dev server with hot module reload.
- `cd lexidash-preact && npm run build` produces the production bundle in `dist/`.
- `cd lexidash-preact && npm run preview` serves the built frontend locally (requires prior build).
- No lint or test scripts are currently defined; see "Testing Strategy" for expectations when adding them.

## Single-Test Workflow
- There is no automated test harness yet; create one before attempting targeted test runs.
- Preferred approach once tests exist: add a script such as `"test": "vitest"` or `"test": "jest"` and use CLI filters (`npx vitest run FileName.test.ts`).
- For backend unit tests consider `c8` for coverage and `supertest` for HTTP assertions when endpoints emerge.
- Document any new single-test command in this file and in package scripts to keep agents in sync.
- Until real tests exist, rely on manual verification via the running client and server pairing.

## Development Workflow Expectations
- Keep the backend server running while iterating on rooms, topics, and sockets to surface runtime issues.
- When changing socket contracts update both event producers and consumers; search for the event name across frontend and backend.
- Avoid editing built files in `dist/`; regenerate them by running the build command instead.
- For experimental branches, add temporary scripts in package.json but remove them before merging to keep noise low.
- Document any new environment variables or config knobs in this handbook under "Environment Variables".

## Git Workflow Notes
- Work on feature branches off `main`; no branch naming convention is enforced, but prefer kebab-case (`feature-new-topic`).
- Commits should summarize intent (e.g., `feat: add round end indicator`); avoid raw WIP titles.
- Do not rewrite history on shared branches; use merge or rebase locally before pushing.
- Keep generated assets out of commits unless they are required for deployment.
- Respect user-managed changes already present in the working tree; never revert unrelated edits.

## Coding Style: General
- The codebase uses ES Modules everywhere; prefer `import`/`export` syntax and keep named exports close to their definitions.
- Prefer default exports for top-level Preact components and helper functions only when a single export exists in the file.
- Maintain semicolons at statement ends; existing files mix styles but leaning toward explicit semicolons avoids diff churn.
- Indentation is two spaces in frontend JSX and two spaces in backend JS; follow surrounding context.
- Use single quotes for string literals unless interpolation or embedded single quotes make double quotes clearer.

## Coding Style: Imports
- Group imports by origin: external packages, absolute project modules, then relative siblings.
- Destructure named imports inline (`import { useEffect, useState } from 'preact/hooks';`).
- Keep side-effect CSS imports (`import './index.css';`) at the bottom of the import block.
- When adding Tailwind utilities via CSS modules, co-locate the stylesheet in `src/styles/` and import with a relative path.
- Avoid default importing entire libraries when tree-shakable named exports exist (e.g., keep `Server` named from `socket.io`).

## Coding Style: Formatting
- Keep JSX props on separate lines when the component spans multiple props, and wrap arrow function bodies in braces when more than one statement is present; return JSX directly when possible.
- Use template literals for composed paths (`navigate(`/room/${roomId}`);`) and align multiline arrays vertically for readability, mirroring `GameBoard.jsx` grid definitions.
- Comment sparingly; prefer concise English comments that explain intent rather than restating code.

## Coding Style: Types and Data
- The project is plain JavaScript; do not introduce TypeScript without coordinating with maintainers, and use JSDoc comments if complex data structures emerge (e.g., room state shapes) while keeping types synchronized front to back.
- Treat socket payloads as typed contracts; document properties alongside event handlers and favor immutable updates for arrays and objects (`setPlayers(prev => prev.filter(...))`).
- Normalize data structures in the backend to avoid nested mutations; `rooms` stores canonical state.

## Coding Style: Naming
- Components use PascalCase matching filenames (`GameBoard.jsx` exports `GameBoard`), and hook setters follow `const [value, setValue] = useState(...)` naming.
- Socket event strings stay kebab-case or lowercase with hyphens (`'round-ended'`); helper functions use lowerCamelCase (`generateLetters`, `getRandomTopic`).
- CSS class selectors stay kebab-case; Tailwind utilities live inline inside JSX `className` strings.

## Coding Style: Error Handling
- The backend sends error payloads via the `'room-error'` event; emit descriptive messages, consume them on the frontend, and guard against missing rooms or players before mutating state.
- When adding async operations wrap them in try/catch and emit `'room-error'` with actionable text.
- On the frontend, surface errors with friendly UI banners as seen in `Room.jsx` and reset them on navigation changes.
- Avoid throwing unhandled exceptions in socket handlers; prefer returning early with informative logs.

## Coding Style: Logging
- Backend logging currently uses `console.log`; keep logs structured (`[Event] details`).
- Remove noisy debug logs before merging unless they aid operators (e.g., connection lifecycle summaries).
- If more structured logging is needed, wrap console calls in a helper that prefixes timestamps.
- Avoid logging sensitive data such as player tokens or IPs.
- Keep frontend console usage minimal; rely on UI cues for user-facing feedback.

## Frontend Conventions
- Components live under `src/components/` and pages under `src/pages/`; keep this separation intact.
- Use `preact/hooks` for React-compatible hooks; do not mix with React imports.
- Global styles go in `src/index.css`; prefer Tailwind utility classes for layout before reaching for custom CSS.
- Animate UI elements with Framer Motion as in `LetterCard.jsx`; keep animation configs declarative.
- Prompt-based flows (e.g., `prompt("Tu nombre?")`) should eventually move to controlled inputs; coordinate updates across files.

## State and Effects
- Initialize state with meaningful defaults (`useState('')` for strings, `[]` for arrays).
- Clean up socket listeners in `useEffect` return callbacks to prevent duplicate subscriptions.
- When storing collections like `players`, use derived booleans (`isAdmin`) rather than recomputing inline.
- Batch related state updates to minimize renders; consider reducers if logic grows.
- Avoid storing UI-only flags in the backend room object; keep server state focused on gameplay data.

## Socket Usage Patterns
- All socket events originate from `lexidash-preact/src/services/socket.js`; centralize connection config there.
- Update the socket base URL via environment variable substitution before deploying (e.g., `import.meta.env.VITE_SOCKET_URL`).
- When emitting events include the `roomId` to keep handlers stateless.
- Mirror server event names exactly; a typo breaks the link silently.
- Use `socket.once` sparingly for one-time events (`room-created`); otherwise manage unsubscription manually.

## Backend Conventions
- Express app and HTTP server are assembled in `server.js`; keep middleware declarations near the top.
- Store in-memory room state inside the `rooms` object; reset or delete entries to avoid memory leaks.
- Use helper functions (`generateLetters`, `getRandomTopic`) at the bottom for readability.
- Validate incoming payloads before using them; fall back to emitting `'room-error'` when invalid.
- When adding REST endpoints, define them above the Socket.IO bindings for clarity.

## Environment Variables
- Backend currently reads `PORT` from `process.env`; document any new variables here when introduced.
- Frontend should mirror backend URLs via Vite env files (`.env.local`) rather than editing `socket.js` directly.
- Never commit real credentials; use `.env.example` if configuration becomes non-trivial.
- Mention required env keys in the repository root README and this handbook simultaneously.
- Coordinate env naming across frontend and backend (`VITE_SOCKET_URL` vs `SERVER_PORT`) to reduce confusion.

## Styling Assets
- Background imagery is referenced via absolute paths (`/images/background.png`); ensure new assets land in `public/images/`.
- Keep custom CSS in `src/index.css` or feature-specific files under `src/styles/`; import them explicitly.
- Tailwind config extends nothing today; add design tokens in `tailwind.config.js` under `theme.extend`.
- Use accessible color contrasts when introducing new palettes; test across light/dark backgrounds.
- Avoid inline styles unless dynamic; prefer class utilities for maintainability.

## Testing Strategy
- No automated tests ship today; prioritize adding a lightweight framework (Vitest for frontend, Jest or Tap for backend).
- Once test tooling exists, create npm scripts and update the "Core Commands" and "Single-Test Workflow" sections accordingly.
- Use socket mocking utilities (e.g., `socket.io-client` in node) to validate event flows without running the server.
- For integration tests, spin up the backend with `supertest` or a real socket server in memory.
- Record manual test plans in PR descriptions until automated coverage exists.

## Documentation Hygiene
- Update this handbook whenever commands, scripts, or architectural decisions change.
- Reflect major changes in `README.md` so human collaborators stay aligned with agent instructions.
- Include architecture diagrams or flow descriptions in `docs/` if complexity grows.
- Reference source files by path when documenting logic flows (`lexidash-preact/src/pages/Room.jsx`).
- Keep sections concise but comprehensive; outdated guidance is worse than missing guidance.

## Support Checklist Before Merging
- Frontend builds cleanly with `npm run build` and renders core flows (home, room, game board).
- Backend handles room creation, joining, word submissions, and resets without uncaught exceptions.
- Socket events are synchronized between client and server, including cleanup on disconnect.
- Manual smoke tests cover creating a room, joining as multiple players, submitting a word, and resetting a round.
- Documentation updates accompany behavior changes, especially when contracts or commands shift.
