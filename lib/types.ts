export type Section = 'reading' | 'listening' | 'speaking' | 'writing';
export type Track = 'Foundation' | 'High-score' | '120 precision' | 'Test-readiness';
export type ContentSourceType = 'approved_seed' | 'manual_content' | 'approved_generated_variant';
export type ContentDifficultyBand = 'A2' | 'B1' | 'B2' | 'C1';
export type ContentResponseMode = 'learner_answer' | 'summary_only' | 'template_only';
export type SourceMaterialCompleteness = 'complete' | 'summary_only' | 'template_only';

export interface IntegratedTaskMaterials {
  reading?: string;
  listening?: string;
  lecture?: string;
  conversation?: string;
  sourceSummary?: string;
  template?: string;
  exampleResponse?: string;
}

export interface ContentMetadata {
  contentId: string;
  section: Section;
  taskType: string;
  questionType: string;
  strategyCardId: string;
  difficultyBand: ContentDifficultyBand;
  timingSeconds: number;
  traps: string[];
  cue: string;
  repairRule: string;
  sourceType: ContentSourceType;
  reviewStatus: 'approved';
  responseMode: ContentResponseMode;
  sourceMaterialCompleteness?: SourceMaterialCompleteness;
}

export interface UserProfile {
  name: string;
  targetScore: number;
  testDate: string;
  dailyMinutes: number;
  confidence: Record<Section, number>;
}

export interface DiagnosticQuestion {
  id: string;
  section: Section;
  subskill: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface PracticeCard {
  id: string;
  section: Section;
  title: string;
  subskill: string;
  prompt: string;
  choices?: string[];
  answer?: number;
  explanation: string;
  xp: number;
  followUp?: string;
  responseMode?: ContentResponseMode;
  sourceMaterialCompleteness?: SourceMaterialCompleteness;
  materials?: IntegratedTaskMaterials;
}

export interface ErrorEntry {
  id: string;
  section: Section;
  subskill: string;
  errorType: string;
  prompt: string;
  correctInsight: string;
  repeatCount: number;
  dueDate: string;
  lastSeen: string;
  corrected: boolean;
}

export interface ReviewCard {
  id: string;
  section: Section;
  subskill: string;
  prompt: string;
  answer: string;
  dueDate: string;
  interval: number;
}

export interface DailyTask {
  id: string;
  block: 'Retrieval' | 'Precision' | 'Timed' | 'Review';
  title: string;
  reason: string;
  minutes: number;
  section: Section;
}

export interface PracticeResult {
  id: string;
  section: Section;
  subskill: string;
  score: number;
  completedAt: string;
  notes: string;
  supported: boolean;
}

export interface MiniMockAttempt {
  mockId: string;
  answers: Record<string, number>;
  notes: string;
  speakingNotes: string;
  writing: string;
  rubric: Record<string, boolean>;
  submitted: boolean;
  submittedAt?: string;
  score?: number;
  elapsedSeconds?: number;
  timed: boolean;
  updatedAt: string;
}

export interface AppState {
  onboarded: boolean;
  profile: UserProfile;
  diagnosticFormId: string;
  diagnosticCompleted: boolean;
  diagnosticAnswers: Record<string, number>;
  sectionScores: Record<Section, number>;
  subskillScores: Record<string, number>;
  track: Track;
  xp: number;
  streak: number;
  lastActiveDate: string;
  reviewQueue: ReviewCard[];
  errorLog: ErrorEntry[];
  practiceHistory: PracticeResult[];
  writingDrafts: Array<{ promptId: string; draft: string; revision: string; score: number }>;
  speakingAttempts: Array<{ promptId: string; selfRating: number; notes: string; hasAudioEvidence?: boolean; audioUrl?: string }>;
  miniMockAttempts: MiniMockAttempt[];
}
