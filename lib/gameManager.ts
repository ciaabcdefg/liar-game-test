import { v4 as uuidv4 } from 'uuid';
import { Room, Player, RoundData, PlayerInfo, RoomState, AnswerEntry, VoteResultData, LeaderboardEntry } from './types';
import { generateQuestions } from './openrouter';

function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export class GameManager {
    private rooms: Map<string, Room> = new Map();

    createRoom(hostName: string, apiKey: string, totalRounds: number, socketId: string): { room: Room; player: Player } {
        let code = generateRoomCode();
        while (this.rooms.has(code)) {
            code = generateRoomCode();
        }

        const playerId = uuidv4();
        const host: Player = {
            id: playerId,
            name: hostName,
            socketId,
            score: 0,
            isHost: true,
        };

        const room: Room = {
            code,
            players: new Map([[playerId, host]]),
            phase: 'lobby',
            totalRounds,
            currentRound: 0,
            rounds: [],
            apiKey,
            hostId: playerId,
        };

        this.rooms.set(code, room);
        return { room, player: host };
    }

    joinRoom(code: string, playerName: string, socketId: string): { room: Room; player: Player } | null {
        const room = this.rooms.get(code.toUpperCase());
        if (!room) return null;
        if (room.phase !== 'lobby') return null;

        const playerId = uuidv4();
        const player: Player = {
            id: playerId,
            name: playerName,
            socketId,
            score: 0,
            isHost: false,
        };

        room.players.set(playerId, player);
        return { room, player };
    }

    getRoom(code: string): Room | undefined {
        return this.rooms.get(code.toUpperCase());
    }

    getRoomBySocketId(socketId: string): { room: Room; player: Player } | null {
        for (const room of this.rooms.values()) {
            for (const player of room.players.values()) {
                if (player.socketId === socketId) {
                    return { room, player };
                }
            }
        }
        return null;
    }

    removePlayer(socketId: string): { room: Room; removedPlayer: Player } | null {
        const result = this.getRoomBySocketId(socketId);
        if (!result) return null;

        const { room, player } = result;
        room.players.delete(player.id);

        // If room is empty, delete it
        if (room.players.size === 0) {
            this.rooms.delete(room.code);
            return { room, removedPlayer: player };
        }

        // If host left, transfer host
        if (player.isHost) {
            const newHost = room.players.values().next().value;
            if (newHost) {
                newHost.isHost = true;
                room.hostId = newHost.id;
            }
        }

        return { room, removedPlayer: player };
    }

    async startRound(code: string): Promise<RoundData | null> {
        const room = this.rooms.get(code);
        if (!room) return null;

        room.currentRound++;

        // Pick a random imposter
        const playerIds = Array.from(room.players.keys());
        const imposterId = playerIds[Math.floor(Math.random() * playerIds.length)];

        // Generate questions via LLM
        const questions = await generateQuestions(room.apiKey);

        const roundData: RoundData = {
            roundNumber: room.currentRound,
            realQuestion: questions.realQuestion,
            imposterQuestion: questions.imposterQuestion,
            imposterId,
            answers: new Map(),
            votes: new Map(),
        };

        room.rounds.push(roundData);
        room.phase = 'answering';

        return roundData;
    }

    submitAnswer(code: string, playerId: string, answer: string): { allAnswered: boolean; room: Room } | null {
        const room = this.rooms.get(code);
        if (!room || room.phase !== 'answering') return null;

        const currentRound = room.rounds[room.rounds.length - 1];
        if (!currentRound) return null;

        currentRound.answers.set(playerId, answer);

        const allAnswered = currentRound.answers.size === room.players.size;
        if (allAnswered) {
            room.phase = 'reveal';
        }

        return { allAnswered, room };
    }

    getAnswers(code: string): AnswerEntry[] {
        const room = this.rooms.get(code);
        if (!room) return [];

        const currentRound = room.rounds[room.rounds.length - 1];
        if (!currentRound) return [];

        const entries: AnswerEntry[] = [];
        for (const [playerId, answer] of currentRound.answers) {
            const player = room.players.get(playerId);
            if (player) {
                entries.push({
                    playerId,
                    playerName: player.name,
                    answer,
                });
            }
        }

        return entries;
    }

    startVoting(code: string): boolean {
        const room = this.rooms.get(code);
        if (!room || room.phase !== 'reveal') return false;
        room.phase = 'voting';
        return true;
    }

    submitVote(code: string, voterId: string, suspectId: string): { allVoted: boolean; room: Room } | null {
        const room = this.rooms.get(code);
        if (!room || room.phase !== 'voting') return null;

        const currentRound = room.rounds[room.rounds.length - 1];
        if (!currentRound) return null;

        // Can't vote for self
        if (voterId === suspectId) return null;

        currentRound.votes.set(voterId, suspectId);

        const allVoted = currentRound.votes.size === room.players.size;
        if (allVoted) {
            room.phase = 'vote-results';
        }

        return { allVoted, room };
    }

    tallyVotes(code: string): VoteResultData | null {
        const room = this.rooms.get(code);
        if (!room) return null;

        const currentRound = room.rounds[room.rounds.length - 1];
        if (!currentRound) return null;

        // Count votes: suspectId → list of voter names
        const voteCounts: Record<string, string[]> = {};
        for (const [voterId, suspectId] of currentRound.votes) {
            if (!voteCounts[suspectId]) voteCounts[suspectId] = [];
            const voter = room.players.get(voterId);
            if (voter) voteCounts[suspectId].push(voter.name);
        }

        // Find who got the most votes
        let maxVotes = 0;
        let mostVotedId = '';
        for (const [suspectId, voters] of Object.entries(voteCounts)) {
            if (voters.length > maxVotes) {
                maxVotes = voters.length;
                mostVotedId = suspectId;
            }
        }

        const imposterCaught = mostVotedId === currentRound.imposterId;
        const imposter = room.players.get(currentRound.imposterId);
        const scoreChanges: Record<string, number> = {};

        if (imposterCaught) {
            // Everyone except imposter gets 1 point
            for (const player of room.players.values()) {
                if (player.id !== currentRound.imposterId) {
                    player.score += 1;
                    scoreChanges[player.id] = 1;
                } else {
                    scoreChanges[player.id] = 0;
                }
            }
        } else {
            // Imposter gets 2 points
            const imposterPlayer = room.players.get(currentRound.imposterId);
            if (imposterPlayer) {
                imposterPlayer.score += 2;
                scoreChanges[imposterPlayer.id] = 2;
            }
            // Everyone else gets 0
            for (const player of room.players.values()) {
                if (player.id !== currentRound.imposterId) {
                    scoreChanges[player.id] = 0;
                }
            }
        }

        return {
            votes: voteCounts,
            imposterId: currentRound.imposterId,
            imposterName: imposter?.name || 'Unknown',
            imposterCaught,
            scoreChanges,
        };
    }

    advanceRound(code: string): 'next' | 'finished' | null {
        const room = this.rooms.get(code);
        if (!room) return null;

        if (room.currentRound >= room.totalRounds) {
            room.phase = 'finished';
            return 'finished';
        }

        return 'next';
    }

    resetGame(code: string): boolean {
        const room = this.rooms.get(code);
        if (!room) return false;

        room.phase = 'lobby';
        room.currentRound = 0;
        room.rounds = [];
        for (const player of room.players.values()) {
            player.score = 0;
        }

        return true;
    }

    getLeaderboard(code: string): LeaderboardEntry[] {
        const room = this.rooms.get(code);
        if (!room) return [];

        const entries: LeaderboardEntry[] = Array.from(room.players.values())
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                rank: index + 1,
                name: player.name,
                score: player.score,
                playerId: player.id,
            }));

        return entries;
    }

    // Serialize room state for clients
    getRoomState(room: Room): RoomState {
        const players: PlayerInfo[] = Array.from(room.players.values()).map((p) => ({
            id: p.id,
            name: p.name,
            score: p.score,
            isHost: p.isHost,
        }));

        return {
            code: room.code,
            players,
            phase: room.phase,
            totalRounds: room.totalRounds,
            currentRound: room.currentRound,
        };
    }
}
