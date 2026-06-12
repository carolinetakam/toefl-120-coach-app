import { initialState } from '@/lib/seed';
import { AppState, PracticeResult, ReviewCard, Section, Track } from '@/lib/types';

const sections: Section[] = ['reading', 'listening', 'speaking', 'writing'];
const tracks: Track[] = ['Foundation', 'High-score', '120 precision', 'Test-readiness'];

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function asDateString(value: unknown, fallback: string) {
  const text = asString(value, fallback);
  return Number.isNaN(new Date(text).getTime()) ? fallback : text;
}

function sanitizeSectionScores(value: unknown, fallback: Record<Section, number>) {
  const source = isObject(value) ? value : {};
  return sections.reduce(
    (scores, section) => ({
      ...scores,
      [section]: asNumber(source[section], fallback[section], 0, 1),
    }),
    {} as Record<Section, number>,
  );
}

function sanitizeNumberRecord(value: unknown) {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, score]) => key.length > 0 && typeof score === 'number' && Number.isFinite(score))
      .map(([key, score]) => [key, asNumber(score, 0.5, 0, 1)]),
  );
}

function sanitizeDiagnosticAnswers(value: unknown) {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, answer]) => key.length > 0 && Number.isInteger(answer))
      .map(([key, answer]) => [key, asNumber(answer, 0, 0, 10)]),
  ) as Record<string, number>;
}

function sanitizeDiagnosticFormId(value: unknown) {
  const formId = asString(value, initialState.diagnosticFormId);
  return formId === 'baseline' || formId === 'fresh-beta' ? formId : initialState.diagnosticFormId;
}

function sanitizeReviewQueue(value: unknown): ReviewCard[] {
  if (!Array.isArray(value)) return initialState.reviewQueue;
  return value
    .filter(isObject)
    .map((entry, index) => ({
      id: asString(entry.id, `review-${index}`),
      section: sections.includes(entry.section as Section) ? (entry.section as Section) : 'reading',
      subskill: asString(entry.subskill, 'core skill'),
      prompt: asString(entry.prompt, 'Review the saved TOEFL cue.'),
      answer: asString(entry.answer, ''),
      dueDate: asDateString(entry.dueDate, new Date().toISOString()),
      interval: asNumber(entry.interval, 1, 1, 30),
    }));
}

function sanitizeErrorLog(value: unknown): AppState['errorLog'] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject).map((entry, index) => ({
    id: asString(entry.id, `error-${index}`),
    section: sections.includes(entry.section as Section) ? (entry.section as Section) : 'reading',
    subskill: asString(entry.subskill, 'core skill'),
    errorType: asString(entry.errorType, 'Accuracy gap'),
    prompt: asString(entry.prompt, ''),
    correctInsight: asString(entry.correctInsight, ''),
    repeatCount: asNumber(entry.repeatCount, 1, 1, 99),
    dueDate: asDateString(entry.dueDate, new Date().toISOString()),
    lastSeen: asDateString(entry.lastSeen, new Date().toISOString()),
    corrected: asBoolean(entry.corrected, false),
  }));
}

function sanitizePracticeHistory(value: unknown): PracticeResult[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isObject)
    .map((entry, index) => ({
      id: asString(entry.id, `practice-${index}`),
      section: sections.includes(entry.section as Section) ? (entry.section as Section) : 'reading',
      subskill: asString(entry.subskill, 'core skill'),
      score: asNumber(entry.score, 0.5, 0, 1),
      completedAt: asDateString(entry.completedAt, new Date().toISOString()),
      notes: asString(entry.notes, ''),
      supported: asBoolean(entry.supported, false),
    }))
    .slice(0, 100);
}

function sanitizeWritingDrafts(value: unknown): AppState['writingDrafts'] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject).map((entry, index) => ({
    promptId: asString(entry.promptId, `writing-${index}`),
    draft: asString(entry.draft, ''),
    revision: asString(entry.revision, ''),
    score: asNumber(entry.score, 0, 0, 1),
  }));
}

function sanitizeSpeakingAttempts(value: unknown): AppState['speakingAttempts'] {
  if (!Array.isArray(value)) return [];
  return value.filter(isObject).map((entry, index) => ({
    promptId: asString(entry.promptId, `speaking-${index}`),
    selfRating: asNumber(entry.selfRating, 3, 1, 5),
    notes: asString(entry.notes, ''),
    hasAudioEvidence: asBoolean(entry.hasAudioEvidence, false),
    audioUrl: undefined,
  }));
}

function sanitizeNumberAnswerRecord(value: unknown) {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, answer]) => key.length > 0 && Number.isInteger(answer))
      .map(([key, answer]) => [key, asNumber(answer, 0, 0, 10)]),
  ) as Record<string, number>;
}

function sanitizeBooleanRecord(value: unknown) {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key.length > 0)
      .map(([key, checked]) => [key, asBoolean(checked, false)]),
  ) as Record<string, boolean>;
}

function sanitizeMiniMockAttempts(value: unknown): AppState['miniMockAttempts'] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isObject)
    .map((entry, index) => ({
      mockId: asString(entry.mockId, `mock-${index}`),
      answers: sanitizeNumberAnswerRecord(entry.answers),
      notes: asString(entry.notes, '').slice(0, 5000),
      speakingNotes: asString(entry.speakingNotes, '').slice(0, 5000),
      writing: asString(entry.writing, '').slice(0, 10000),
      rubric: sanitizeBooleanRecord(entry.rubric),
      submitted: asBoolean(entry.submitted, false),
      submittedAt: entry.submittedAt === undefined ? undefined : asDateString(entry.submittedAt, new Date().toISOString()),
      score: entry.score === undefined ? undefined : asNumber(entry.score, 0, 0, 1),
      elapsedSeconds: entry.elapsedSeconds === undefined ? undefined : asNumber(entry.elapsedSeconds, 0, 0, 24 * 60 * 60),
      timed: asBoolean(entry.timed, false),
      updatedAt: asDateString(entry.updatedAt, new Date().toISOString()),
    }))
    .filter((entry) => entry.mockId.length > 0)
    .slice(0, 20);
}

export function sanitizeAppState(value: unknown): AppState {
  if (!isObject(value)) return initialState;
  const profile = isObject(value.profile) ? value.profile : {};
  const confidence = isObject(profile.confidence) ? profile.confidence : {};

  return {
    onboarded: asBoolean(value.onboarded, initialState.onboarded),
    profile: {
      name: asString(profile.name, initialState.profile.name).slice(0, 80),
      targetScore: asNumber(profile.targetScore, initialState.profile.targetScore, 80, 120),
      testDate: asDateString(profile.testDate, initialState.profile.testDate).slice(0, 10),
      dailyMinutes: asNumber(profile.dailyMinutes, initialState.profile.dailyMinutes, 20, 240),
      confidence: sections.reduce(
        (scores, section) => ({
          ...scores,
          [section]: asNumber(confidence[section], initialState.profile.confidence[section], 0, 5),
        }),
        {} as Record<Section, number>,
      ),
    },
    diagnosticFormId: sanitizeDiagnosticFormId(value.diagnosticFormId),
    diagnosticCompleted: asBoolean(value.diagnosticCompleted, initialState.diagnosticCompleted),
    diagnosticAnswers: sanitizeDiagnosticAnswers(value.diagnosticAnswers),
    sectionScores: sanitizeSectionScores(value.sectionScores, initialState.sectionScores),
    subskillScores: sanitizeNumberRecord(value.subskillScores),
    track: tracks.includes(value.track as Track) ? (value.track as Track) : initialState.track,
    xp: asNumber(value.xp, 0, 0),
    streak: asNumber(value.streak, 0, 0, 3650),
    lastActiveDate: asString(value.lastActiveDate, ''),
    reviewQueue: sanitizeReviewQueue(value.reviewQueue),
    errorLog: sanitizeErrorLog(value.errorLog),
    practiceHistory: sanitizePracticeHistory(value.practiceHistory),
    writingDrafts: sanitizeWritingDrafts(value.writingDrafts),
    speakingAttempts: sanitizeSpeakingAttempts(value.speakingAttempts),
    miniMockAttempts: sanitizeMiniMockAttempts(value.miniMockAttempts),
  };
}

export function parseAppStateJson(json: string) {
  return sanitizeAppState(JSON.parse(json));
}
