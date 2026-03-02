'use client';

import { RoomState } from '@/lib/types';

interface LobbyProps {
    roomState: RoomState;
    playerId: string;
    onStartGame: () => void;
}

export default function Lobby({ roomState, playerId, onStartGame }: LobbyProps) {
    const isHost = roomState.players.find((p) => p.id === playerId)?.isHost;
    const canStart = roomState.players.length >= 3;

    return (
        <div className="lobby-container">
            <div className="room-code-section">
                <p className="room-code-label">ROOM CODE</p>
                <div className="room-code" onClick={() => navigator.clipboard.writeText(roomState.code)}>
                    {roomState.code}
                    <span className="copy-hint">click to copy</span>
                </div>
            </div>

            <div className="players-section">
                <h3 className="section-title">
                    Players ({roomState.players.length})
                </h3>
                <div className="player-list">
                    {roomState.players.map((player, i) => (
                        <div
                            key={player.id}
                            className="player-card"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        >
                            <div className="player-avatar">
                                {player.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="player-name">{player.name}</span>
                            {player.isHost && <span className="host-badge">HOST</span>}
                            {player.id === playerId && <span className="you-badge">YOU</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="lobby-info">
                <p>Rounds: <strong>{roomState.totalRounds}</strong></p>
                <p className="min-players-hint">
                    {canStart ? '✅ Ready to start!' : `⏳ Need at least 3 players (${3 - roomState.players.length} more)`}
                </p>
            </div>

            {isHost && (
                <button
                    className="btn btn-primary btn-large"
                    onClick={onStartGame}
                    disabled={!canStart}
                >
                    {canStart ? '🎭 Start Game' : 'Waiting for Players...'}
                </button>
            )}

            {!isHost && (
                <p className="waiting-text">Waiting for host to start the game...</p>
            )}
        </div>
    );
}
