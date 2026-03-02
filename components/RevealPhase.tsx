'use client';

import { useState } from 'react';
import { AnswerEntry, PlayerInfo } from '@/lib/types';

interface RevealPhaseProps {
    realQuestion: string;
    answers: AnswerEntry[];
    players: PlayerInfo[];
    playerId: string;
    voteProgress: { voted: number; total: number };
    onVote: (suspectId: string) => void;
}

export default function RevealPhase({ realQuestion, answers, players, playerId, voteProgress, onVote }: RevealPhaseProps) {
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
            <div className="reveal-header animate-slide-up">
                <h2 className="reveal-title">📖 The Real Question Was...</h2>
                <div className="real-question-card">
                    <p className="real-question-text">{realQuestion}</p>
                </div>
            </div>

            <div className="answers-grid">
                {answers.map((entry, i) => (
                    <div
                        key={entry.playerId}
                        className="answer-card animate-slide-up"
                        style={{ animationDelay: `${0.2 + i * 0.15}s` }}
                    >
                        <div className="answer-card-header">
                            <div className="player-avatar small">
                                {entry.playerName.charAt(0).toUpperCase()}
                            </div>
                            <span className="answer-player-name">{entry.playerName}</span>
                        </div>
                        <p className="answer-text">&ldquo;{entry.answer}&rdquo;</p>
                    </div>
                ))}
            </div>

            {/* Voting section — inline with answers visible above */}
            <div className="vote-section animate-fade-in" style={{ animationDelay: `${0.2 + answers.length * 0.15 + 0.3}s` }}>
                <div className="vote-divider">
                    <span className="vote-divider-text">🗳️ Vote for the Imposter</span>
                </div>
                <p className="hint-text">Who do you think had a different question?</p>

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
                            className="btn btn-danger btn-large"
                            onClick={handleVote}
                            disabled={!selectedId}
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
        </div>
    );
}
