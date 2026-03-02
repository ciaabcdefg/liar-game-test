'use client';

import { useState } from 'react';
import { useSocket, GamePhaseState } from '@/hooks/useSocket';
import Lobby from '@/components/Lobby';
import AnswerPhase from '@/components/AnswerPhase';
import RevealPhase from '@/components/RevealPhase';
import VoteResults from '@/components/VoteResults';
import GameOver from '@/components/GameOver';

export default function Home() {
  const {
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
  } = useSocket();

  const [mode, setMode] = useState<'home' | 'host' | 'join'>('home');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [rounds, setRounds] = useState(3);
  const [language, setLanguage] = useState('English');
  const [topic, setTopic] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState(false);

  const handleHost = async () => {
    if (!name.trim() || (!apiKey.trim() && !useMock)) return;
    setLoading(true);
    setError('');
    try {
      await createRoom(name.trim(), apiKey.trim(), rounds, language, topic.trim(), useMock);
    } catch {
      // error is set by hook
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      await joinRoom(roomCode.trim(), name.trim());
    } catch {
      // error is set by hook
    }
    setLoading(false);
  };

  const isHost = (() => {
    if (gameState.phase === 'idle') return false;
    return gameState.roomState.players.find((p) => p.id === playerId)?.isHost ?? false;
  })();

  const roomCode_ = gameState.phase !== 'idle' ? gameState.roomState.code : '';

  // Render the appropriate phase
  if (gameState.phase !== 'idle') {
    return (
      <main className="game-main">
        {notification && (
          <div className="notification animate-slide-up">{notification}</div>
        )}
        {error && (
          <div className="error-banner animate-slide-up">
            {error}
            <button className="error-close" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {gameState.phase === 'lobby' && (
          <Lobby
            roomState={gameState.roomState}
            playerId={playerId}
            onStartGame={() => startGame(roomCode_)}
          />
        )}

        {gameState.phase === 'answering' && (
          <AnswerPhase
            question={gameState.question}
            roundNumber={gameState.roundNumber}
            totalRounds={gameState.roomState.totalRounds}
            answerProgress={answerProgress}
            onSubmit={(answer) => submitAnswer(roomCode_, answer)}
          />
        )}

        {gameState.phase === 'reveal' && (
          <RevealPhase
            realQuestion={gameState.realQuestion}
            answers={gameState.answers}
            players={gameState.roomState.players}
            playerId={playerId}
            voteProgress={voteProgress}
            onVote={(suspectId) => submitVote(roomCode_, suspectId)}
          />
        )}

        {gameState.phase === 'vote-results' && (
          <VoteResults
            voteResult={gameState.voteResult}
            players={gameState.roomState.players}
            playerId={playerId}
            isHost={isHost}
            currentRound={gameState.roomState.currentRound}
            totalRounds={gameState.roomState.totalRounds}
            onNextRound={() => nextRound(roomCode_)}
          />
        )}

        {gameState.phase === 'finished' && (
          <GameOver
            leaderboard={gameState.leaderboard}
            roundSummaries={gameState.roundSummaries}
            playerId={playerId}
            isHost={isHost}
            onPlayAgain={() => playAgain(roomCode_)}
          />
        )}
      </main>
    );
  }

  // Home screen
  return (
    <main className="home-main">
      <div className="home-bg-effects">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />
      </div>

      <div className="home-content">
        <div className="title-section animate-slide-up">
          <h1 className="game-title">
            <span className="title-icon">🎭</span>
            Guess the Liar
          </h1>
          <p className="game-tagline">One question. One liar. Can you spot the imposter?</p>
        </div>

        {!connected && (
          <div className="connecting-card animate-fade-in">
            <div className="spinner" />
            <p>Connecting to server...</p>
          </div>
        )}

        {connected && mode === 'home' && (
          <div className="home-actions animate-fade-in">
            <button className="btn btn-primary btn-large" onClick={() => setMode('host')}>
              🏠 Host a Game
            </button>
            <button className="btn btn-secondary btn-large" onClick={() => setMode('join')}>
              🚪 Join a Game
            </button>
          </div>
        )}

        {connected && mode === 'host' && (
          <div className="form-card animate-slide-up">
            <button className="back-btn" onClick={() => setMode('home')}>← Back</button>
            <h2 className="form-title">Host a Game</h2>

            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>OpenRouter API Key</label>
              <input
                type="password"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
              />
              <span className="form-hint">Used to generate questions with AI</span>
            </div>

            <div className="form-group">
              <label>Number of Rounds</label>
              <div className="round-selector">
                {[3, 5, 7, 10].map((n) => (
                  <button
                    key={n}
                    className={`round-btn ${rounds === n ? 'active' : ''}`}
                    onClick={() => setRounds(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Language</label>
              <select
                className="form-input form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {[
                  'English', 'Thai', 'Japanese', 'Korean', 'Chinese',
                  'Spanish', 'French', 'German', 'Portuguese', 'Italian',
                  'Russian', 'Arabic', 'Hindi', 'Indonesian', 'Vietnamese',
                ].map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Topic <span className="form-hint-inline">(optional)</span></label>
              <input
                type="text"
                className="form-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. anime, food, movies, travel..."
                maxLength={50}
              />
              <span className="form-hint">Leave empty for random topics</span>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useMock}
                    onChange={(e) => setUseMock(e.target.checked)}
                    className="form-checkbox"
                  />
                  🧪 Use mock questions (no API key needed)
                </label>
              </div>
            )}

            {error && <p className="form-error">{error}</p>}

            <button
              className="btn btn-primary btn-large"
              onClick={handleHost}
              disabled={!name.trim() || (!apiKey.trim() && !useMock) || loading}
            >
              {loading ? 'Creating Room...' : '🎭 Create Room'}
            </button>
          </div>
        )}

        {connected && mode === 'join' && (
          <div className="form-card animate-slide-up">
            <button className="back-btn" onClick={() => setMode('home')}>← Back</button>
            <h2 className="form-title">Join a Game</h2>

            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Room Code</label>
              <input
                type="text"
                className="form-input room-code-input"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                maxLength={5}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              className="btn btn-primary btn-large"
              onClick={handleJoin}
              disabled={!name.trim() || !roomCode.trim() || loading}
            >
              {loading ? 'Joining...' : '🚪 Join Room'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
