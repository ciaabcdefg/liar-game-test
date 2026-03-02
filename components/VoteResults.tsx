'use client';

import { VoteResultData, PlayerInfo } from '@/lib/types';

interface VoteResultsProps {
    voteResult: VoteResultData;
    players: PlayerInfo[];
    playerId: string;
    isHost: boolean;
    currentRound: number;
    totalRounds: number;
    onNextRound: () => void;
}

export default function VoteResults({
    voteResult,
    players,
    playerId,
    isHost,
    currentRound,
    totalRounds,
    onNextRound,
}: VoteResultsProps) {
    const isLastRound = currentRound >= totalRounds;

    return (
        <div className="phase-container">
            <div className={`result-reveal animate-slide-up ${voteResult.imposterCaught ? 'caught' : 'escaped'}`}>
                <div className="result-icon">
                    {voteResult.imposterCaught ? '🎉' : '😈'}
                </div>
                <h2 className="result-title">
                    {voteResult.imposterCaught
                        ? 'Imposter Caught!'
                        : 'Imposter Escaped!'}
                </h2>
                <p className="result-subtitle">
                    The imposter was <strong>{voteResult.imposterName}</strong>
                    {voteResult.imposterId === playerId && ' (That\'s you!)'}
                </p>
            </div>

            {/* Question reveal */}
            <div className="question-reveal animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="question-reveal-card real">
                    <span className="question-reveal-label">👥 Real Question</span>
                    <p className="question-reveal-text">{voteResult.realQuestion}</p>
                </div>
                <div className="question-reveal-card imposter">
                    <span className="question-reveal-label">🎭 Imposter Question</span>
                    <p className="question-reveal-text">{voteResult.imposterQuestion}</p>
                </div>
            </div>

            {/* Vote breakdown */}
            <div className="vote-breakdown animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <h3 className="section-title">Vote Breakdown</h3>
                <div className="vote-breakdown-list">
                    {Object.entries(voteResult.votes).map(([suspectId, voterNames]) => {
                        const suspect = players.find((p) => p.id === suspectId);
                        const isImposter = suspectId === voteResult.imposterId;
                        return (
                            <div
                                key={suspectId}
                                className={`vote-breakdown-item ${isImposter ? 'imposter-highlight' : ''}`}
                            >
                                <div className="vote-breakdown-player">
                                    <div className={`player-avatar small ${isImposter ? 'imposter' : ''}`}>
                                        {suspect?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{suspect?.name}</span>
                                    {isImposter && <span className="imposter-badge">IMPOSTER</span>}
                                </div>
                                <div className="vote-breakdown-votes">
                                    {voterNames.length} vote{voterNames.length !== 1 ? 's' : ''}
                                    <span className="voter-names">({voterNames.join(', ')})</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Score changes */}
            <div className="score-changes animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <h3 className="section-title">Points This Round</h3>
                <div className="score-change-list">
                    {players.map((player) => {
                        const change = voteResult.scoreChanges[player.id] || 0;
                        return (
                            <div key={player.id} className="score-change-item">
                                <span className="score-player-name">{player.name}</span>
                                <span className={`score-change ${change > 0 ? 'positive' : 'neutral'}`}>
                                    {change > 0 ? `+${change}` : '0'}
                                </span>
                                <span className="score-total">(Total: {player.score})</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Next round button */}
            <div className="next-round-section animate-fade-in" style={{ animationDelay: '1.1s' }}>
                {isHost ? (
                    <button className="btn btn-primary btn-large" onClick={onNextRound}>
                        {isLastRound ? '🏆 See Final Results' : '➡️ Next Round'}
                    </button>
                ) : (
                    <p className="waiting-text">
                        Waiting for host to {isLastRound ? 'show final results' : 'start next round'}...
                    </p>
                )}
            </div>
        </div>
    );
}
