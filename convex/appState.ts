import { v } from 'convex/values';

const section = v.union(v.literal('reading'), v.literal('listening'), v.literal('speaking'), v.literal('writing'));

const reviewCard = v.object({
  id: v.string(),
  section,
  subskill: v.string(),
  prompt: v.string(),
  answer: v.string(),
  dueDate: v.string(),
  interval: v.number(),
});

const errorEntry = v.object({
  id: v.string(),
  section,
  subskill: v.string(),
  errorType: v.string(),
  prompt: v.string(),
  correctInsight: v.string(),
  repeatCount: v.number(),
  dueDate: v.string(),
  lastSeen: v.string(),
  corrected: v.boolean(),
});

const practiceResult = v.object({
  id: v.string(),
  section,
  subskill: v.string(),
  score: v.number(),
  completedAt: v.string(),
  notes: v.string(),
  supported: v.boolean(),
});

export const appState = v.object({
  onboarded: v.boolean(),
  profile: v.object({
    name: v.string(),
    targetScore: v.number(),
    testDate: v.string(),
    dailyMinutes: v.number(),
    confidence: v.object({
      reading: v.number(),
      listening: v.number(),
      speaking: v.number(),
      writing: v.number(),
    }),
  }),
  diagnosticCompleted: v.boolean(),
  diagnosticAnswers: v.record(v.string(), v.number()),
  sectionScores: v.object({
    reading: v.number(),
    listening: v.number(),
    speaking: v.number(),
    writing: v.number(),
  }),
  subskillScores: v.record(v.string(), v.number()),
  track: v.union(v.literal('Foundation'), v.literal('High-score'), v.literal('120 precision'), v.literal('Test-readiness')),
  xp: v.number(),
  streak: v.number(),
  lastActiveDate: v.string(),
  reviewQueue: v.array(reviewCard),
  errorLog: v.array(errorEntry),
  practiceHistory: v.array(practiceResult),
  writingDrafts: v.array(v.object({
    promptId: v.string(),
    draft: v.string(),
    revision: v.string(),
    score: v.number(),
  })),
  speakingAttempts: v.array(v.object({
    promptId: v.string(),
    selfRating: v.number(),
    notes: v.string(),
    hasAudioEvidence: v.optional(v.boolean()),
  })),
  miniMockAttempts: v.optional(v.array(v.object({
    mockId: v.string(),
    answers: v.record(v.string(), v.number()),
    notes: v.string(),
    speakingNotes: v.string(),
    writing: v.string(),
    rubric: v.record(v.string(), v.boolean()),
    submitted: v.boolean(),
    submittedAt: v.optional(v.string()),
    score: v.optional(v.number()),
    elapsedSeconds: v.optional(v.number()),
    timed: v.optional(v.boolean()),
    updatedAt: v.string(),
  }))),
});
