'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomState, AnswerEntry, VoteResultData, LeaderboardEntry } from '@/lib/types';

export type GamePhaseState =
    | { phase: 'idle' }
    | { phase: 'lobby'; roomState: RoomState }
    | { phase: 'answering'; roomState: RoomState; question: string; roundNumber: number }
    | { phase: 'reveal'; roomState: RoomState; answers: AnswerEntry[]; realQuestion: string }
    | { phase: 'vote-results'; roomState: RoomState; voteResult: VoteResultData }
    | { phase: 'finished'; roomState: RoomState; leaderboard: LeaderboardEntry[] };

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [playerId, setPlayerId] = useState<string>('');
    const [gameState, setGameState] = useState<GamePhaseState>({ phase: 'idle' });
    const [answerProgress, setAnswerProgress] = useState({ answered: 0, total: 0 });
    const [voteProgress, setVoteProgress] = useState({ voted: 0, total: 0 });
    const [error, setError] = useState<string>('');
    const [notification, setNotification] = useState<string>('');

    useEffect(() => {
        const socket = io({
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            console.log('Connected to server');
        });

        socket.on('disconnect', () => {
            setConnected(false);
            console.log('Disconnected from server');
        });

        socket.on('room-update', (roomState: RoomState) => {
            setGameState((prev) => {
                if (prev.phase === 'idle') return { phase: 'lobby', roomState };
                return { ...prev, roomState };
            });
        });

        socket.on('phase-change', (data: any) => {
            switch (data.phase) {
                case 'lobby':
                    setGameState({ phase: 'lobby', roomState: data.roomState });
                    break;
                case 'answering':
                    setGameState({
                        phase: 'answering',
                        roomState: data.roomState,
                        question: data.question,
                        roundNumber: data.roundNumber,
                    });
                    setAnswerProgress({ answered: 0, total: data.roomState.players.length });
                    break;
                case 'reveal':
                    setGameState({
                        phase: 'reveal',
                        roomState: data.roomState,
                        answers: data.answers,
                        realQuestion: data.realQuestion,
                    });
                    setVoteProgress({ voted: 0, total: data.roomState.players.length });
                    break;
                case 'vote-results':
                    setGameState({
                        phase: 'vote-results',
                        roomState: data.roomState,
                        voteResult: data.voteResult,
                    });
                    break;
                case 'finished':
                    setGameState({
                        phase: 'finished',
                        roomState: data.roomState,
                        leaderboard: data.leaderboard,
                    });
                    break;
            }
        });

        socket.on('answer-progress', (data: { answered: number; total: number }) => {
            setAnswerProgress(data);
        });

        socket.on('vote-progress', (data: { voted: number; total: number }) => {
            setVoteProgress(data);
        });

        socket.on('player-left', (data: { playerName: string }) => {
            setNotification(`${data.playerName} left the game`);
            setTimeout(() => setNotification(''), 3000);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const emit = useCallback((event: string, data: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current) {
                reject(new Error('Not connected'));
                return;
            }
            socketRef.current.emit(event, data, (response: any) => {
                if (response.success) {
                    resolve(response);
                } else {
                    setError(response.error || 'Unknown error');
                    reject(new Error(response.error));
                }
            });
        });
    }, []);

    const createRoom = useCallback(async (hostName: string, apiKey: string, totalRounds: number, language: string = 'English', topic: string = '') => {
        try {
            setError('');
            const response = await emit('create-room', { hostName, apiKey, totalRounds, language, topic });
            setPlayerId(response.playerId);
            setGameState({ phase: 'lobby', roomState: response.roomState });
            return response;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [emit]);

    const joinRoom = useCallback(async (code: string, playerName: string) => {
        try {
            setError('');
            const response = await emit('join-room', { code: code.toUpperCase(), playerName });
            setPlayerId(response.playerId);
            setGameState({ phase: 'lobby', roomState: response.roomState });
            return response;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [emit]);

    const startGame = useCallback(async (code: string) => {
        try {
            setError('');
            await emit('start-game', { code });
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [emit]);

    const submitAnswer = useCallback(async (code: string, answer: string) => {
        try {
            setError('');
            await emit('submit-answer', { code, playerId, answer });
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [emit, playerId]);



    const submitVote = useCallback(async (code: string, suspectId: string) => {
        try {
            setError('');
            await emit('submit-vote', { code, voterId: playerId, suspectId });
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [emit, playerId]);

    const nextRound = useCallback(async (code: string) => {
        try {
            setError('');
            await emit('next-round', { code });
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [emit]);

    const playAgain = useCallback(async (code: string) => {
        try {
            setError('');
            await emit('play-again', { code });
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [emit]);

    return {
        connected,
        playerId,
        gameState,
        answerProgress,
        voteProgress,
        error,
        notification,
        createRoom,
        joinRoom,
        startGame,
        submitAnswer,
        submitVote,
        nextRound,
        playAgain,
        setError,
    };
}
