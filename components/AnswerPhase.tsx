'use client';

import { useState } from 'react';

interface AnswerPhaseProps {
    question: string;
    roundNumber: number;
    totalRounds: number;
    answerProgress: { answered: number; total: number };
    onSubmit: (answer: string) => void;
}

export default function AnswerPhase({
    question,
    roundNumber,
    totalRounds,
    answerProgress,
    onSubmit,
}: AnswerPhaseProps) {
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (answer.trim() && !submitted) {
            setSubmitted(true);
            onSubmit(answer.trim());
        }
    };

    return (
        <div className="phase-container">
            <div className="round-indicator">
                Round {roundNumber} of {totalRounds}
            </div>

            <div className="question-card animate-slide-up">
                <div className="question-icon">❓</div>
                <h2 className="question-text">{question}</h2>
            </div>

            {!submitted ? (
                <div className="answer-form animate-fade-in">
                    <textarea
                        className="answer-input"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        maxLength={200}
                        rows={3}
                        autoFocus
                    />
                    <div className="answer-footer">
                        <span className="char-count">{answer.length}/200</span>
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={!answer.trim()}
                        >
                            Submit Answer
                        </button>
                    </div>
                </div>
            ) : (
                <div className="waiting-card animate-fade-in">
                    <div className="spinner" />
                    <p>Answer submitted! Waiting for others...</p>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${(answerProgress.answered / answerProgress.total) * 100}%` }}
                        />
                    </div>
                    <p className="progress-text">
                        {answerProgress.answered} / {answerProgress.total} answered
                    </p>
                </div>
            )}
        </div>
    );
}
