'use client';

import { AnswerEntry } from '@/lib/types';

interface RevealPhaseProps {
    realQuestion: string;
    answers: AnswerEntry[];
    isHost: boolean;
    onStartVoting: () => void;
}

export default function RevealPhase({ realQuestion, answers, isHost, onStartVoting }: RevealPhaseProps) {
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

            <div className="reveal-footer animate-fade-in" style={{ animationDelay: `${0.2 + answers.length * 0.15 + 0.3}s` }}>
                <p className="hint-text">🔍 Look carefully at the answers. Who seems suspicious?</p>
                {isHost ? (
                    <button className="btn btn-primary btn-large" onClick={onStartVoting}>
                        🗳️ Start Voting
                    </button>
                ) : (
                    <p className="waiting-text">Waiting for host to start voting...</p>
                )}
            </div>
        </div>
    );
}
