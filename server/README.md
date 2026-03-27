# WebSocket Server — Code Together · iTec 2026

Server Node.js + Socket.io pentru colaborare în timp real în editorul de cod.

## Pornire rapidă

```bash
npm install
npm start
# sau în development:
npm run dev
```

Serverul pornește pe **portul 3001** implicit.

## Variabile de mediu

| Variabilă | Default | Descriere |
|-----------|---------|-----------|
| `PORT`    | `3001`  | Portul serverului |

## Evenimente Socket.io

### Client → Server
| Eveniment | Payload | Descriere |
|-----------|---------|-----------|
| `join_room` | `{ roomId, username }` | Intră într-o cameră |
| `code_change` | `{ roomId, code }` | Trimite modificări de cod |
| `language_change` | `{ roomId, language }` | Schimbă limbajul |
| `send_message` | `{ roomId, message }` | Trimite mesaj în chat |
| `typing` | `{ roomId, isTyping }` | Indicator de scriere |
| `cursor_move` | `{ roomId, position }` | Poziție cursor |

### Server → Client
| Eveniment | Payload | Descriere |
|-----------|---------|-----------|
| `room_state` | `{ code, language, messages, users }` | Starea inițială a camerei |
| `user_joined` | `{ user, users }` | Un utilizator nou a intrat |
| `user_left` | `{ userId, username, users }` | Un utilizator a ieșit |
| `code_update` | `{ code, senderId }` | Cod actualizat de altcineva |
| `language_update` | `{ language }` | Limbaj schimbat |
| `new_message` | `{ id, text, username, color, timestamp }` | Mesaj nou în chat |
| `user_typing` | `{ userId, username, isTyping }` | Cineva scrie |
| `cursor_update` | `{ userId, username, color, position }` | Cursor actualizat |
