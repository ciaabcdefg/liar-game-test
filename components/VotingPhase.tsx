'use client';

import { useState } from 'react';
import { PlayerInfo } from '@/lib/types';

interface VotingPhaseProps {
    players: PlayerInfo[];
    playerId: string;
    voteProgress: { voted: number; total: number };
    onVote: (suspectId: string) => void;
}

export default function VotingPhase({ players, playerId, voteProgress, onVote }: VotingPhaseProps) {
    const [selectedId, setSelectedId] = useState<string>('');
    const [voted, setVoted] = useState(false);

    const handleVote = () => {
        if (selectedId && !voted) {
            setVoted(true);
            onVote(selectedId);
        }
    };

    const otherPlayers = players.filter((p) => p.id !== playerId);

    return (
        <div className="phase-container">
            <div className="vote-header animate-slide-up">
                <h2 className="vote-title">🗳️ Vote for the Imposter!</h2>
                <p className="vote-subtitle">Who do you think had a different question?</p>
            </div>

            {!voted ? (
                <>
                    <div className="vote-grid">
                        {otherPlayers.map((player, i) => (
                            <button
                                key={player.id}
                                className={`vote-card animate-slide-up ${selectedId === player.id ? 'selected' : ''}`}
                                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                                onClick={() => setSelectedId(player.id)}
                            >
                                <div className="player-avatar large">
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="vote-player-name">{player.name}</span>
                                {selectedId === player.id && <span className="vote-check">✓</span>}
                            </button>
                        ))}
                    </div>

                    <button
                        className="btn btn-danger btn-large animate-fade-in"
                        onClick={handleVote}
                        disabled={!selectedId}
                        style={{ animationDelay: '0.5s' }}
                    >
                        🎯 Lock In Vote
                    </button>
                </>
            ) : (
                <div className="waiting-card animate-fade-in">
                    <div className="spinner" />
                    <p>Vote locked in! Waiting for others...</p>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${(voteProgress.voted / voteProgress.total) * 100}%` }}
                        />
                    </div>
                    <p className="progress-text">
                        {voteProgress.voted} / {voteProgress.total} voted
                    </p>
                </div>
            )}
        </div>
    );
}
