import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { appState } from './appState';

const section = v.union(v.literal('reading'), v.literal('listening'), v.literal('speaking'), v.literal('writing'));

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_tokenIdentifier', ['tokenIdentifier']),

  profiles: defineTable({
    userId: v.id('users'),
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
    onboarded: v.boolean(),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  progress: defineTable({
    userId: v.id('users'),
    diagnosticCompleted: v.boolean(),
    diagnosticAnswers: v.record(v.string(), v.number()),
    sectionScores: v.record(v.string(), v.number()),
    subskillScores: v.record(v.string(), v.number()),
    track: v.string(),
    xp: v.number(),
    streak: v.number(),
    lastActiveDate: v.string(),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  appStates: defineTable({
    userId: v.id('users'),
    schemaVersion: v.number(),
    state: appState,
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  practiceResults: defineTable({
    userId: v.id('users'),
    cardId: v.optional(v.string()),
    section,
    subskill: v.string(),
    score: v.number(),
    completedAt: v.string(),
    notes: v.string(),
    supported: v.boolean(),
  })
    .index('by_userId', ['userId'])
    .index('by_user_completedAt', ['userId', 'completedAt']),

  reviewCards: defineTable({
    userId: v.id('users'),
    section,
    subskill: v.string(),
    prompt: v.string(),
    answer: v.string(),
    dueDate: v.string(),
    interval: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_user_dueDate', ['userId', 'dueDate']),

  errorEntries: defineTable({
    userId: v.id('users'),
    section,
    subskill: v.string(),
    errorType: v.string(),
    prompt: v.string(),
    correctInsight: v.string(),
    repeatCount: v.number(),
    dueDate: v.string(),
    lastSeen: v.string(),
    corrected: v.boolean(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_user_corrected_dueDate', ['userId', 'corrected', 'dueDate']),

  writingDrafts: defineTable({
    userId: v.id('users'),
    promptId: v.string(),
    draft: v.string(),
    revision: v.string(),
    score: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_user_promptId', ['userId', 'promptId']),

  speakingAttempts: defineTable({
    userId: v.id('users'),
    promptId: v.string(),
    selfRating: v.number(),
    notes: v.string(),
    hasAudioEvidence: v.optional(v.boolean()),
    audioStorageId: v.optional(v.id('_storage')),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_user_promptId', ['userId', 'promptId']),

  miniMockAttempts: defineTable({
    userId: v.id('users'),
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
    updatedAtMs: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_user_mockId', ['userId', 'mockId']),
});
