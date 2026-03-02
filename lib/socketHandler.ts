import { Server, Socket } from 'socket.io';
import { GameManager } from './gameManager';

const gameManager = new GameManager();

export function registerSocketHandlers(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        // --- CREATE ROOM ---
        socket.on('create-room', async (data: { hostName: string; apiKey: string; totalRounds: number; language: string; topic: string; useMock?: boolean }, callback) => {
            try {
                const { room, player } = gameManager.createRoom(data.hostName, data.apiKey, data.totalRounds, socket.id, data.language, data.topic, data.useMock ?? false);
                socket.join(room.code);
                const roomState = gameManager.getRoomState(room);
                callback({ success: true, roomState, playerId: player.id });
                console.log(`[Room ${room.code}] Created by ${player.name}`);
            } catch (err) {
                console.error('[create-room] Error:', err);
                callback({ success: false, error: 'Failed to create room' });
            }
        });

        // --- JOIN ROOM ---
        socket.on('join-room', (data: { code: string; playerName: string }, callback) => {
            try {
                const result = gameManager.joinRoom(data.code, data.playerName, socket.id);
                if (!result) {
                    callback({ success: false, error: 'Room not found or game already started' });
                    return;
                }
                const { room, player } = result;
                socket.join(room.code);
                const roomState = gameManager.getRoomState(room);
                callback({ success: true, roomState, playerId: player.id });

                // Notify others in the room
                socket.to(room.code).emit('room-update', roomState);
                console.log(`[Room ${room.code}] ${player.name} joined`);
            } catch (err) {
                console.error('[join-room] Error:', err);
                callback({ success: false, error: 'Failed to join room' });
            }
        });

        // --- START GAME ---
        socket.on('start-game', async (data: { code: string }, callback) => {
            try {
                const room = gameManager.getRoom(data.code);
                if (!room) {
                    callback({ success: false, error: 'Room not found' });
                    return;
                }

                if (room.players.size < 3) {
                    callback({ success: false, error: 'Need at least 3 players to start' });
                    return;
                }

                const roundData = await gameManager.startRound(data.code);
                if (!roundData) {
                    callback({ success: false, error: 'Failed to start round' });
                    return;
                }

                const roomState = gameManager.getRoomState(room);
                callback({ success: true });

                // Send each player their question
                for (const player of room.players.values()) {
                    const question = player.id === roundData.imposterId
                        ? roundData.imposterQuestion
                        : roundData.realQuestion;

                    io.to(player.socketId).emit('phase-change', {
                        phase: 'answering',
                        roomState,
                        question,
                        roundNumber: roundData.roundNumber,
                    });
                }

                console.log(`[Room ${data.code}] Round ${roundData.roundNumber} started. Imposter: ${room.players.get(roundData.imposterId)?.name}`);
            } catch (err) {
                console.error('[start-game] Error:', err);
                callback({ success: false, error: 'Failed to start game' });
            }
        });

        // --- SUBMIT ANSWER ---
        socket.on('submit-answer', (data: { code: string; playerId: string; answer: string }, callback) => {
            try {
                const result = gameManager.submitAnswer(data.code, data.playerId, data.answer);
                if (!result) {
                    callback({ success: false, error: 'Failed to submit answer' });
                    return;
                }

                callback({ success: true });

                // Notify room of progress
                const answeredCount = result.room.rounds[result.room.rounds.length - 1].answers.size;
                const totalPlayers = result.room.players.size;
                io.to(data.code).emit('answer-progress', { answered: answeredCount, total: totalPlayers });

                if (result.allAnswered) {
                    const answers = gameManager.getAnswers(data.code);
                    const roomState = gameManager.getRoomState(result.room);
                    const currentRound = result.room.rounds[result.room.rounds.length - 1];

                    io.to(data.code).emit('phase-change', {
                        phase: 'reveal',
                        roomState,
                        answers,
                        realQuestion: currentRound.realQuestion,
                    });
                }
            } catch (err) {
                console.error('[submit-answer] Error:', err);
                callback({ success: false, error: 'Failed to submit answer' });
            }
        });

        // --- SUBMIT VOTE ---
        socket.on('submit-vote', (data: { code: string; voterId: string; suspectId: string }, callback) => {
            try {
                const result = gameManager.submitVote(data.code, data.voterId, data.suspectId);
                if (!result) {
                    callback({ success: false, error: 'Failed to submit vote' });
                    return;
                }

                callback({ success: true });

                // Notify room of progress
                const votedCount = result.room.rounds[result.room.rounds.length - 1].votes.size;
                const totalPlayers = result.room.players.size;
                io.to(data.code).emit('vote-progress', { voted: votedCount, total: totalPlayers });

                if (result.allVoted) {
                    const voteResult = gameManager.tallyVotes(data.code);
                    const roomState = gameManager.getRoomState(result.room);

                    io.to(data.code).emit('phase-change', {
                        phase: 'vote-results',
                        roomState,
                        voteResult,
                    });
                }
            } catch (err) {
                console.error('[submit-vote] Error:', err);
                callback({ success: false, error: 'Failed to submit vote' });
            }
        });

        // --- NEXT ROUND ---
        socket.on('next-round', async (data: { code: string }, callback) => {
            try {
                const status = gameManager.advanceRound(data.code);
                if (!status) {
                    callback({ success: false, error: 'Room not found' });
                    return;
                }

                if (status === 'finished') {
                    const room = gameManager.getRoom(data.code)!;
                    const leaderboard = gameManager.getLeaderboard(data.code);
                    const roundSummaries = gameManager.getRoundSummaries(data.code);
                    const roomState = gameManager.getRoomState(room);

                    io.to(data.code).emit('phase-change', {
                        phase: 'finished',
                        roomState,
                        leaderboard,
                        roundSummaries,
                    });
                    callback({ success: true });
                    return;
                }

                // Start next round
                const roundData = await gameManager.startRound(data.code);
                if (!roundData) {
                    callback({ success: false, error: 'Failed to start next round' });
                    return;
                }

                const room = gameManager.getRoom(data.code)!;
                const roomState = gameManager.getRoomState(room);
                callback({ success: true });

                for (const player of room.players.values()) {
                    const question = player.id === roundData.imposterId
                        ? roundData.imposterQuestion
                        : roundData.realQuestion;

                    io.to(player.socketId).emit('phase-change', {
                        phase: 'answering',
                        roomState,
                        question,
                        roundNumber: roundData.roundNumber,
                    });
                }

                console.log(`[Room ${data.code}] Round ${roundData.roundNumber} started.`);
            } catch (err) {
                console.error('[next-round] Error:', err);
                callback({ success: false, error: 'Failed to advance round' });
            }
        });

        // --- PLAY AGAIN ---
        socket.on('play-again', (data: { code: string }, callback) => {
            try {
                const success = gameManager.resetGame(data.code);
                if (!success) {
                    callback({ success: false, error: 'Room not found' });
                    return;
                }

                const room = gameManager.getRoom(data.code)!;
                const roomState = gameManager.getRoomState(room);
                callback({ success: true });

                io.to(data.code).emit('phase-change', {
                    phase: 'lobby',
                    roomState,
                });
            } catch (err) {
                console.error('[play-again] Error:', err);
                callback({ success: false, error: 'Failed to restart game' });
            }
        });

        // --- DISCONNECT ---
        socket.on('disconnect', () => {
            const result = gameManager.removePlayer(socket.id);
            if (result) {
                const { room, removedPlayer } = result;
                if (room.players.size > 0) {
                    const roomState = gameManager.getRoomState(room);
                    io.to(room.code).emit('room-update', roomState);
                    io.to(room.code).emit('player-left', { playerName: removedPlayer.name });
                }
                console.log(`[Socket] ${removedPlayer.name} disconnected from room ${room.code}`);
            }
            console.log(`[Socket] Disconnected: ${socket.id}`);
        });
    });
}
