---
title: Real-time multiplayer chess
summary: Two players are paired over WebSockets. The server checks every move, and whose turn it is, before the board updates for both players.
area: Full stack
tags: [TypeScript, React, Node.js, WebSockets, Tailwind CSS]
repo: https://github.com/piysinha/Chess
date: 2026-02-02
---

A two-player chess game with a TypeScript backend and a React frontend.

## How it works

- **Matchmaking.** A Node.js WebSocket server pairs players as they ask for a game, and assigns white and black.
- **The server is the referee.** Every move goes through [chess.js](https://github.com/jhlywa/chess.js) on the server. It rejects moves made out of turn or against the rules before anything is broadcast.
- **One source of truth.** After each valid move, the server sends the new board position to both players, so the two boards can't drift apart.
- **Frontend.** React with Vite and Tailwind CSS, with a custom hook that manages the socket connection.
