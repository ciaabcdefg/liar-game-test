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

    return (
        <div className="phase-container">
            <div className="reveal-header animate-slide-up">
                <h2 className="reveal-title">📖 The Real Question Was...</h2>
                <div className="real-question-card">
                    <p className="real-question-text">{realQuestion}</p>
                </div>
            </div>

            <div className="answers-grid">
                {answers.map((entry, i) => {
                    const isOtherPlayer = entry.playerId !== playerId;
                    const isSelected = selectedId === entry.playerId;
                    return (
                        <button
                            key={entry.playerId}
                            className={`answer-card animate-slide-up ${isOtherPlayer && !voted ? 'votable' : ''} ${isSelected ? 'selected' : ''}`}
                            style={{ animationDelay: `${0.2 + i * 0.15}s` }}
                            onClick={() => {
                                if (isOtherPlayer && !voted) {
                                    setSelectedId(entry.playerId);
                                }
                            }}
                            disabled={!isOtherPlayer || voted}
                        >
                            <div className="answer-card-header">
                                <div className="player-avatar small">
                                    {entry.playerName.charAt(0).toUpperCase()}
                                </div>
                                <span className="answer-player-name">{entry.playerName}</span>
                                {entry.playerId === playerId && <span className="you-badge">YOU</span>}
                                {isSelected && <span className="vote-check">✓</span>}
                            </div>
                            <p className="answer-text">&ldquo;{entry.answer}&rdquo;</p>
                        </button>
                    );
                })}
            </div>

            {/* Vote action */}
            <div className="vote-section animate-fade-in" style={{ animationDelay: `${0.2 + answers.length * 0.15 + 0.3}s` }}>
                {!voted ? (
                    <div className='flex flex-col gap-2'>
                        <p className="hint-text">🗳️ Tap a player&apos;s card to vote for who you think is the imposter</p>
                        <button
                            className="btn btn-danger btn-large"
                            onClick={handleVote}
                            disabled={!selectedId}
                        >
                            🎯 Lock In Vote
                        </button>
                    </div>
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
