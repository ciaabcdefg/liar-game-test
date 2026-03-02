'use client';

import { useState } from 'react';
import { LeaderboardEntry, RoundSummary } from '@/lib/types';

interface GameOverProps {
    leaderboard: LeaderboardEntry[];
    roundSummaries: RoundSummary[];
    playerId: string;
    isHost: boolean;
    onPlayAgain: () => void;
}

const rankEmoji = ['🥇', '🥈', '🥉'];

export default function GameOver({ leaderboard, roundSummaries, playerId, isHost, onPlayAgain }: GameOverProps) {
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const totalRounds = roundSummaries.length;
    const round = roundSummaries[currentRoundIndex];

    return (
        <div className="phase-container gameover-container">
            <div className="confetti-container">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div
                        key={i}
                        className="confetti-piece"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                            backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'][
                                Math.floor(Math.random() * 7)
                            ],
                        }}
                    />
                ))}
            </div>

            <div className="gameover-header animate-slide-up">
                <h1 className="gameover-title">🏆 Game Over!</h1>
                <p className="gameover-subtitle">Here are the final standings</p>
            </div>

            <div className="leaderboard">
                {leaderboard.map((entry, i) => (
                    <div
                        key={entry.playerId}
                        className={`leaderboard-entry animate-slide-up ${entry.playerId === playerId ? 'is-you' : ''
                            } ${i < 3 ? `top-${i + 1}` : ''}`}
                        style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                    >
                        <div className="leaderboard-rank">
                            {i < 3 ? (
                                <span className="rank-emoji">{rankEmoji[i]}</span>
                            ) : (
                                <span className="rank-number">#{entry.rank}</span>
                            )}
                        </div>
                        <div className="leaderboard-player">
                            <div className="player-avatar">
                                {entry.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="leaderboard-name">
                                {entry.name}
                                {entry.playerId === playerId && <span className="you-badge">YOU</span>}
                            </span>
                        </div>
                        <div className="leaderboard-score">
                            <span className="score-value">{entry.score}</span>
                            <span className="score-label">pts</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Round Summaries — paginated */}
            {totalRounds > 0 && round && (
                <div className="round-summaries animate-fade-in" style={{ animationDelay: `${0.3 + leaderboard.length * 0.15 + 0.3}s` }}>
                    <h2 className="section-title">📋 Round-by-Round Summary</h2>

                    <div className="round-summary-card" key={round.roundNumber}>
                        <div className="round-summary-header">
                            <span className="round-summary-badge">Round {round.roundNumber}</span>
                            <span className="round-summary-imposter">
                                🎭 Imposter: <strong>{round.imposterName}</strong>
                            </span>
                        </div>

                        <div className="round-summary-questions">
                            <div className="question-reveal-card real">
                                <span className="question-reveal-label">👥 Real Question</span>
                                <p className="question-reveal-text">{round.realQuestion}</p>
                            </div>
                            <div className="question-reveal-card imposter">
                                <span className="question-reveal-label">🎭 Imposter Question</span>
                                <p className="question-reveal-text">{round.imposterQuestion}</p>
                            </div>
                        </div>

                        <div className="round-summary-answers">
                            {round.answers.map((a) => (
                                <div
                                    key={a.playerId}
                                    className={`round-summary-answer ${a.isImposter ? 'imposter-highlight' : ''}`}
                                >
                                    <div className="round-summary-answer-player">
                                        <div className={`player-avatar small ${a.isImposter ? 'imposter' : ''}`}>
                                            {a.playerName.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{a.playerName}</span>
                                        {a.isImposter && <span className="imposter-badge">IMPOSTER</span>}
                                    </div>
                                    <p className="round-summary-answer-text">&ldquo;{a.answer}&rdquo;</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="round-nav">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setCurrentRoundIndex((i) => i - 1)}
                            disabled={currentRoundIndex === 0}
                        >
                            ← Back
                        </button>
                        <span className="round-nav-indicator">
                            {currentRoundIndex + 1} / {totalRounds}
                        </span>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setCurrentRoundIndex((i) => i + 1)}
                            disabled={currentRoundIndex === totalRounds - 1}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            <div className="gameover-actions animate-fade-in" style={{ animationDelay: `${0.3 + leaderboard.length * 0.15 + 0.5}s` }}>
                {isHost ? (
                    <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
                        🔄 Play Again
                    </button>
                ) : (
                    <p className="waiting-text">Waiting for host to start a new game...</p>
                )}
            </div>
        </div>
    );
}
