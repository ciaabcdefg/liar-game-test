export type GamePhase = 'lobby' | 'answering' | 'reveal' | 'vote-results' | 'finished';

export interface Player {
  id: string;
  name: string;
  socketId: string;
  score: number;
  isHost: boolean;
}

export interface RoundData {
  roundNumber: number;
  realQuestion: string;
  imposterQuestion: string;
  imposterId: string;
  answers: Map<string, string>; // playerId → answer
  votes: Map<string, string>;   // voterId → suspectId
}

export interface Room {
  code: string;
  players: Map<string, Player>;
  phase: GamePhase;
  totalRounds: number;
  currentRound: number;
  rounds: RoundData[];
  apiKey: string;
  hostId: string;
  language: string;
  topic: string;
  pastQuestions: string[]; // track questions to avoid repeats
}

// Data sent to clients (serializable)
export interface PlayerInfo {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface RoomState {
  code: string;
  players: PlayerInfo[];
  phase: GamePhase;
  totalRounds: number;
  currentRound: number;
}

export interface QuestionPair {
  realQuestion: string;
  imposterQuestion: string;
}

export interface AnswerEntry {
  playerId: string;
  playerName: string;
  answer: string;
}

export interface VoteResultData {
  votes: Record<string, string[]>; // suspectId → voterNames[]
  imposterId: string;
  imposterName: string;
  imposterCaught: boolean;
  scoreChanges: Record<string, number>; // playerId → points gained
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  playerId: string;
}
