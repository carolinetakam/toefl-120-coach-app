'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UserButton, useAuth, useClerk } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { formatProgressBackup, parseProgressBackup } from '@/lib/backup';
import { buildRepairNote, getMockQuestionMetadata, getMockTestMetadata, getPracticeCardMetadata } from '@/lib/content-metadata';
import { dateAfterDays } from '@/lib/dates';
import { canPromoteLocalStateToCloud, LOCAL_SYNC_OWNER_KEY, localStateBelongsToAnotherUser } from '@/lib/sync-ownership';
import { buildPersonalProofGate, getFirstUserLoopSteps, hasUserProgress } from '@/lib/first-user-loop';
import { getDiagnosticQuestions, getNextDiagnosticFormId } from '@/lib/diagnostic';
import { applyPracticeOutcome, buildErrorEntry, buildReviewCard, getLocalDateKey, nextInterval, prioritizePracticeCards, readinessScore, scoreDiagnostic, updateStreak, updateSubskillScores } from '@/lib/logic';
import { evaluateMockAttempt, mockTests, MockQuestion, scoreMockAnswers } from '@/lib/mock-tests';
import { generateDailyPlan, summarizeDailyPlanTask } from '@/lib/planner';
import { getSprintNextAction, type SprintNextAction } from '@/lib/repair-path';
import { generateBlockerSummary, generateRecommendedDrills } from '@/lib/reporting';
import { evaluateSpeakingAttempt, evaluateWritingAttempt, SkillEvaluation } from '@/lib/scoring';
import { resolveMockSelection, resolvePracticeCardSelection } from '@/lib/selection-recovery';
import { initialState, practiceCards, sectionLabels } from '@/lib/seed';
import { getSprintMode, getTodaySprintDay, sectionPlaybooks, type SprintAction } from '@/lib/sprint';
import { buildPathDayViews, canAccessFullLibrary, canAccessMock, getTodayMission, type PathDayView, type UnlockStatus } from '@/lib/progression';
import { loadState, resetState, saveState, toPersistableState } from '@/lib/storage';
import { buildTestWeekCommand, formatFinalTemplateSheet, formatLearnerReadinessReport, generateTestDayPlan, generateTestReadinessReport } from '@/lib/test-readiness';
import { elapsedSeconds, formatElapsedSeconds } from '@/lib/timing';
import { AppState, DailyTask, MiniMockAttempt, PracticeCard, ReviewCard, Section, UserProfile } from '@/lib/types';
import { sanitizeAppState } from '@/lib/validation';
import { buildFounderLaunchGate, defaultLaunchSmokeChecks, launchSmokeCheckDefinitions, type LaunchReadinessAudit, type LaunchSmokeChecks, type LaunchSmokeCheckKey } from '@/lib/launch-readiness';

type TabKey = 'today' | 'path' | 'review' | 'progress' | 'library';
type AuthStatus = 'loading' | 'authenticated' | 'guest' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: { id: string } | null;
  isGuest: boolean;
};

type GuestSession = {
  id: string;
  createdAt: string;
  expiresAt?: string;
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'path', label: 'Path' },
  { key: 'review', label: 'Review' },
  { key: 'progress', label: 'Progress' },
  { key: 'library', label: 'Library' },
];

const sectionOrder: Section[] = ['reading', 'listening', 'speaking', 'writing'];
const strategyCardIds = ['pr-r-9', 'pr-l-9', 'pr-s-7', 'pr-w-7'];
const strategyLayerSkillCopy = 'one hidden TOEFL logic skill: noticing structure, purpose, and evidence';

function isStrategyLayerCard(cardId: string) {
  return strategyCardIds.includes(cardId);
}

const speakingChecks = ['Clear main idea', 'Source detail included', 'Finished cleanly'];
const diagnosticStartedAtKey = 'toefl-120-coach-diagnostic-started-at';
const launchSmokeChecksKey = 'toefl-120-coach-launch-smoke-checks';
const guestSessionKey = 'toefl-120-coach-guest-session';
const speakingRecordingLimitSeconds = 60;

const pathStatusLabels: Record<UnlockStatus, string> = {
  completed: '✓ Completed',
  current: 'Current mission',
  locked: 'Locked',
  available_optional: 'Optional sprint override',
};

const pathStatusBadgeClass: Record<UnlockStatus, string> = {
  completed: 'pill-good',
  current: 'pill-warn',
  locked: 'chip',
  available_optional: 'pill-good',
};

function pathStatusClass(status: UnlockStatus) {
  return `pathCard-${status.replace('_', '-')}`;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getStatusPill(value: number) {
  if (value >= 0.9) return 'pill-good';
  if (value >= 0.75) return 'pill-warn';
  return 'pill-bad';
}

function normalizeNumber(value: string, defaultValue: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, parsed));
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function mockQuestionToPracticeCard(question: MockQuestion): PracticeCard {
  return {
    id: `repair-${question.id}`,
    section: question.section,
    title: `Mini mock repair: ${question.subskill}`,
    subskill: question.subskill,
    prompt: question.prompt,
    choices: question.choices,
    answer: question.answer,
    explanation: question.explanation,
    xp: 0,
  };
}

function buildMiniMockAttempt(
  mockId: string,
  answers: Record<string, number>,
  notes: string,
  speakingNotes: string,
  writing: string,
  rubric: Record<string, boolean>,
  submitted: boolean,
  score?: number,
  submittedAt?: string,
  elapsedSeconds?: number,
  timed = false,
): MiniMockAttempt {
  const now = new Date().toISOString();
  return {
    mockId,
    answers,
    notes,
    speakingNotes,
    writing,
    rubric,
    submitted,
    submittedAt,
    score,
    elapsedSeconds,
    timed,
    updatedAt: now,
  };
}

function sameMiniMockAttempt(a: MiniMockAttempt | undefined, b: MiniMockAttempt) {
  if (!a) return false;
  return (
    a.mockId === b.mockId &&
    JSON.stringify(a.answers) === JSON.stringify(b.answers) &&
    a.notes === b.notes &&
    a.speakingNotes === b.speakingNotes &&
    a.writing === b.writing &&
    JSON.stringify(a.rubric) === JSON.stringify(b.rubric) &&
    a.submitted === b.submitted &&
    a.submittedAt === b.submittedAt &&
    a.score === b.score &&
    a.elapsedSeconds === b.elapsedSeconds &&
    a.timed === b.timed
  );
}

function upsertMiniMockAttempt(attempts: MiniMockAttempt[], next: MiniMockAttempt) {
  const existing = attempts.find((attempt) => attempt.mockId === next.mockId);
  if (sameMiniMockAttempt(existing, next)) return attempts;
  return [next, ...attempts.filter((attempt) => attempt.mockId !== next.mockId)].slice(0, 20);
}

function buildDiagnosticRepairReveal(
  result: ReturnType<typeof scoreDiagnostic>,
  answers: Record<string, number>,
  questions: ReturnType<typeof getDiagnosticQuestions>,
) {
  const missedQuestion = questions.find((question) => answers[question.id] !== question.answer);

  if (!missedQuestion) {
    return 'Your first repair target: no diagnostic miss found. Why: all answered diagnostic strategy items were correct, so Day 1 starts with real speaking and writing evidence. Start Day 1.';
  }

  const sectionScore = Math.round(result.sectionScores[missedQuestion.section] * 100);
  return `Your first repair target: ${sectionLabels[missedQuestion.section]}/${missedQuestion.subskill}. Why: the diagnostic missed this strategy item and ${sectionLabels[missedQuestion.section]} is at ${sectionScore}%. Start Day 1.`;
}

function buildDailyMissionReveal(prev: AppState, next: AppState) {
  if (!prev.diagnosticCompleted || !next.diagnosticCompleted) return '';

  const beforeDays = buildPathDayViews(prev);
  const afterDays = buildPathDayViews(next);
  const beforeCurrent = beforeDays.find((day) => day.status === 'current');
  if (!beforeCurrent) return '';

  const afterSameDay = afterDays.find((day) => day.day === beforeCurrent.day);
  const afterNextDay = afterDays.find((day) => day.day === beforeCurrent.day + 1);

  if (afterSameDay?.status !== 'completed' || !afterNextDay) return '';
  if (afterNextDay.status !== 'current' && afterNextDay.status !== 'available_optional') return '';

  return `Day ${beforeCurrent.day} complete. You unlocked Day ${afterNextDay.day}: ${afterNextDay.title}.`;
}

function hasCompletedStrategyLayer(history: AppState['practiceHistory']) {
  return history.some((entry) => strategyCardIds.some((id) => entry.id.startsWith(id)));
}

function buildObjectiveStrategyLayerReveal(card: PracticeCard, correct: boolean) {
  if (!isStrategyLayerCard(card.id)) return '';

  const metadata = getPracticeCardMetadata(card);
  if (correct) {
    return `Strategy unlocked. You practiced ${strategyLayerSkillCopy}.`;
  }

  return `Strategy layer started. You practiced the strategy, but this attempt needs repair: ${buildRepairNote(metadata)}`;
}

function buildEvidenceStrategyLayerReveal(card: PracticeCard, evaluation: SkillEvaluation, supported: boolean) {
  if (!isStrategyLayerCard(card.id)) return '';

  if (!supported) {
    return `Strategy unlocked. You practiced ${strategyLayerSkillCopy}. ${evaluation.summary}`;
  }

  return `Strategy layer started. You practiced the strategy, but this attempt needs repair: ${evaluation.summary} Repair: ${evaluation.repairs[0]}`;
}

function latestMiniMockAttempt(attempts: MiniMockAttempt[]) {
  return [...attempts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
}

function getLocalSyncOwner() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LOCAL_SYNC_OWNER_KEY);
}

function setLocalSyncOwner(userId: string | null | undefined) {
  if (typeof window === 'undefined') return;
  if (userId) {
    window.localStorage.setItem(LOCAL_SYNC_OWNER_KEY, userId);
    return;
  }
  window.localStorage.removeItem(LOCAL_SYNC_OWNER_KEY);
}

function clearLocalProgressForAccountExit() {
  resetState();
  setLocalSyncOwner(null);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(diagnosticStartedAtKey);
    window.localStorage.removeItem(guestSessionKey);
    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith('toefl-120-coach'))
      .forEach((key) => window.sessionStorage.removeItem(key));
  }
}

function getGuestSession(): GuestSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(guestSessionKey) ?? 'null') as GuestSession | null;
    if (!parsed?.id || !parsed.createdAt) return null;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(guestSessionKey);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(guestSessionKey);
    return null;
  }
}

function createGuestSession(): GuestSession {
  return {
    id: typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `guest-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
}

function loadLaunchSmokeChecks(): LaunchSmokeChecks {
  if (typeof window === 'undefined') return defaultLaunchSmokeChecks;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(launchSmokeChecksKey) ?? '{}') as Partial<LaunchSmokeChecks>;
    return {
      signed_in_sync: parsed.signed_in_sync?.done ? parsed.signed_in_sync : defaultLaunchSmokeChecks.signed_in_sync,
      reset_export_smoke: parsed.reset_export_smoke?.done ? parsed.reset_export_smoke : defaultLaunchSmokeChecks.reset_export_smoke,
    };
  } catch {
    return defaultLaunchSmokeChecks;
  }
}

export function CoachApp() {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [signedOutLocally, setSignedOutLocally] = useState(false);
  const [authCheckTimedOut, setAuthCheckTimedOut] = useState(false);
  const [tab, setTab] = useState<TabKey>('today');
  const [section, setSection] = useState<Section>('reading');
  const [selectedCardId, setSelectedCardId] = useState<Record<Section, string>>({
    reading: practiceCards.reading[0].id,
    listening: practiceCards.listening[0].id,
    speaking: practiceCards.speaking[0].id,
    writing: practiceCards.writing[0].id,
  });
  const [diagnosticIndex, setDiagnosticIndex] = useState(0);
  const [diagnosticChoice, setDiagnosticChoice] = useState<number | null>(null);
  const [writingDraft, setWritingDraft] = useState('');
  const [writingRevision, setWritingRevision] = useState('');
  const [speakingRating, setSpeakingRating] = useState(3);
  const [speakingNotes, setSpeakingNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saveStatus, setSaveStatus] = useState<'Local' | 'Syncing' | 'Synced' | 'Offline'>('Local');
  const [launchAudit, setLaunchAudit] = useState<LaunchReadinessAudit | null>(null);
  const [launchAuditStatus, setLaunchAuditStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [launchSmokeChecks, setLaunchSmokeChecks] = useState<LaunchSmokeChecks>(defaultLaunchSmokeChecks);
  const [submittedChoices, setSubmittedChoices] = useState<Record<string, number>>({});
  const [currentMockId, setCurrentMockId] = useState(mockTests[0].id);
  const [mockAnswers, setMockAnswers] = useState<Record<string, number>>({});
  const [mockNotes, setMockNotes] = useState('');
  const [mockSpeakingNotes, setMockSpeakingNotes] = useState('');
  const [mockWriting, setMockWriting] = useState('');
  const [mockRubric, setMockRubric] = useState<Record<string, boolean>>({});
  const [mockSubmitted, setMockSubmitted] = useState(false);
  const [mockStartedAt, setMockStartedAt] = useState<number | null>(null);
  const [mockElapsedSnapshot, setMockElapsedSnapshot] = useState(0);
  const [showReadinessReportText, setShowReadinessReportText] = useState(false);
  const [showFinalTemplateSheet, setShowFinalTemplateSheet] = useState(false);
  const [showBackupText, setShowBackupText] = useState(false);
  const [showFullLibrary, setShowFullLibrary] = useState(false);
  const [backupImportText, setBackupImportText] = useState('');
  const [showMockTranscript, setShowMockTranscript] = useState(false);
  const [revealedReviewIds, setRevealedReviewIds] = useState<Record<string, boolean>>({});
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>();
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [diagnosticStartedAt, setDiagnosticStartedAt] = useState<number | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [lastSpeakingEvaluation, setLastSpeakingEvaluation] = useState<SkillEvaluation | null>(null);
  const [lastWritingEvaluation, setLastWritingEvaluation] = useState<SkillEvaluation | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const submittedChoicesRef = useRef<Record<string, number>>({});
  const previousPracticeCardIdRef = useRef<string | null>(null);
  const mockAutosaveReadyRef = useRef(false);
  const restoredMockSelectionRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const localStateRef = useRef<AppState>(initialState);
  const authModeRef = useRef<string | undefined>(undefined);
  const previousAuthStatusRef = useRef<AuthStatus>('loading');
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { openSignIn, openSignUp, signOut } = useClerk();
  const authMode = authLoaded ? (isSignedIn ? `signed-in:${userId ?? 'unknown'}` : 'signed-out') : 'loading';
  const authState: AuthState = useMemo(() => {
    if (!ready || (!authLoaded && !authCheckTimedOut)) return { status: 'loading', user: null, isGuest: false };
    if (!signedOutLocally && isSignedIn && userId) return { status: 'authenticated', user: { id: userId }, isGuest: false };
    if (guestSession) return { status: 'guest', user: null, isGuest: true };
    return { status: 'unauthenticated', user: null, isGuest: false };
  }, [authCheckTimedOut, authLoaded, guestSession, isSignedIn, ready, signedOutLocally, userId]);
  const convexState = useQuery(api.coach.getAppState, authState.status === 'authenticated' ? {} : 'skip');
  const saveConvexState = useMutation(api.coach.saveAppState);
  const deleteConvexData = useMutation(api.coach.deleteMyData);

  useEffect(() => {
    if (!authLoaded) return;
    console.log('AUTH_STATE', {
      userId,
      isSignedIn: Boolean(isSignedIn),
    });
  }, [authLoaded, isSignedIn, userId]);

  useEffect(() => {
    setGuestSession(getGuestSession());
    setLaunchSmokeChecks(loadLaunchSmokeChecks());
    setReady(true);
  }, []);

  useEffect(() => {
    if (authLoaded) {
      setAuthCheckTimedOut(false);
      return;
    }
    const timeout = window.setTimeout(() => setAuthCheckTimedOut(true), 2500);
    return () => window.clearTimeout(timeout);
  }, [authLoaded]);

  useEffect(() => {
    let cancelled = false;

    async function loadLaunchAudit() {
      try {
        const response = await fetch('/api/readiness', { cache: 'no-store' });
        const payload = (await response.json()) as { audit?: LaunchReadinessAudit };
        if (cancelled) return;
        if (payload.audit) {
          setLaunchAudit(payload.audit);
          setLaunchAuditStatus('loaded');
          return;
        }
        setLaunchAuditStatus('error');
      } catch {
        if (!cancelled) setLaunchAuditStatus('error');
      }
    }

    void loadLaunchAudit();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !authLoaded) return;
    const sessionMode = `${authMode}:${authState.status}:${guestSession?.id ?? 'none'}`;
    if (authModeRef.current === sessionMode) return;
    authModeRef.current = sessionMode;
    const shouldLoadLocalState = authState.status === 'authenticated' || authState.status === 'guest';
    const localState = shouldLoadLocalState ? loadState() : initialState;
    localStateRef.current = localState;
    setState(localState);
    setSyncReady(false);
  }, [authLoaded, authMode, authState.status, guestSession?.id, ready]);

  useEffect(() => {
    const previousStatus = previousAuthStatusRef.current;
    previousAuthStatusRef.current = authState.status;
    if (previousStatus !== 'authenticated' || (authState.status !== 'loading' && authState.status !== 'unauthenticated')) return;
    clearLocalProgressForAccountExit();
    resetPersonalizedUiState();
    localStateRef.current = initialState;
    setGuestSession(null);
    setState(initialState);
    setSyncReady(false);
    setSaveStatus('Local');
  }, [authState.status]);

  useEffect(() => {
    if (!ready || !authLoaded || syncReady) return;
    const localState = localStateRef.current;

    if (authState.status === 'authenticated') {
      if (convexState === undefined) return;
      console.log('CLOUD_RESTORE_START');
      const remoteState = convexState ? sanitizeAppState(convexState.state) : null;
      console.log('CLOUD_RESTORE_RESULT', {
        hasState: Boolean(remoteState),
      });
      const localOwner = getLocalSyncOwner();

      if (remoteState && hasUserProgress(remoteState)) {
        setState(remoteState);
        saveState(remoteState);
        setLocalSyncOwner(userId);
        setSaveStatus('Synced');
        setSyncReady(true);
        return;
      }

      if (localStateBelongsToAnotherUser(localOwner, userId)) {
        const cleanState = initialState;
        localStateRef.current = cleanState;
        setState(cleanState);
        saveState(cleanState);
        setLocalSyncOwner(userId);
        setSaveStatus('Synced');
        setFeedback('Signed in with a different account. Local progress from the previous account was not reused.');
        setSyncReady(true);
        return;
      }

      if (canPromoteLocalStateToCloud(hasUserProgress(localState), localOwner, userId)) {
        console.log('CLOUD_SAVE_START');
        saveConvexState({ schemaVersion: 1, state: toPersistableState(localState) })
          .then(() => {
            setLocalSyncOwner(userId);
            setSaveStatus('Synced');
            console.log('CLOUD_SAVE_SUCCESS');
          })
          .catch((error) => {
            setSaveStatus('Offline');
            console.log('CLOUD_SAVE_FAILED', error);
          })
          .finally(() => setSyncReady(true));
        return;
      }

      setLocalSyncOwner(userId);
      setSaveStatus('Synced');
      setSyncReady(true);
      return;
    }

    if (authState.status === 'guest') {
      setSaveStatus('Local');
      setSyncReady(true);
      return;
    }

    setSaveStatus('Local');
  }, [authLoaded, authState.status, convexState, ready, saveConvexState, syncReady, userId]);

  useEffect(() => {
    if (!ready || !syncReady) return;
    if (authState.status === 'unauthenticated' || authState.status === 'loading') return;
    saveState(state);
    setSaveStatus('Syncing');
    const timeout = window.setTimeout(() => {
      const cleanState = toPersistableState(state);
      if (authState.status !== 'authenticated') {
        setSaveStatus('Local');
        return;
      }

      console.log('CLOUD_SAVE_START');
      saveConvexState({ schemaVersion: 1, state: cleanState })
        .then(() => {
          setLocalSyncOwner(userId);
          setSaveStatus('Synced');
          console.log('CLOUD_SAVE_SUCCESS');
        })
        .catch((error) => {
          setSaveStatus('Offline');
          console.log('CLOUD_SAVE_FAILED', error);
        });
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [authState.status, ready, saveConvexState, state, syncReady, userId]);

  const dailyPlan = useMemo(() => generateDailyPlan(state), [state]);
  const todaySprint = useMemo(() => getTodaySprintDay(state), [state]);
  const sprintMode = useMemo(() => getSprintMode(state), [state]);
  const testReadinessReport = useMemo(() => generateTestReadinessReport(state), [state]);
  const testDayPlan = useMemo(() => generateTestDayPlan(state), [state]);
  const testWeekCommand = useMemo(() => buildTestWeekCommand(state), [state]);
  const learnerReadinessReportText = useMemo(() => formatLearnerReadinessReport(state), [state]);
  const finalTemplateSheetText = useMemo(() => formatFinalTemplateSheet(), []);
  const progressBackupText = useMemo(() => formatProgressBackup(toPersistableState(state)), [state]);
  const founderLaunchGate = useMemo(() => buildFounderLaunchGate(launchAudit, launchSmokeChecks), [launchAudit, launchSmokeChecks]);
  const personalProofGate = useMemo(() => buildPersonalProofGate(state), [state]);
  const readiness = useMemo(() => readinessScore(state), [state]);
  const todayReview = useMemo(
    () => state.reviewQueue.filter((item) => new Date(item.dueDate) <= new Date()),
    [state.reviewQueue],
  );
  const orderedPracticeCards = useMemo(() => prioritizePracticeCards(state, section), [section, state]);
  const strategyLayerCards = useMemo(
    () =>
      sectionOrder.flatMap((item) =>
        practiceCards[item].filter((card) => strategyCardIds.includes(card.id)),
      ),
    [],
  );
  const recommendedDrillIds = useMemo(
    () => new Set(generateRecommendedDrills(orderedPracticeCards, state.sectionScores, state.subskillScores, 1).map((drill) => drill.cardId)),
    [orderedPracticeCards, state.sectionScores, state.subskillScores],
  );
  const currentCardSelection = useMemo(() => resolvePracticeCardSelection(orderedPracticeCards, selectedCardId[section], section), [orderedPracticeCards, section, selectedCardId]);
  const currentCard = currentCardSelection.item;
  const currentDiagnosticQuestions = useMemo(() => getDiagnosticQuestions(state.diagnosticFormId), [state.diagnosticFormId]);
  const currentQuestion = currentDiagnosticQuestions[diagnosticIndex];
  const blockerList = useMemo(() => generateBlockerSummary(state.sectionScores, state.errorLog), [state.errorLog, state.sectionScores]);
  const currentMockSelection = useMemo(() => resolveMockSelection(mockTests, currentMockId), [currentMockId]);
  const currentMock = currentMockSelection.item;
  const currentMiniMockAttempt = useMemo(() => state.miniMockAttempts.find((attempt) => attempt.mockId === currentMock.id), [currentMock.id, state.miniMockAttempts]);
  const currentMockMetadata = useMemo(() => getMockTestMetadata(currentMock.id), [currentMock.id]);
  const mockScore = useMemo(() => scoreMockAnswers(currentMock, mockAnswers), [currentMock, mockAnswers]);
  const currentCardMetadata = useMemo(() => getPracticeCardMetadata(currentCard), [currentCard]);
  const currentPlaybook = sectionPlaybooks[section];
  const hasSpeakingAudioEvidence = state.speakingAttempts.some((attempt) => attempt.hasAudioEvidence);
  const sprintNextAction = useMemo(() => getSprintNextAction(state), [state]);
  const pathDayViews = useMemo(() => buildPathDayViews(state), [state]);
  const todayMission = useMemo(() => getTodayMission(state), [state]);
  const miniMockGate = useMemo(() => canAccessMock(state), [state]);
  const fullLibraryGate = useMemo(() => canAccessFullLibrary(state), [state]);
  const optionalMockOverride = useMemo(
    () => pathDayViews.some((day) => day.status === 'available_optional' && day.actions.some((action) => action.type === 'mock' && action.mockId === currentMock.id)),
    [currentMock.id, pathDayViews],
  );
  const canShowMiniMock = miniMockGate.allowed || optionalMockOverride;
  const mockElapsed = mockStartedAt ? elapsedSeconds(mockStartedAt, clockNow) + mockElapsedSnapshot : mockElapsedSnapshot;
  const mockLimitSeconds = currentMock.minutes * 60;
  const mockTimeRemaining = Math.max(0, mockLimitSeconds - mockElapsed);
  const mockTimed = mockElapsed > 0;

  useEffect(() => {
    if (!currentCardSelection.recoveryMessage) return;
    setSelectedCardId((prev) => ({ ...prev, [section]: currentCard.id }));
    setFeedback(currentCardSelection.recoveryMessage);
  }, [currentCard.id, currentCardSelection.recoveryMessage, section]);

  useEffect(() => {
    if (!currentMockSelection.recoveryMessage) return;
    setCurrentMockId(currentMock.id);
    setFeedback(currentMockSelection.recoveryMessage);
  }, [currentMock.id, currentMockSelection.recoveryMessage]);

  useEffect(() => {
    if (!ready || !syncReady || restoredMockSelectionRef.current) return;
    const latestAttempt = latestMiniMockAttempt(state.miniMockAttempts);
    if (!latestAttempt) return;
    restoredMockSelectionRef.current = true;
    setCurrentMockId(latestAttempt.mockId);
  }, [ready, state.miniMockAttempts, syncReady]);

  useEffect(() => {
    if (!ready || !syncReady) return;
    if (mockAutosaveReadyRef.current) return;
    mockAutosaveReadyRef.current = false;
    const savedAttempt = state.miniMockAttempts.find((attempt) => attempt.mockId === currentMock.id);
    setMockAnswers(savedAttempt?.answers ?? {});
    setMockNotes(savedAttempt?.notes ?? '');
    setMockSpeakingNotes(savedAttempt?.speakingNotes ?? '');
    setMockWriting(savedAttempt?.writing ?? '');
    setMockRubric(savedAttempt?.rubric ?? {});
    setMockSubmitted(Boolean(savedAttempt?.submitted));
    setMockStartedAt(null);
    setMockElapsedSnapshot(savedAttempt?.elapsedSeconds ?? 0);
    setShowMockTranscript(false);
    window.setTimeout(() => {
      mockAutosaveReadyRef.current = true;
    }, 0);
  }, [currentMock.id, ready, state.miniMockAttempts, syncReady]);

  useEffect(() => {
    if (!ready || !syncReady || !mockAutosaveReadyRef.current) return;
    const existing = state.miniMockAttempts.find((attempt) => attempt.mockId === currentMock.id);
    const submittedAt = mockSubmitted ? existing?.submittedAt ?? new Date().toISOString() : undefined;
    const nextAttempt = buildMiniMockAttempt(
      currentMock.id,
      mockAnswers,
      mockNotes,
      mockSpeakingNotes,
      mockWriting,
      mockRubric,
      mockSubmitted,
      existing?.score,
      submittedAt,
      mockElapsed,
      mockTimed || Boolean(existing?.timed),
    );

    setState((prev) => {
      const nextAttempts = upsertMiniMockAttempt(prev.miniMockAttempts, nextAttempt);
      return nextAttempts === prev.miniMockAttempts ? prev : { ...prev, miniMockAttempts: nextAttempts };
    });
  }, [currentMock.id, mockAnswers, mockElapsed, mockNotes, mockRubric, mockSpeakingNotes, mockSubmitted, mockTimed, mockWriting, ready, state.miniMockAttempts, syncReady]);

  useEffect(() => {
    if (previousPracticeCardIdRef.current === currentCard.id) return;
    previousPracticeCardIdRef.current = currentCard.id;

    const savedDraft = state.writingDrafts.find((entry) => entry.promptId === currentCard.id);
    const savedAttempt = state.speakingAttempts.find((entry) => entry.promptId === currentCard.id);

    if (currentCard.section === 'writing') {
      setWritingDraft(savedDraft?.draft ?? '');
      setWritingRevision(savedDraft?.revision ?? '');
      setSpeakingNotes('');
      setSpeakingRating(3);
      setAudioUrl(undefined);
      setLastSpeakingEvaluation(null);
      setLastWritingEvaluation(null);
      return;
    }

    if (currentCard.section === 'speaking') {
      setWritingDraft('');
      setWritingRevision('');
      setSpeakingNotes(savedAttempt?.notes ?? '');
      setSpeakingRating(savedAttempt?.selfRating ?? 3);
      setAudioUrl(savedAttempt?.audioUrl);
      setLastSpeakingEvaluation(null);
      setLastWritingEvaluation(null);
      return;
    }

    setWritingDraft('');
    setWritingRevision('');
    setSpeakingNotes('');
    setSpeakingRating(3);
    setAudioUrl(undefined);
    setLastSpeakingEvaluation(null);
    setLastWritingEvaluation(null);
  }, [currentCard, state.speakingAttempts, state.writingDrafts]);

  useEffect(() => {
    return () => {
      if (audioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const cleanupRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecordingStartedAt(null);
    setRecording(false);
  }, []);

  useEffect(() => cleanupRecording, [cleanupRecording]);

  useEffect(() => {
    cleanupRecording();
  }, [cleanupRecording, currentCard.id]);

  useEffect(() => {
    const shouldRunClock = (state.onboarded && !state.diagnosticCompleted) || recording || Boolean(mockStartedAt);
    if (!shouldRunClock) return;
    const interval = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [mockStartedAt, recording, state.diagnosticCompleted, state.onboarded]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!state.onboarded || state.diagnosticCompleted) {
      window.localStorage.removeItem(diagnosticStartedAtKey);
      setDiagnosticStartedAt(null);
      return;
    }

    const storedStartedAt = Number(window.localStorage.getItem(diagnosticStartedAtKey));
    const nextStartedAt = Number.isFinite(storedStartedAt) && storedStartedAt > 0 ? storedStartedAt : Date.now();
    window.localStorage.setItem(diagnosticStartedAtKey, String(nextStartedAt));
    setDiagnosticStartedAt(nextStartedAt);
    setClockNow(Date.now());
  }, [state.diagnosticCompleted, state.onboarded]);

  useEffect(() => {
    if (!recording || !recordingStartedAt) return;
    if (elapsedSeconds(recordingStartedAt, clockNow) < speakingRecordingLimitSeconds) return;
    stopRecording();
    setFeedback('Recording stopped at 60 seconds. Review playback, then save the speaking attempt.');
  }, [clockNow, recording, recordingStartedAt]);

  useEffect(() => {
    if (!mockStartedAt || mockElapsed < mockLimitSeconds) return;
    setMockStartedAt(null);
    setMockElapsedSnapshot(mockLimitSeconds);
    setFeedback('Mini mock timer reached the target. Submit now, then repair only what the report shows.');
  }, [mockElapsed, mockLimitSeconds, mockStartedAt]);

  function handleProfileUpdate<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [key]: value,
      },
    }));
  }

  function startCoach() {
    const startedAt = Date.now();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(diagnosticStartedAtKey, String(startedAt));
    }
    setDiagnosticStartedAt(startedAt);
    setClockNow(startedAt);
    setState((prev) => ({ ...prev, onboarded: true }));
    setFeedback('Your TOEFL path is ready. First, we’ll find your fastest score improvement area.');
  }

  function openAccountSignIn() {
    setSignedOutLocally(false);
    openSignIn();
  }

  function openAccountSignUp() {
    setSignedOutLocally(false);
    openSignUp();
  }

  function resetPersonalizedUiState() {
    submittedChoicesRef.current = {};
    restoredMockSelectionRef.current = false;
    mockAutosaveReadyRef.current = false;
    setSubmittedChoices({});
    setDiagnosticIndex(0);
    setDiagnosticChoice(null);
    setCurrentMockId(mockTests[0].id);
    setMockAnswers({});
    setMockNotes('');
    setMockSpeakingNotes('');
    setMockWriting('');
    setMockRubric({});
    setMockSubmitted(false);
    setDiagnosticStartedAt(null);
    setRecordingStartedAt(null);
    setTab('today');
  }

  function continueAsGuest() {
    const existingGuestSession = getGuestSession();
    if (!existingGuestSession) {
      resetState();
      setLocalSyncOwner(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(diagnosticStartedAtKey);
      }
    }
    const nextGuestSession = existingGuestSession ?? createGuestSession();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(guestSessionKey, JSON.stringify(nextGuestSession));
    }
    setSignedOutLocally(false);
    setGuestSession(nextGuestSession);
    const localState = loadState();
    localStateRef.current = localState;
    setState(localState);
    resetPersonalizedUiState();
    setSyncReady(false);
    setSaveStatus('Local');
    setFeedback('Guest mode started. Progress stays on this device until you log in.');
  }

  async function handleSignOut() {
    setSignedOutLocally(true);
    setGuestSession(null);
    clearLocalProgressForAccountExit();
    resetPersonalizedUiState();
    localStateRef.current = initialState;
    setState(initialState);
    setSyncReady(false);
    setSaveStatus('Local');
    setFeedback('Signed out. Log in to restore saved progress, or continue as guest.');
    await signOut({ redirectUrl: '/' });
  }

  function useThreeDaySprint() {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        testDate: dateAfterDays(3),
        dailyMinutes: Math.max(prev.profile.dailyMinutes, 60),
      },
    }));
    setFeedback('3-day sprint mode set. The plan now prioritizes templates, timed speaking, writing structure, mini mock proof, and final repair.');
  }

  function useNextWeekPlan() {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        testDate: dateAfterDays(7),
        dailyMinutes: Math.max(prev.profile.dailyMinutes, 60),
      },
    }));
    setFeedback('Next-week plan set. The app will prioritize proof, repair, and final review without switching into 3-day emergency mode.');
  }

  function submitDiagnostic() {
    if (diagnosticChoice === null || !currentQuestion) return;

    const nextAnswers = { ...state.diagnosticAnswers, [currentQuestion.id]: diagnosticChoice };

    if (diagnosticIndex < currentDiagnosticQuestions.length - 1) {
      setState((prev) => ({ ...prev, diagnosticAnswers: nextAnswers }));
      setDiagnosticIndex((prev) => prev + 1);
      setDiagnosticChoice(nextAnswers[currentDiagnosticQuestions[diagnosticIndex + 1].id] ?? null);
      return;
    }

    const result = scoreDiagnostic(nextAnswers, currentDiagnosticQuestions);
    const streakUpdate = updateStreak(state.lastActiveDate);
    const nextState: AppState = {
      ...state,
      diagnosticAnswers: nextAnswers,
      diagnosticCompleted: true,
      diagnosticFormId: getNextDiagnosticFormId(state.diagnosticFormId),
      sectionScores: result.sectionScores,
      subskillScores: result.subskillScores,
      track: result.track,
      xp: state.xp + 80,
      streak: streakUpdate === 'increment' ? state.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(state.streak, 1),
      lastActiveDate: getLocalDateKey(),
    };

    setState(nextState);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(diagnosticStartedAtKey);
    }
    setDiagnosticStartedAt(null);
    setTab('today');
    setFeedback(buildDiagnosticRepairReveal(result, nextAnswers, currentDiagnosticQuestions));
  }

  function switchDiagnosticForm() {
    const nextFormId = getNextDiagnosticFormId(state.diagnosticFormId);
    setState((prev) => ({
      ...prev,
      diagnosticFormId: nextFormId,
      diagnosticAnswers: {},
    }));
    setDiagnosticIndex(0);
    setDiagnosticChoice(null);
    setFeedback('Fresh diagnostic form loaded. Use this when you already know the previous answers.');
  }

  function selectPracticeCard(card: PracticeCard) {
    cleanupRecording();
    setSection(card.section);
    setSelectedCardId((prev) => ({ ...prev, [card.section]: card.id }));
    setFeedback('');
  }

  function recordObjectiveResult(card: PracticeCard, correct: boolean, notes: string, supported = false) {
    const now = new Date().toISOString();
    const score = correct ? 1 : 0.4;
    const errorEntry = buildErrorEntry(card, correct);
    const reviewCard = buildReviewCard(card);
    const streakUpdate = updateStreak(state.lastActiveDate);
    const metadata = getPracticeCardMetadata(card);
    const alreadyCompletedStrategy = hasCompletedStrategyLayer(state.practiceHistory);

    const nextState: AppState = {
      ...state,
      sectionScores: applyPracticeOutcome(state, card.section, card.subskill, score, supported),
      subskillScores: updateSubskillScores(state.subskillScores, card.subskill, score),
      xp: state.xp + card.xp,
      streak: streakUpdate === 'increment' ? state.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(state.streak, 1),
      lastActiveDate: getLocalDateKey(),
      reviewQueue: [reviewCard, ...state.reviewQueue],
      errorLog: (() => {
        const existingError = state.errorLog.find((entry) => entry.section === card.section && entry.subskill === card.subskill && entry.prompt === card.title && !entry.corrected);
        if (errorEntry) {
          return existingError
            ? state.errorLog.map((entry) =>
                entry === existingError
                  ? { ...entry, repeatCount: entry.repeatCount + 1, lastSeen: now, dueDate: new Date(Date.now() + 86400000).toISOString() }
                  : entry,
              )
            : [errorEntry, ...state.errorLog];
        }

        return state.errorLog.map((entry) =>
          entry.section === card.section && entry.subskill === card.subskill ? { ...entry, corrected: true, lastSeen: now } : entry,
        );
      })(),
      practiceHistory: [
        { id: `${card.id}-${now}`, section: card.section, subskill: card.subskill, score, completedAt: now, notes, supported },
        ...state.practiceHistory,
      ].slice(0, 40),
    };

    setState(nextState);

    const reveal = buildDailyMissionReveal(state, nextState);
    const firstStrategyReveal = !alreadyCompletedStrategy ? buildObjectiveStrategyLayerReveal(card, correct) : '';
    setFeedback(firstStrategyReveal || reveal || (correct ? `Strong work. ${metadata.cue} ${card.explanation}` : `Logged for repair. ${buildRepairNote(metadata)}`));
  }

  function submitChoice(card: PracticeCard, choice: number) {
    if (submittedChoicesRef.current[card.id] !== undefined) return;
    submittedChoicesRef.current = { ...submittedChoicesRef.current, [card.id]: choice };
    setSubmittedChoices((prev) => ({ ...prev, [card.id]: choice }));
    recordObjectiveResult(card, choice === card.answer, `Chose option ${choice + 1}`);
  }

  function submitWriting(card: PracticeCard) {
    if (!writingDraft.trim()) {
      setFeedback('Add a draft before saving the writing attempt.');
      return;
    }
    const evaluation = evaluateWritingAttempt(card, writingDraft, writingRevision);
    const score = evaluation.score;
    const supported = evaluation.band !== 'ready';
    const streakUpdate = updateStreak(state.lastActiveDate);
    const alreadyCompletedStrategy = hasCompletedStrategyLayer(state.practiceHistory);

    const nextState: AppState = {
      ...state,
      sectionScores: applyPracticeOutcome(state, 'writing', card.subskill, score, supported),
      subskillScores: updateSubskillScores(state.subskillScores, card.subskill, score),
      xp: state.xp + card.xp + (writingRevision.trim() ? 8 : 0),
      streak: streakUpdate === 'increment' ? state.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(state.streak, 1),
      lastActiveDate: getLocalDateKey(),
      reviewQueue: [buildReviewCard(card), ...state.reviewQueue],
      practiceHistory: [
        {
          id: `${card.id}-${Date.now()}`,
          section: 'writing' as Section,
          subskill: card.subskill,
          score,
          completedAt: new Date().toISOString(),
          notes: supported ? 'Draft only' : 'Draft and revision',
          supported,
        },
        ...state.practiceHistory,
      ].slice(0, 40),
      writingDrafts: [
        { promptId: card.id, draft: writingDraft, revision: writingRevision, score },
        ...state.writingDrafts.filter((entry) => entry.promptId !== card.id),
      ],
    };

    setState(nextState);

    setLastWritingEvaluation(evaluation);
    const reveal = buildDailyMissionReveal(state, nextState);
    const firstStrategyReveal = !alreadyCompletedStrategy ? buildEvidenceStrategyLayerReveal(card, evaluation, supported) : '';
    setFeedback(firstStrategyReveal || reveal || `${evaluation.summary} Repair: ${evaluation.repairs[0]}`);
  }

  async function startRecording() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setFeedback('Microphone recording is not supported here. You can still self-rate the response.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setRecordingStartedAt(null);
        setRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      const startedAt = Date.now();
      setRecordingStartedAt(startedAt);
      setClockNow(startedAt);
      setRecording(true);
      setFeedback('Recording... keep the answer compact and clear.');
    } catch {
      setFeedback('Microphone access was blocked. Self-rating mode is still available.');
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setRecordingStartedAt(null);
    setRecording(false);
  }

  function playMockListening() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setFeedback('Text-to-speech is not supported in this browser. Reveal the transcript after taking notes.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentMock.listeningScript);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setFeedback('Listening passage playing. Take compact notes before answering.');
  }

  function selectMock(mockId: string) {
    setCurrentMockId(mockId);
    setMockAnswers({});
    setMockNotes('');
    setMockSpeakingNotes('');
    setMockWriting('');
    setMockRubric({});
    setMockSubmitted(false);
    setMockStartedAt(null);
    setMockElapsedSnapshot(0);
    setShowMockTranscript(false);
    setFeedback('');
  }

  function startMockTimer() {
    if (mockSubmitted || mockStartedAt) return;
    const now = Date.now();
    setMockStartedAt(now);
    setClockNow(now);
    setFeedback('Mini mock timer started. Work straight through before checking explanations.');
  }

  function pauseMockTimer() {
    if (!mockStartedAt) return;
    setMockElapsedSnapshot(mockElapsed);
    setMockStartedAt(null);
    setFeedback('Mini mock timer paused. Restart only if you are resuming the same attempt.');
  }

  function resetMockTimer() {
    if (mockSubmitted) return;
    setMockStartedAt(null);
    setMockElapsedSnapshot(0);
    setFeedback('Mini mock timer reset. Start it again when you are ready to work under pressure.');
  }

  function requireSprintPracticeCard(action: Extract<SprintAction | SprintNextAction, { type: 'practice' }>) {
    const card = practiceCards[action.section].find((item) => item.id === action.cardId);
    if (!card) {
      throw new Error(`Sprint action references missing practice card ${action.cardId}.`);
    }
    return card;
  }

  function startSprintNextAction() {
    if (sprintNextAction.type === 'mock') {
      selectMock(sprintNextAction.mockId);
      setTab('path');
      return;
    }

    const card = requireSprintPracticeCard(sprintNextAction);
    selectPracticeCard(card);
    setTab('library');
  }

  function startSprintAction(action: SprintAction) {
    if (action.type === 'mock') {
      selectMock(action.mockId);
      setTab('path');
      return;
    }

    if (action.type === 'review') {
      if (action.section) {
        setSection(action.section);
      }
      setTab('review');
      setFeedback(action.reason);
      return;
    }

    const card = requireSprintPracticeCard(action);
    selectPracticeCard(card);
    setTab('library');
    setFeedback(action.reason);
  }

  function getFirstValidPathAction(day: PathDayView) {
    if (day.status !== 'current' && day.status !== 'available_optional') return undefined;

    if (day.status === 'available_optional') {
      return day.actions[0];
    }

    return day.actions.find((action) => action.type !== 'mock' || miniMockGate.allowed) ?? day.actions[0];
  }

  function startPathDayAction(day: PathDayView) {
    const action = getFirstValidPathAction(day);
    if (!action) return;

    startSprintAction(action);
    if (day.status === 'available_optional') {
      setFeedback(`Optional sprint override opened: ${action.reason}`);
    }
  }

  function getPathDayActionLabel(day: PathDayView) {
    const action = getFirstValidPathAction(day);
    if (!action) return '';
    if (day.status === 'available_optional') return `Optional: ${action.label}`;
    return `Start: ${action.label}`;
  }

  function submitMockTest() {
    if (mockSubmitted || state.miniMockAttempts.find((attempt) => attempt.mockId === currentMock.id)?.submitted) return;
    const evaluation = evaluateMockAttempt(currentMock, mockAnswers, Object.values(mockRubric).filter(Boolean).length, mockSpeakingNotes, mockWriting, hasSpeakingAudioEvidence);
    const now = new Date().toISOString();
    const finalMockElapsed = mockElapsed;
    const finalMockTimed = mockTimed;
    const streakUpdate = updateStreak(state.lastActiveDate);
    const submittedAttempt = buildMiniMockAttempt(
      currentMock.id,
      mockAnswers,
      mockNotes,
      mockSpeakingNotes,
      mockWriting,
      mockRubric,
      true,
      evaluation.overall / 100,
      now,
      finalMockElapsed,
      finalMockTimed,
    );
    const missedRepairCards = currentMock.questions
      .filter((question) => mockAnswers[question.id] !== question.answer)
      .map(mockQuestionToPracticeCard);
    const mockErrorEntries = missedRepairCards
      .map((card) => buildErrorEntry(card, false))
      .filter((entry) => entry !== null);

    let sectionScores = applyPracticeOutcome(state, 'reading', 'mock reading', evaluation.readingScore, true);
    sectionScores = applyPracticeOutcome({ ...state, sectionScores }, 'listening', 'mock listening', evaluation.listeningScore, true);
    sectionScores = applyPracticeOutcome({ ...state, sectionScores }, 'speaking', 'mock speaking', evaluation.speakingScore, true);
    sectionScores = applyPracticeOutcome({ ...state, sectionScores }, 'writing', 'mock writing', evaluation.writingScore, true);

    const nextState: AppState = {
      ...state,
      sectionScores,
      subskillScores: {
        ...state.subskillScores,
        'mock reading': evaluation.readingScore,
        'mock listening': evaluation.listeningScore,
        'mock speaking': evaluation.speakingScore,
        'mock writing': evaluation.writingScore,
      },
      xp: state.xp + 70,
      streak: streakUpdate === 'increment' ? state.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(state.streak, 1),
      lastActiveDate: getLocalDateKey(),
      reviewQueue: [...missedRepairCards.map(buildReviewCard), ...state.reviewQueue],
      errorLog: [...mockErrorEntries, ...state.errorLog],
      miniMockAttempts: upsertMiniMockAttempt(state.miniMockAttempts, submittedAttempt),
      practiceHistory: [
        {
          id: `${currentMock.id}-${now}`,
          section: 'listening' as Section,
          subskill: 'mini mock',
          score: evaluation.overall / 100,
          completedAt: now,
          notes: `${evaluation.objectiveCorrect}/${evaluation.objectiveTotal} objective; speaking checklist ${Object.values(mockRubric).filter(Boolean).length}/3; speaking audio ${hasSpeakingAudioEvidence ? 'yes' : 'no'}; writing ${evaluation.writingWords} words; timer ${finalMockTimed ? formatElapsedSeconds(finalMockElapsed) : 'not used'}.`,
          supported: true,
        },
        ...state.practiceHistory,
      ].slice(0, 40),
    };

    setState(nextState);
    setMockSubmitted(true);
    setMockStartedAt(null);
    setMockElapsedSnapshot(finalMockElapsed);
    const firstMiniMockSubmission = state.miniMockAttempts.every((attempt) => !attempt.submitted);
    setFeedback(firstMiniMockSubmission
      ? 'Your readiness report is unlocked. This is not an official TOEFL score, but it shows your current evidence level.'
      : `Mini mock saved. Completion signal: ${evaluation.overall}/100. ${evaluation.feedback} Repair rule: ${currentMockMetadata.repairRule}`);
  }

  function submitSpeaking(card: PracticeCard) {
    const evaluation = evaluateSpeakingAttempt(card, speakingRating, speakingNotes, Boolean(audioUrl));
    const score = evaluation.score;
    const supported = evaluation.band !== 'ready';
    const streakUpdate = updateStreak(state.lastActiveDate);
    const alreadyCompletedStrategy = hasCompletedStrategyLayer(state.practiceHistory);

    const nextState: AppState = {
      ...state,
      sectionScores: applyPracticeOutcome(state, 'speaking', card.subskill, score, supported),
      subskillScores: updateSubskillScores(state.subskillScores, card.subskill, score),
      xp: state.xp + card.xp,
      streak: streakUpdate === 'increment' ? state.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(state.streak, 1),
      lastActiveDate: getLocalDateKey(),
      reviewQueue: [buildReviewCard(card), ...state.reviewQueue],
      practiceHistory: [
        {
          id: `${card.id}-${Date.now()}`,
          section: 'speaking' as Section,
          subskill: card.subskill,
          score,
          completedAt: new Date().toISOString(),
          notes: speakingNotes,
          supported,
        },
        ...state.practiceHistory,
      ].slice(0, 40),
      speakingAttempts: [
        { promptId: card.id, selfRating: speakingRating, notes: speakingNotes, hasAudioEvidence: Boolean(audioUrl) },
        ...state.speakingAttempts.filter((entry) => entry.promptId !== card.id),
      ],
    };

    setState(nextState);

    setLastSpeakingEvaluation(evaluation);
    const reveal = buildDailyMissionReveal(state, nextState);
    const firstStrategyReveal = !alreadyCompletedStrategy ? buildEvidenceStrategyLayerReveal(card, evaluation, supported) : '';
    setFeedback(firstStrategyReveal || reveal || `${evaluation.summary} Repair: ${evaluation.repairs[0]}`);
  }

  function handleReview(card: ReviewCard, remembered: boolean) {
    setState((prev) => ({
      ...prev,
      reviewQueue: prev.reviewQueue.map((entry) =>
        entry.id === card.id
          ? {
              ...entry,
              dueDate: new Date(Date.now() + nextInterval(entry.interval, remembered) * 86400000).toISOString(),
              interval: nextInterval(entry.interval, remembered),
            }
          : entry,
      ),
      xp: prev.xp + (remembered ? 8 : 4),
      errorLog: prev.errorLog.map((entry) =>
        entry.section === card.section && entry.subskill === card.subskill
          ? { ...entry, corrected: remembered ? true : entry.corrected, repeatCount: remembered ? entry.repeatCount : entry.repeatCount + 1 }
          : entry,
      ),
    }));
    setFeedback(remembered ? 'Review rescheduled farther out.' : 'Marked shaky. It will come back soon.');
  }

  async function clearAllData() {
    if (typeof window !== 'undefined' && !window.confirm('Reset all TOEFL 120 Coach progress on this device and synced cloud account?')) {
      return;
    }
    resetState();
    if (isSignedIn) {
      await deleteConvexData().catch(() => undefined);
    }
    submittedChoicesRef.current = {};
    restoredMockSelectionRef.current = false;
    mockAutosaveReadyRef.current = false;
    setState(initialState);
    setSubmittedChoices({});
    setDiagnosticIndex(0);
    setDiagnosticChoice(null);
    setCurrentMockId(mockTests[0].id);
    setMockAnswers({});
    setMockNotes('');
    setMockSpeakingNotes('');
    setMockWriting('');
    setMockRubric({});
    setMockSubmitted(false);
    setDiagnosticStartedAt(null);
    setRecordingStartedAt(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(diagnosticStartedAtKey);
    }
    setTab('today');
    setFeedback('Progress cleared.');
  }

  function exportProgress() {
    const url = URL.createObjectURL(new Blob([progressBackupText], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `toefl-120-coach-backup-${getLocalDateKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback('Progress backup exported.');
  }

  function exportReadinessReport() {
    const url = URL.createObjectURL(new Blob([learnerReadinessReportText], { type: 'text/plain' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `toefl-120-readiness-report-${getLocalDateKey()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback('Readiness report exported.');
  }

  function exportFinalTemplateSheet() {
    const url = URL.createObjectURL(new Blob([finalTemplateSheetText], { type: 'text/plain' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `toefl-120-final-template-sheet-${getLocalDateKey()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback('Final template sheet exported.');
  }

  function setLaunchSmokeCheck(key: LaunchSmokeCheckKey, done: boolean) {
    const next = {
      ...launchSmokeChecks,
      [key]: done ? { done: true, checkedAt: new Date().toISOString() } : { done: false },
    };
    setLaunchSmokeChecks(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(launchSmokeChecksKey, JSON.stringify(next));
    }
    setFeedback(done ? 'Launch smoke check marked complete.' : 'Launch smoke check marked pending.');
  }

  async function restoreProgressBackup(rawBackup: string) {
    try {
      const importedState = parseProgressBackup(rawBackup);
      submittedChoicesRef.current = {};
      restoredMockSelectionRef.current = false;
      mockAutosaveReadyRef.current = false;
      setSubmittedChoices({});
      setState(importedState);
      saveState(importedState);
      if (isSignedIn) {
        await saveConvexState({ schemaVersion: 1, state: toPersistableState(importedState) });
      }
      setBackupImportText('');
      setFeedback(isSignedIn ? 'Progress backup imported and synced.' : 'Progress backup imported on this device.');
    } catch {
      setFeedback('That backup file could not be imported. Use a TOEFL 120 Coach JSON export.');
    }
  }

  async function importProgress(file: File) {
    try {
      await restoreProgressBackup(await file.text());
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  async function importBackupText() {
    if (!backupImportText.trim()) {
      setFeedback('Paste a TOEFL 120 Coach JSON backup before importing.');
      return;
    }
    await restoreProgressBackup(backupImportText);
  }

  useEffect(() => {
    if (!currentQuestion) return;
    setDiagnosticChoice(state.diagnosticAnswers[currentQuestion.id] ?? null);
  }, [currentQuestion, state.diagnosticAnswers]);

  if (!ready) {
    return <div className="shell"><div className="hero">Loading TOEFL 120 Coach...</div></div>;
  }

  const diagnosticProgress = Math.round((Object.keys(state.diagnosticAnswers).length / currentDiagnosticQuestions.length) * 100);
  const selectedObjectiveChoice = submittedChoices[currentCard.id];
  const writingWordCount = countWords(writingDraft);
  const revisionWordCount = countWords(writingRevision);
  const diagnosticElapsed = elapsedSeconds(diagnosticStartedAt, clockNow);
  const recordingElapsed = elapsedSeconds(recordingStartedAt, clockNow);
  const firstRecommendedSection = dailyPlan[0]?.section ?? 'reading';
  const firstRecommendedCard = prioritizePracticeCards(state, firstRecommendedSection)[0] ?? practiceCards[firstRecommendedSection][0];
  const firstRecommendedMetadata = getPracticeCardMetadata(firstRecommendedCard);
  const firstRecommendedReason = dailyPlan[0]?.reason ?? firstRecommendedMetadata.repairRule;
  const relatedPracticeCards = orderedPracticeCards
    .filter((card) => card.id !== currentCard.id && card.id !== firstRecommendedCard.id)
    .slice(0, 3);
  const learnerName = authState.status === 'unauthenticated'
    ? 'Signed out'
    : authState.status === 'guest'
      ? 'Guest learner'
      : state.profile.name.trim() || 'Beta learner';
  const dataMode = authState.status === 'authenticated'
    ? 'Cloud sync'
    : authState.status === 'guest'
      ? 'Guest mode'
      : authState.status === 'unauthenticated'
        ? 'Signed out'
        : 'Checking account';
  const dataModeClass = authState.status === 'authenticated'
    ? 'cloud'
    : authState.status === 'guest'
      ? 'local'
      : authState.status === 'unauthenticated'
        ? 'signedOut'
        : 'loading';
  const saveStatusClass = saveStatus.toLowerCase();
  const workflow = getFirstUserLoopSteps(state);
  const shouldBlockPersonalizedContent = authState.status === 'loading' || authState.status === 'unauthenticated';
  const authControls = (
    <div className="chips authControls">
      {authState.status === 'loading' && <span className="chip">Checking account</span>}
      {authState.status === 'authenticated' && (
        <>
          <UserButton afterSignOutUrl="/" />
          <button className="secondary compactButton" onClick={handleSignOut}>Logout</button>
        </>
      )}
      {authState.status === 'guest' && (
        <>
          <span className="pill-warn">Guest</span>
          <button className="secondary compactButton" onClick={openAccountSignIn}>Log In</button>
          <button className="cta compactButton" onClick={openAccountSignUp}>Create Account</button>
        </>
      )}
      {authState.status === 'unauthenticated' && (
        <>
          <button className="secondary compactButton" onClick={openAccountSignIn}>Log In</button>
          <button className="ghost compactButton" onClick={continueAsGuest}>Continue as Guest</button>
          <button className="cta compactButton" onClick={openAccountSignUp}>Create Account</button>
        </>
      )}
    </div>
  );
  const signedOutPrompt = (
    <section className="panel stack authPrompt" aria-label="Signed out prompt">
      <div className="stack">
        <span className="kicker">{authState.status === 'loading' ? 'Checking account' : 'Signed out'}</span>
        <h2>{authState.status === 'loading' ? 'Checking your account state.' : 'You are currently signed out.'}</h2>
        <p className="copy">
          {authState.status === 'loading'
            ? 'Personalized progress is hidden until account state is confirmed.'
            : 'Log in to continue your saved TOEFL path, or continue as guest for a local preview.'}
        </p>
      </div>
      {authState.status === 'unauthenticated' && (
        <div className="chips centerActions">
          <button className="cta" onClick={openAccountSignIn}>Log In</button>
          <button className="secondary" onClick={continueAsGuest}>Continue as Guest</button>
          <button className="ghost" onClick={openAccountSignUp}>Create Account</button>
        </div>
      )}
    </section>
  );
  const guestBanner = authState.status === 'guest' ? (
    <section className="sectionCard row guestBanner" aria-label="Guest mode">
      <p className="copy">Guest mode: your progress stays on this device. Log in to save your TOEFL path across browsers.</p>
      <div className="chips">
        <button className="secondary compactButton" onClick={openAccountSignIn}>Log In</button>
        <button className="cta compactButton" onClick={openAccountSignUp}>Create Account</button>
      </div>
    </section>
  ) : null;
  const personalProofGatePanel = (
    <div className="panel stack">
      <div className="row">
        <div>
          <span className="kicker">Personal proof gate</span>
          <h2>{personalProofGate.label}</h2>
          <p className="copy">{personalProofGate.detail}</p>
        </div>
        <span className={personalProofGate.ready ? 'pill-good' : 'pill-warn'}>
          {personalProofGate.ready ? 'Ready for your test week' : 'Needs proof'}
        </span>
      </div>
      <div className="chips">
        {personalProofGate.missing.length
          ? personalProofGate.missing.map((item) => <span className="pill-warn" key={item}>{item}</span>)
          : <span className="pill-good">Local proof-of-concept loop complete</span>}
      </div>
    </div>
  );
  const testWeekCommandPanel = (
    <div className="sectionCard stack">
      <div className="row">
        <span className={testWeekCommand.status === 'final-review' ? 'pill-good' : testWeekCommand.status === 'needs-proof' ? 'pill-bad' : 'pill-warn'}>
          Test-week command
        </span>
        <span className="mini">{testWeekCommand.status}</span>
      </div>
      <h3>{testWeekCommand.label}</h3>
      <p className="copy">Do now: {testWeekCommand.primaryAction}</p>
      <p className="copy">Why: {testWeekCommand.reason}</p>
      <p className="mini">Stop rule: {testWeekCommand.stopRule}</p>
    </div>
  );

  return (
    <main className="shell appWorkspace">
      <aside className="sidebar stack" aria-label="Workspace context">
        <div className="brandBlock">
          <span className="brandMark">120</span>
          <div>
            <span className="kicker">TOEFL coach</span>
            <h1>TOEFL 120</h1>
          </div>
        </div>
        <div className="sidebarPanel stack">
          <div>
            <span className="mini">Learner</span>
            <strong>{learnerName}</strong>
          </div>
          <div className="statusLine"><span className={`statusDot ${dataModeClass}`} />{dataMode}</div>
          <div className="chips">
            <span className={getStatusPill(readiness / 100)}>Readiness {readiness}</span>
            <span className={`chip saveChip ${saveStatusClass}`}>Save {saveStatus}</span>
          </div>
        </div>
        {!shouldBlockPersonalizedContent && state.diagnosticCompleted && (
          <nav className="tabs" aria-label="Primary">
            {tabs.map((item) => (
              <button key={item.key} className={`tab ${tab === item.key ? 'active' : ''}`} aria-current={tab === item.key ? 'page' : undefined} onClick={() => setTab(item.key)}>
                {item.label}
              </button>
            ))}
          </nav>
        )}
        <div className="sidebarPanel stack">
          <span className="mini">Progress controls</span>
          {authControls}
          {!shouldBlockPersonalizedContent && (
            <div className="chips">
              <button className="ghost compactButton" onClick={exportProgress}>Export</button>
              <button className="secondary compactButton" onClick={() => importInputRef.current?.click()}>Import backup</button>
            </div>
          )}
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importProgress(file);
          }}
        />
      </aside>

      <div className="workspaceMain stack">
        <section className="hero stack">
          <div className="row">
            <div className="stack" style={{ gap: 10 }}>
              <span className="kicker">Private beta workspace</span>
              <h2 className="pageTitle">{state.diagnosticCompleted ? 'Today’s TOEFL work' : state.onboarded ? 'Strategy diagnostic' : 'Profile setup'}</h2>
              <p className="copy">Profile, diagnostic, review, exact next drill, and saved progress stay visible as one learner loop.</p>
            </div>
            <div className="chips">
              {authControls}
              {!shouldBlockPersonalizedContent && (
                <>
                  <span className="pill-good">{sprintMode}</span>
                  <span className="chip">Track {state.track}</span>
                  <span className="chip">Target {state.profile.targetScore}</span>
                  <span className="chip">XP {state.xp}</span>
                  <span className="chip">Streak {state.streak} day</span>
                </>
              )}
            </div>
          </div>
          {!shouldBlockPersonalizedContent && (
            <div className="workflowLane" aria-label="First user-ready loop">
              {workflow.map((step) => (
                <div className={`workflowStep ${step.status.toLowerCase()}`} key={step.label}>
                  <span>{step.label}</span>
                  <strong>{step.status}</strong>
                </div>
              ))}
            </div>
          )}
          {!shouldBlockPersonalizedContent && tab !== 'today' && (
            <div className="grid four">
              {sectionOrder.map((item) => (
                <div className="stat" key={item}>
                  <span className="mini">{sectionLabels[item]}</span>
                  <strong>{formatPercent(state.sectionScores[item])}</strong>
                  <div className="progressBar"><span style={{ width: formatPercent(state.sectionScores[item]) }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>

      {shouldBlockPersonalizedContent ? (
        signedOutPrompt
      ) : (
        <>
          {guestBanner}
          {!state.onboarded ? (
        <section className="panel stack">
          <div>
            <h2>1. Onboarding</h2>
            <p className="copy">Set your target so the plan can adapt to urgency, confidence, and available minutes. Beta learners should sign in before serious practice so progress syncs across devices.</p>
          </div>
          {!isSignedIn && (
            <div className="sectionCard row">
              <p className="copy">Guest mode is for preview only. Beta users should sign in with the same email they use for support, sync, deletion, and scoring questions.</p>
              <button className="secondary" onClick={openAccountSignIn}>Create beta account / Sign in</button>
            </div>
          )}
          {authLoaded && isSignedIn && (
            <div className="sectionCard row">
              <p className="copy">Signed in. Your onboarding and practice progress will sync after each save.</p>
              <div className="chips">
                <button className="danger" onClick={clearAllData}>Reset data</button>
                <UserButton afterSignOutUrl="/" />
                <button className="secondary compactButton" onClick={handleSignOut}>Sign out / switch account</button>
              </div>
            </div>
          )}
          <div className="grid two">
            <label className="stack"><span>Name</span><input value={state.profile.name} onChange={(e) => handleProfileUpdate('name', e.target.value)} /></label>
            <label className="stack"><span>Target score</span><input type="number" inputMode="numeric" min={80} max={120} value={state.profile.targetScore} onChange={(e) => handleProfileUpdate('targetScore', normalizeNumber(e.target.value, state.profile.targetScore, 80, 120))} /></label>
            <label className="stack"><span>Target test date</span><input type="date" value={state.profile.testDate} onChange={(e) => handleProfileUpdate('testDate', e.target.value)} /></label>
            <label className="stack"><span>Daily minutes</span><input type="number" inputMode="numeric" min={20} max={240} value={state.profile.dailyMinutes} onChange={(e) => handleProfileUpdate('dailyMinutes', normalizeNumber(e.target.value, state.profile.dailyMinutes, 20, 240))} /></label>
          </div>
          <div className="sectionCard row">
            <p className="copy">Test this week? Switch the plan into a 3-day sprint with at least 60 minutes per day.</p>
            <button className="secondary" onClick={useThreeDaySprint}>Use 3-day sprint</button>
          </div>
          <div className="grid two">
            {sectionOrder.map((item) => (
              <label key={item} className="stack">
                <span>{sectionLabels[item]} confidence (0-5)</span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={state.profile.confidence[item]}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      profile: {
                        ...prev.profile,
                        confidence: { ...prev.profile.confidence, [item]: Number(e.target.value) },
                      },
                    }))
                  }
                />
                <span className="mini">{state.profile.confidence[item]} / 5</span>
              </label>
            ))}
          </div>
          <button className="cta" onClick={startCoach}>Save profile and start diagnostic</button>
        </section>
      ) : !state.diagnosticCompleted ? (
        <section className="panel stack">
            <div className="row">
              <div className="stack" style={{ gap: 6 }}>
                <h2>2. Strategy diagnostic</h2>
                <p className="copy">Short baseline of TOEFL strategy knowledge. Add mock speaking and writing evidence before trusting readiness.</p>
              </div>
            <div className="chips">
              <span className="chip">{diagnosticProgress}% complete</span>
              <span className="chip">Time {formatElapsedSeconds(diagnosticElapsed)}</span>
              <button className="secondary compactButton" onClick={switchDiagnosticForm}>I know these questions — use fresh form</button>
            </div>
            </div>
          <div className="progressBar"><span style={{ width: `${Math.max(12, diagnosticProgress)}%` }} /></div>
          {currentQuestion && (
            <div className="sectionCard stack">
              <div className="row">
                <span className="chip">{sectionLabels[currentQuestion.section]}</span>
                <span className="mini">{currentQuestion.subskill}</span>
              </div>
              <h3>{currentQuestion.prompt}</h3>
              <div className="optionList">
                {currentQuestion.options.map((option, index) => (
                  <button key={option} className={`option ${diagnosticChoice === index ? 'selected' : ''}`} aria-pressed={diagnosticChoice === index} onClick={() => setDiagnosticChoice(index)}>
                    {option}
                  </button>
                ))}
              </div>
              <button className="cta" disabled={diagnosticChoice === null} onClick={submitDiagnostic}>{diagnosticIndex < currentDiagnosticQuestions.length - 1 ? 'Next question' : 'Finish diagnostic'}</button>
            </div>
          )}
        </section>
      ) : (
        <>
          {tab === 'today' && (
            <section className="stack">
              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Current coaching step</span>
                    <h2>Today&apos;s mission</h2>
                    <p className="copy">One required proof point comes first. The full path, readiness, and library stay secondary.</p>
                  </div>
                  <div className="chips">
                    <span className="pill-good">Day {todayMission.day}</span>
                    <span className="chip">{todayMission.minutes} min</span>
                    <span className="chip">{todayMission.focusLabel}</span>
                  </div>
                </div>

                <div className="sectionCard stack">
                  <div className="row">
                    <div className="stack" style={{ gap: 6 }}>
                      <span className="pill-good">Today&apos;s mission</span>
                      <h3>{todayMission.title}</h3>
                    </div>
                    <span className="mini">Focus: {todayMission.focusLabel}</span>
                  </div>
                  <p className="copy">Why this matters: {todayMission.why}</p>
                  <div className="chips" aria-label="Completion checklist">
                    {todayMission.checklist.map((item) => (
                      <span className={item.done ? 'pill-good' : 'pill-warn'} key={item.label}>{item.done ? 'Done' : 'Next'}: {item.label}</span>
                    ))}
                  </div>
                  {todayMission.action && (
                    <button className="cta" onClick={() => startSprintAction(todayMission.action!)}>{todayMission.primaryActionLabel}</button>
                  )}
                  <p className="mini">Coach note: {todayMission.coachNote}</p>
                </div>

                <div className="sectionCard stack">
                  {todayMission.tomorrow ? (
                    <>
                      <div className="row">
                        <span className={todayMission.tomorrow.status === 'locked' ? 'chip' : 'pill-warn'}>Tomorrow preview</span>
                        <span className="mini">Day {todayMission.tomorrow.day} • {todayMission.tomorrow.minutes} min</span>
                      </div>
                      <h3>{todayMission.tomorrow.title}</h3>
                      <p className="copy">{todayMission.tomorrow.unlockReason}</p>
                    </>
                  ) : (
                    <>
                      <div className="row">
                        <span className="chip">Tomorrow preview</span>
                        <span className="mini">After this mission</span>
                      </div>
                      <h3>Review proof and protect the score</h3>
                      <p className="copy">Check readiness, revisit saved repairs, and avoid adding new heavy work unless the evidence asks for it.</p>
                    </>
                  )}
                </div>

                <div className="chips">
                  <button className="secondary compactButton" onClick={() => setTab('path')}>View full path</button>
                  <button className="ghost compactButton" onClick={() => setTab('progress')}>See readiness</button>
                  <button className="ghost compactButton" onClick={() => setTab('library')}>Open practice library</button>
                </div>
              </div>

              <section className="panel stack">
                <div className="sectionHeader">
                  <div>
                    <p className="eyebrow">Strategy Layer</p>
                    <h2>High-score habits</h2>
                    <p className="copy">
                      120-style prep with 2026 readiness notes. These cards teach transferable TOEFL skills without pretending this is an official 2026 simulator.
                    </p>
                  </div>
                </div>

                <div className="grid two">
                  {strategyLayerCards.map((card) => {
                    const metadata = getPracticeCardMetadata(card);

                    return (
                      <button
                        key={card.id}
                        className="sectionCard stack"
                        onClick={() => {
                          selectPracticeCard(card);
                          setTab('library');
                        }}
                      >
                        <span className="chip">{sectionLabels[card.section]}</span>
                        <h3>{card.title}</h3>
                        <p className="copy">{metadata.cue}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </section>
          )}

          {tab === 'library' && (
            <section className="stack">
              <div className="sectionCard row">
                <p className="copy">Library access: {fullLibraryGate.reason}</p>
                <span className={fullLibraryGate.allowed ? 'pill-good' : 'pill-warn'}>{fullLibraryGate.status}</span>
              </div>
              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Recommended now</span>
                    <h2>{firstRecommendedCard.title}</h2>
                    <p className="copy">Why this is recommended: {firstRecommendedReason}</p>
                  </div>
                  <div className="chips">
                    <span className="pill-good">{sectionLabels[firstRecommendedCard.section]}</span>
                    <span className="chip">{firstRecommendedMetadata.questionType}</span>
                    <span className="chip">Strategy {firstRecommendedMetadata.strategyCardId}</span>
                  </div>
                </div>
                <div className="sectionCard stack">
                  <div className="row">
                    <span className="mini">{firstRecommendedMetadata.difficultyBand} • {Math.round(firstRecommendedMetadata.timingSeconds / 60)} min target</span>
                    <span className="mini">+{firstRecommendedCard.xp} XP</span>
                  </div>
                  <p>{firstRecommendedMetadata.cue}</p>
                  <p className="copy">{firstRecommendedCard.prompt}</p>
                  <button className="cta" onClick={() => selectPracticeCard(firstRecommendedCard)}>Start recommended drill</button>
                </div>
              </div>

              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Current repair drill</span>
                    <h2>{currentCard.title}</h2>
                    <p className="copy">{currentCard.prompt}</p>
                  </div>
                  <div className="chips">
                    <span className="chip">{sectionLabels[currentCard.section]}</span>
                    <span className="chip">{currentCardMetadata.questionType}</span>
                    <span className="chip">{currentCardMetadata.difficultyBand}</span>
                  </div>
                </div>
                <div className="sectionCard stack">
                  <div className="row">
                    <span className="mini">Strategy {currentCardMetadata.strategyCardId}</span>
                    <span className="mini">{Math.round(currentCardMetadata.timingSeconds / 60)} min target</span>
                  </div>
                  {isStrategyLayerCard(currentCard.id) ? (
                    <div className="subPanel stack">
                      <strong>2026 readiness note</strong>
                      <p>{currentCardMetadata.cue}</p>
                    </div>
                  ) : (
                    <p>{currentCardMetadata.cue}</p>
                  )}
                  <p className="copy">Watch for: {currentCardMetadata.traps.join('; ')}.</p>
                </div>

                {currentCard.choices ? (
                  <div className="optionList">
                    {currentCard.choices.map((choice, index) => (
                      <button
                        key={choice}
                        className={`option ${selectedObjectiveChoice === index ? 'selected' : ''} ${selectedObjectiveChoice !== undefined && currentCard.answer === index ? 'correct' : ''}`}
                        disabled={selectedObjectiveChoice !== undefined}
                        aria-pressed={selectedObjectiveChoice === index}
                        onClick={() => submitChoice(currentCard, index)}
                      >
                        {choice}
                      </button>
                    ))}
                    {selectedObjectiveChoice !== undefined && (
                      <p className="copy">Answered. Correct choice: {(currentCard.answer ?? 0) + 1}. Choose another card to continue.</p>
                    )}
                  </div>
                ) : currentCard.section === 'writing' ? (
                  <div className="stack">
                    <div className="stack">
                      <label htmlFor="practice-writing-draft">Draft</label>
                      <textarea
                        id="practice-writing-draft"
                        data-testid="practice-writing-draft"
                        value={writingDraft}
                        onChange={(e) => setWritingDraft(e.target.value)}
                        placeholder="Write your TOEFL response here..."
                      />
                    </div>
                    <div className="chips"><span className="chip">{writingWordCount} words</span><span className="chip">Target depends on task: 120-240</span></div>
                    <div className="stack">
                      <label htmlFor="practice-writing-revision">Revision pass</label>
                      <textarea
                        id="practice-writing-revision"
                        data-testid="practice-writing-revision"
                        value={writingRevision}
                        onChange={(e) => setWritingRevision(e.target.value)}
                        placeholder="Revise for clearer structure, stronger support, and cleaner transitions..."
                      />
                    </div>
                    <div className="chips"><span className="chip">{revisionWordCount} revision words</span><span className="chip">Autosaves after submit</span></div>
                    <button className="cta" disabled={!writingDraft.trim()} onClick={() => submitWriting(currentCard)}>Save writing response</button>
                    {lastWritingEvaluation && (
                      <div className="sectionCard stack">
                        <div className="row">
                          <h3>Writing score signal</h3>
                          <span className={lastWritingEvaluation.band === 'ready' ? 'pill-good' : 'pill-warn'}>{Math.round(lastWritingEvaluation.score * 100)}/100 • {lastWritingEvaluation.band}</span>
                        </div>
                        <p className="copy">{lastWritingEvaluation.summary}</p>
                        <div className="grid two">
                          <div className="stack">
                            <span className="mini">Strengths</span>
                            {lastWritingEvaluation.strengths.map((item) => <p className="copy" key={item}>- {item}</p>)}
                          </div>
                          <div className="stack">
                            <span className="mini">Repairs</span>
                            {lastWritingEvaluation.repairs.map((item) => <p className="copy" key={item}>- {item}</p>)}
                          </div>
                        </div>
                        <div className="stack">
                          <span className="mini">Proof checks</span>
                          {lastWritingEvaluation.proofChecks.map((item) => (
                            <div className="row" key={item.label}>
                              <span>{item.label}</span>
                              <span className={item.passed ? 'pill-good' : 'pill-warn'}>{item.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="stack">
                    <div className="row">
                      <button className={recording ? 'secondary' : 'ghost'} onClick={recording ? stopRecording : startRecording}>{recording ? 'Stop recording' : 'Start recording'}</button>
                      <span className="mini">
                        {recording
                          ? `Recording ${formatElapsedSeconds(recordingElapsed)} / ${formatElapsedSeconds(speakingRecordingLimitSeconds)}`
                          : `Browser mic capture when supported. Limit ${formatElapsedSeconds(speakingRecordingLimitSeconds)}`}
                      </span>
                    </div>
                    {audioUrl && <audio controls src={audioUrl} />}
                    <label className="stack"><span>Self-rating (1-5)</span><input type="range" min={1} max={5} value={speakingRating} onChange={(e) => setSpeakingRating(Number(e.target.value))} /><span className="mini">{speakingRating} / 5</span></label>
                    <div className="stack">
                      <label htmlFor="practice-speaking-reflection">Reflection note</label>
                      <textarea
                        id="practice-speaking-reflection"
                        data-testid="practice-speaking-reflection"
                        value={speakingNotes}
                        onChange={(e) => setSpeakingNotes(e.target.value)}
                        placeholder="Example: intro too long, example was clear, pronunciation broke on two words..."
                      />
                    </div>
                    <button className="cta" onClick={() => submitSpeaking(currentCard)}>Save speaking attempt</button>
                    {lastSpeakingEvaluation && (
                      <div className="sectionCard stack">
                        <div className="row">
                          <h3>Speaking score signal</h3>
                          <span className={lastSpeakingEvaluation.band === 'ready' ? 'pill-good' : 'pill-warn'}>{Math.round(lastSpeakingEvaluation.score * 100)}/100 • {lastSpeakingEvaluation.band}</span>
                        </div>
                        <p className="copy">{lastSpeakingEvaluation.summary}</p>
                        <div className="grid two">
                          <div className="stack">
                            <span className="mini">Strengths</span>
                            {lastSpeakingEvaluation.strengths.map((item) => <p className="copy" key={item}>- {item}</p>)}
                          </div>
                          <div className="stack">
                            <span className="mini">Repairs</span>
                            {lastSpeakingEvaluation.repairs.map((item) => <p className="copy" key={item}>- {item}</p>)}
                          </div>
                        </div>
                        <div className="stack">
                          <span className="mini">Proof checks</span>
                          {lastSpeakingEvaluation.proofChecks.map((item) => (
                            <div className="row" key={item.label}>
                              <span>{item.label}</span>
                              <span className={item.passed ? 'pill-good' : 'pill-warn'}>{item.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="sectionCard stack">
                  <span className="mini">Review and repair</span>
                  <p>{currentCard.explanation}</p>
                  <p className="copy">Repair: {currentCardMetadata.repairRule}</p>
                  {currentCard.followUp && <p className="copy">Follow-up: {currentCard.followUp}</p>}
                </div>
              </div>

              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Optional related practice</span>
                    <h2>Small next set</h2>
                    <p className="copy">Use these only if the current repair feels stable.</p>
                  </div>
                  <span className="chip">{relatedPracticeCards.length} cards</span>
                </div>
                <div className="grid two">
                  {relatedPracticeCards.map((card) => {
                    const metadata = getPracticeCardMetadata(card);
                    return (
                      <button key={card.id} className="sectionCard stack" onClick={() => selectPracticeCard(card)}>
                        <div className="row">
                          <span className="chip">{metadata.questionType}</span>
                          <span className="mini">+{card.xp} XP • {metadata.difficultyBand}</span>
                        </div>
                        <h3>{card.title}</h3>
                        <p className="copy">{metadata.cue}</p>
                        <p className="mini">Approved seed • Strategy {metadata.strategyCardId}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Explore all practice</span>
                    <h2>Full library</h2>
                    <p className="copy">{fullLibraryGate.allowed ? 'Open this when you want broader section practice.' : fullLibraryGate.reason}</p>
                  </div>
                  <div className="chips">
                    <span className={fullLibraryGate.allowed ? 'pill-good' : 'pill-warn'}>{fullLibraryGate.status}</span>
                    <button className="secondary compactButton" disabled={!fullLibraryGate.allowed} onClick={() => setShowFullLibrary((value) => !value)}>
                      {showFullLibrary ? 'Hide all practice' : 'Explore all practice'}
                    </button>
                  </div>
                </div>

                {!fullLibraryGate.allowed && <p className="copy">{fullLibraryGate.reason}</p>}

                {fullLibraryGate.allowed && showFullLibrary && (
                  <div className="stack">
                    <div className="sectionCard stack">
                      <div className="row">
                        <div>
                          <span className="kicker">Test-week playbook</span>
                          <h3>{currentPlaybook.title}</h3>
                          <p className="copy">{currentPlaybook.testShape}</p>
                        </div>
                        <span className="pill-good">{sectionLabels[section]}</span>
                      </div>
                      <div className="grid two">
                        <div className="stack">
                          <h3>Win condition</h3>
                          <p>{currentPlaybook.winCondition}</p>
                          <h3>Note format</h3>
                          {currentPlaybook.noteFormat.map((item) => <p className="copy" key={item}>- {item}</p>)}
                        </div>
                        <div className="stack">
                          <h3>Template</h3>
                          {currentPlaybook.template.map((item, index) => <p className="copy" key={item}>{index + 1}. {item}</p>)}
                        </div>
                      </div>
                      <div className="grid two">
                        <div className="stack">
                          <h3>Common traps</h3>
                          {currentPlaybook.traps.map((trap) => <span className="pill-warn" key={trap}>{trap}</span>)}
                        </div>
                        <div className="stack">
                          <h3>Timed drills</h3>
                          {currentPlaybook.drills.map((drill) => <p className="copy" key={drill}>- {drill}</p>)}
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div>
                        <h3>Practice by section</h3>
                        <p className="copy">Broader TOEFL-style exposure with local-first scoring. Cards are reordered toward weaker and less-practiced subskills first.</p>
                      </div>
                      <div className="chips">
                        {sectionOrder.map((item) => (
                          <button key={item} className={`segmentButton ${section === item ? 'active' : ''}`} aria-pressed={section === item} onClick={() => setSection(item)}>{sectionLabels[item]}</button>
                        ))}
                        <span className="chip">{orderedPracticeCards.length} cards</span>
                      </div>
                    </div>
                    <div className="grid two">
                      {orderedPracticeCards.map((card) => {
                        const metadata = getPracticeCardMetadata(card);
                        return (
                          <button key={card.id} className={`sectionCard stack ${card.id === currentCard.id ? 'selectedCard' : ''}`} aria-pressed={card.id === currentCard.id} onClick={() => selectPracticeCard(card)}>
                            <div className="row">
                              <span className="chip">{metadata.questionType}</span>
                              <span className="mini">+{card.xp} XP • {metadata.difficultyBand}</span>
                            </div>
                            <div className="row">
                              <h3>{card.title}</h3>
                              {recommendedDrillIds.has(card.id) && <span className="pill-warn">Recommended first</span>}
                            </div>
                            <p className="copy">{metadata.cue}</p>
                            <p className="mini">Approved seed • Strategy {metadata.strategyCardId}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {tab === 'path' && (
            <section className="stack">
              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Path</span>
                    <h2>Current path</h2>
                    <p className="copy">Locked future days stay visible. Complete today’s mission to unlock the next step.</p>
                    <p className="copy">Need to jump ahead because your test is soon? Use sprint mode.</p>
                  </div>
                  <span className="chip">{pathDayViews.length} days</span>
                </div>
                <div className="grid two">
                  {pathDayViews.map((day) => {
                    const actionLabel = getPathDayActionLabel(day);
                    const showCta = Boolean(actionLabel) && (day.status === 'current' || day.status === 'available_optional');
                    return (
                      <div className={`sectionCard stack pathCard ${pathStatusClass(day.status)}`} key={day.day} aria-disabled={day.status === 'locked' ? true : undefined}>
                        <div className="row">
                          <div className="chips">
                            <span className={day.status === 'locked' ? 'chip' : day.status === 'current' ? 'pill-warn' : 'pill-good'}>
                              Day {day.day}
                            </span>
                            <span className={pathStatusBadgeClass[day.status]}>{pathStatusLabels[day.status]}</span>
                          </div>
                          <span className="mini">{day.minutes} min</span>
                        </div>
                        <h3>{day.title}</h3>
                        <p className="copy">Outcome: {day.outcome}</p>
                        <div className="chips" aria-label={`Day ${day.day} focus sections`}>
                          {day.sectionFocus.map((item) => (
                            <span className="chip" key={`${day.day}-${item}`}>{sectionLabels[item]}</span>
                          ))}
                        </div>
                        <div className="stack" style={{ gap: 8 }}>
                          <span className="mini">Focus work</span>
                          {day.tasks.slice(0, 3).map((task) => <p className="copy" key={`${day.day}-${task}`}>- {task}</p>)}
                        </div>
                        <p className={day.status === 'locked' ? 'pathUnlockReason lockedReason' : 'pathUnlockReason'}>{day.unlockReason}</p>
                        {day.status === 'completed' && <p className="mini">✓ Saved evidence completed this step. No launch required.</p>}
                        {day.status === 'available_optional' && <p className="mini">Optional sprint work only — not required for today’s mission.</p>}
                        {showCta && (
                          <button className={day.status === 'current' ? 'cta' : 'secondary'} onClick={() => startPathDayAction(day)}>
                            {actionLabel}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Full plan</span>
                    <h2>{todaySprint.title}</h2>
                    <p className="copy">{todaySprint.outcome}</p>
                  </div>
                  <div className="chips">
                    <span className="chip">{state.profile.dailyMinutes} min budget</span>
                    <span className="chip">{todayReview.length} due reviews</span>
                    <button className="secondary compactButton" onClick={useNextWeekPlan}>Use next-week plan</button>
                    <button className="secondary compactButton" onClick={useThreeDaySprint}>Use 3-day sprint</button>
                  </div>
                </div>
                <div className="grid two">
                  <div className="sectionCard stack">
                    <div className="row">
                      <span className="pill-good">Next best action</span>
                      <span className="mini">{firstRecommendedMetadata.difficultyBand} • {Math.round(firstRecommendedMetadata.timingSeconds / 60)} min</span>
                    </div>
                    <h3>{firstRecommendedCard.title}</h3>
                    <p className="copy">{firstRecommendedMetadata.cue}</p>
                    <div className="chips">
                      <span className="chip">{firstRecommendedMetadata.questionType}</span>
                      <span className="chip">Strategy {firstRecommendedMetadata.strategyCardId}</span>
                    </div>
                    <button
                      className="cta"
                      onClick={() => {
                        selectPracticeCard(firstRecommendedCard);
                        setTab('library');
                      }}
                    >
                      Start exact next drill
                    </button>
                  </div>
                  {dailyPlan.map((task: DailyTask) => (
                    <button
                      key={task.id}
                      className="sectionCard stack"
                      title={summarizeDailyPlanTask(task)}
                      onClick={() => {
                        setSection(task.section);
                        setTab(task.block === 'Review' ? 'review' : 'library');
                      }}
                    >
                      <div className="row">
                        <span className="chip">{task.block}</span>
                        <span className="mini">{task.minutes} min</span>
                      </div>
                      <h3>{task.title}</h3>
                      <p className="copy">{task.reason}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="sectionCard row">
                <div>
                  <p className="copy">Mini mock access: {optionalMockOverride && !miniMockGate.allowed ? 'Optional sprint override is active for this proof set.' : miniMockGate.reason}</p>
                  <p className="mini">The proof milestone sits at the end of the path.</p>
                </div>
                <div className="chips">
                  <span className={canShowMiniMock ? 'pill-good' : 'pill-warn'}>{optionalMockOverride && !miniMockGate.allowed ? 'available_optional' : miniMockGate.status}</span>
                  <button className="secondary compactButton" onClick={startSprintNextAction}>
                    {sprintNextAction.type === 'mock' ? 'Open mini mock proof set' : 'Start next repair'}
                  </button>
                </div>
              </div>
              {canShowMiniMock ? (
                <div className="panel stack">
                <div className="row">
                  <div>
                    <h2>{currentMock.title}</h2>
                    <p className="copy">A timed-style mini set with reading, listening, speaking, and writing evidence. Completion signal is not an official TOEFL score.</p>
                  </div>
                  <div className="chips">
                    <span className="chip">{currentMock.minutes} min target</span>
                    <span className={mockTimed ? 'pill-good' : 'pill-warn'}>{mockTimed ? `Timed ${formatElapsedSeconds(mockElapsed)}` : 'Timer not started'}</span>
                    <span className={mockTimeRemaining === 0 ? 'pill-bad' : 'chip'}>{formatElapsedSeconds(mockTimeRemaining)} left</span>
                    <span className="chip">{mockScore.correct}/{mockScore.total} objective</span>
                    {currentMockMetadata && <span className="chip">Approved seed</span>}
                  </div>
                </div>
                <div className="sectionCard stack">
                  <div className="row">
                    <div>
                      <h3>Timed mini mock mode</h3>
                      <p className="copy">Start the timer before reading/listening. Timed evidence is saved with the mock report.</p>
                    </div>
                    <span className={mockStartedAt ? 'pill-good' : mockTimed ? 'chip' : 'pill-warn'}>
                      {mockStartedAt ? 'Running' : mockTimed ? 'Paused' : 'Untimed'}
                    </span>
                  </div>
                  <div className="chips">
                    <span className="chip">Elapsed {formatElapsedSeconds(mockElapsed)}</span>
                    <span className="chip">Target {formatElapsedSeconds(mockLimitSeconds)}</span>
                    <button className="secondary compactButton" disabled={mockSubmitted || Boolean(mockStartedAt)} onClick={startMockTimer}>Start timer</button>
                    <button className="secondary compactButton" disabled={!mockStartedAt} onClick={pauseMockTimer}>Pause</button>
                    <button className="ghost compactButton" disabled={mockSubmitted || (!mockTimed && !mockStartedAt)} onClick={resetMockTimer}>Reset timer</button>
                  </div>
                </div>
		                {currentMiniMockAttempt?.submitted && (
		                  <div className="sectionCard stack">
		                    <div className="row">
		                      <span className="mini">Saved mock report</span>
		                      {currentMiniMockAttempt.score !== undefined && <span className="pill-good">{Math.round(currentMiniMockAttempt.score * 100)}/100 signal</span>}
		                    </div>
			                    <p className="copy">Submitted {currentMiniMockAttempt.submittedAt ? new Date(currentMiniMockAttempt.submittedAt).toLocaleString() : 'previously'}. {currentMiniMockAttempt.timed ? `Timed: ${formatElapsedSeconds(currentMiniMockAttempt.elapsedSeconds ?? 0)}.` : 'Timer was not used.'} This completion signal is not an official TOEFL score.</p>
			                    <p className="copy">Repair: {currentMockMetadata.repairRule}</p>
			                    <button className="cta" onClick={startSprintNextAction}>
			                      {sprintNextAction.type === 'mock' ? 'Start next proof set' : 'Start exact repair'}
			                    </button>
			                  </div>
		                )}
		                {mockSubmitted && currentMockMetadata && (
		                  <div className="sectionCard stack">
		                    <span className="mini">Mini mock repair rule</span>
		                    <p>{currentMockMetadata.repairRule}</p>
	                  </div>
	                )}
	                <div className="grid two">
	                  {mockTests.map((mock) => (
	                    <button
	                      key={mock.id}
	                      className={`sectionCard stack ${mock.id === currentMock.id ? 'selectedCard' : ''}`}
	                      aria-pressed={mock.id === currentMock.id}
	                      onClick={() => selectMock(mock.id)}
	                    >
	                      <div className="row">
	                        <span className={mock.id === currentMock.id ? 'pill-good' : 'chip'}>{mock.id === currentMock.id ? 'Current' : 'Proof set'}</span>
	                        <span className="mini">{mock.minutes} min</span>
	                      </div>
	                      <h3>{mock.title}</h3>
	                      <p className="copy">{mock.questions.length} objective + speaking + writing</p>
	                    </button>
	                  ))}
	                </div>
	                <div className="grid two">
                  <div className="sectionCard stack">
                    <div className="row">
                      <h3>Listening lecture</h3>
                      <button className="secondary" onClick={playMockListening}>Play audio</button>
                    </div>
                    <label className="stack">
                      <span>Notes</span>
                      <textarea value={mockNotes} onChange={(event) => setMockNotes(event.target.value)} placeholder="Main idea, examples, contrasts, cause/effect..." />
                    </label>
                    <button className="ghost" onClick={() => setShowMockTranscript((value) => !value)}>
                      {showMockTranscript ? 'Hide transcript' : 'Reveal transcript'}
                    </button>
                    {showMockTranscript && <p className="copy">{currentMock.listeningScript}</p>}
                  </div>
	                  <div className="sectionCard stack">
	                    <h3>Speaking task</h3>
	                    <p>{currentMock.speakingPrompt}</p>
	                    <div className="chips"><span className="chip">Prep 30 sec</span><span className="chip">Speak 60 sec</span></div>
	                    <div className="sectionCard stack">
	                      <div className="row">
	                        <span>Recorded speaking evidence</span>
	                        <span className={hasSpeakingAudioEvidence ? 'pill-good' : 'pill-warn'}>{hasSpeakingAudioEvidence ? 'Captured' : 'Missing'}</span>
	                      </div>
	                      <p className="copy">Mock speaking is only a score signal. Record at least one Practice &gt; Speaking answer before trusting it.</p>
	                      {!hasSpeakingAudioEvidence && (
	                        <button
	                          className="secondary compactButton"
	                          onClick={() => {
	                            setSection('speaking');
	                            setTab('library');
	                          }}
	                        >
	                          Record speaking evidence
	                        </button>
	                      )}
	                    </div>
	                    {speakingChecks.map((check) => (
                      <label key={check} className="row" style={{ justifyContent: 'flex-start' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(mockRubric[check])}
                          onChange={(event) => setMockRubric((prev) => ({ ...prev, [check]: event.target.checked }))}
                          style={{ width: 'auto' }}
                        />
                        <span>{check}</span>
                      </label>
                    ))}
                    <label className="stack">
                      <span>Playback reflection</span>
                      <textarea value={mockSpeakingNotes} onChange={(event) => setMockSpeakingNotes(event.target.value)} placeholder="Record in Practice > Speaking, then summarize timing, pauses, and clarity here." />
                    </label>
                  </div>
                </div>

                <div className="subPanel stack">
                  <h2>Objective questions</h2>
                  <div className="grid two">
                    {currentMock.questions.map((question) => {
                      const answered = mockAnswers[question.id];
                      const metadata = getMockQuestionMetadata(question);
                      return (
                        <div key={question.id} className="sectionCard stack">
	                          <div className="row">
	                            <span className="chip">{sectionLabels[question.section]}</span>
	                            {mockSubmitted && <span className="mini">{metadata.questionType} • Strategy {metadata.strategyCardId}</span>}
	                          </div>
                          <h3>{question.prompt}</h3>
                          <div className="optionList">
                            {question.choices.map((choice, index) => (
                              <button
                                key={choice}
	                                className={`option ${answered === index ? 'selected' : ''} ${mockSubmitted && question.answer === index ? 'correct' : ''}`}
	                                aria-pressed={answered === index}
	                                disabled={mockSubmitted}
	                                onClick={() => setMockAnswers((prev) => ({ ...prev, [question.id]: index }))}
	                              >
                                {choice}
                              </button>
                            ))}
                          </div>
                          {mockSubmitted && (
                            <div className="stack" style={{ gap: 6 }}>
                              <p className="copy">{question.explanation}</p>
                              <p className="copy">Cue: {metadata.cue}</p>
                              {answered !== question.answer && <p className="copy">Repair: {metadata.repairRule}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="sectionCard stack">
                  <h3>Writing task</h3>
                  <p>{currentMock.writingPrompt}</p>
                  <textarea value={mockWriting} onChange={(event) => setMockWriting(event.target.value)} placeholder="Write your response here..." />
                  <div className="chips"><span className="chip">{countWords(mockWriting)} words</span><span className="chip">Target 120-180</span></div>
                </div>

	                <button className="cta" disabled={mockSubmitted || Object.keys(mockAnswers).length < currentMock.questions.length || !mockWriting.trim()} onClick={submitMockTest}>
	                  {mockSubmitted ? 'Mini mock submitted' : 'Submit mini mock'}
	                </button>
              </div>
              ) : (
                <div className="panel stack">
                  <div className="sectionCard stack">
                    <span className="pill-warn">Mini mock locked</span>
                    <h3>Complete the current repair proof first</h3>
                    <p className="copy">{miniMockGate.reason}</p>
                    <button className="cta" onClick={startSprintNextAction}>
                      Start next required step
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === 'review' && (
            <section className="stack">
              <div className="panel stack">
                <div className="row">
                  <div>
                    <h2>Spaced review queue</h2>
                    <p className="copy">Weak material resurfaces automatically. Mark whether it felt stable from memory.</p>
                  </div>
                  <span className="chip">{todayReview.length} due now</span>
                </div>
                <div className="stack">
                  {(todayReview.length ? todayReview : state.reviewQueue.slice(0, 3)).map((card) => (
                    <div key={card.id} className="sectionCard stack">
                      <div className="row">
                        <span className="chip">{sectionLabels[card.section]}</span>
                        <span className="mini">{card.subskill}</span>
                      </div>
                      <h3>{card.prompt}</h3>
                      {revealedReviewIds[card.id] ? (
                        <>
                          <p className="copy">Answer cue: {card.answer}</p>
                          <div className="row">
                            <button className="secondary" onClick={() => handleReview(card, true)}>I remembered it</button>
                            <button className="ghost" onClick={() => handleReview(card, false)}>Still shaky</button>
                          </div>
                        </>
                      ) : (
                        <button className="secondary" onClick={() => setRevealedReviewIds((prev) => ({ ...prev, [card.id]: true }))}>Show answer</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {tab === 'review' && (
            <section className="stack">
              <div className="panel stack">
                <div className="row">
                  <div>
                    <h2>Error log</h2>
                    <p className="copy">Every miss can become a future gain if you label it and revisit it.</p>
                  </div>
                  <span className="chip">{state.errorLog.length} logged</span>
                </div>
                <div className="stack">
                  {state.errorLog.length ? state.errorLog.map((entry) => (
                    <div key={entry.id} className="sectionCard stack">
                      <div className="row">
                        <span className="chip">{sectionLabels[entry.section]}</span>
                        <span className={entry.corrected ? 'pill-good' : 'pill-bad'}>{entry.corrected ? 'Corrected' : 'Active'}</span>
                      </div>
                      <h3>{entry.prompt}</h3>
                      <p className="copy">{entry.subskill} • {entry.errorType} • repeated {entry.repeatCount}x</p>
                      <p>{entry.correctInsight}</p>
                    </div>
                  )) : <p className="copy">No errors logged yet. Objective misses will appear here automatically.</p>}
                </div>
              </div>
            </section>
          )}

          {tab === 'progress' && (
            <section className="stack">
              <div className="grid two">
                <div className="panel stack">
                  <h2>Progress dashboard</h2>
                  <div className="grid two">
                    <div className="stat"><span className="mini">XP earned</span><strong>{state.xp}</strong></div>
                    <div className="stat"><span className="mini">Current streak</span><strong>{state.streak}</strong></div>
                    <div className="stat"><span className="mini">Practice sessions</span><strong>{state.practiceHistory.length}</strong></div>
                    <div className="stat"><span className="mini">Active track</span><strong style={{ fontSize: 20 }}>{state.track}</strong></div>
                  </div>
                </div>
                <div className="panel stack">
                  <h2>Practice readiness dashboard</h2>
                  <span className={getStatusPill(readiness / 100)}>Readiness score: {readiness}/100</span>
                  <div className="progressBar"><span style={{ width: `${readiness}%` }} /></div>
                  <p className="copy">This only rises through repeated strong performance and fewer repeated errors. One good session is not enough.</p>
                  <div className="chips">
                    <span className="chip">Target {state.profile.targetScore}</span>
                    <span className="chip">Due review {todayReview.length}</span>
                    <span className="chip">Test date {state.profile.testDate}</span>
                  </div>
                </div>
              </div>

              <div className="grid two">
                <div className="panel stack">
                  <h2>Evidence snapshot</h2>
                  <p className="copy">Current section estimates from strategy questions, practice outcomes, and mock-test evidence.</p>
                  {sectionOrder.map((item) => (
                    <div key={item} className="stack" style={{ gap: 6 }}>
                      <div className="row"><span>{sectionLabels[item]}</span><span className="mini">{formatPercent(state.sectionScores[item])}</span></div>
                      <div className="progressBar"><span style={{ width: formatPercent(state.sectionScores[item]) }} /></div>
                    </div>
                  ))}
                </div>
                <div className="panel stack">
                  <h2>Current blockers</h2>
                  {blockerList.length ? blockerList.map((item) => <div key={item} className="sectionCard"><p>{item}</p></div>) : <p className="copy">No major blockers flagged yet. Keep pushing consistency.</p>}
                </div>
              </div>

              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Test-week readiness report</span>
                    <h2>{testReadinessReport.headline}</h2>
                    <p className="copy">{testReadinessReport.summary}</p>
                  </div>
                  <span className={testReadinessReport.verdict === 'ready-to-sit' ? 'pill-good' : testReadinessReport.verdict === 'blocked' ? 'pill-bad' : 'pill-warn'}>
                    {testReadinessReport.evidenceScore}/100 evidence
                  </span>
                </div>
                <div className="grid two">
                  <div className="sectionCard stack">
                    <h3>Proof signals</h3>
                    {testReadinessReport.signals.map((item) => (
                      <div className="row" key={item.label}>
                        <span>{item.label}</span>
                        <span className={item.status === 'pass' ? 'pill-good' : item.status === 'risk' ? 'pill-warn' : 'pill-bad'}>{item.evidence}</span>
                      </div>
                    ))}
                  </div>
                  <div className="sectionCard stack">
                    <h3>Final checklist</h3>
                    {testReadinessReport.finalChecklist.map((item) => <p className="copy" key={item}>- {item}</p>)}
                    <div className="chips">
                      <button className="cta" onClick={startSprintNextAction}>{testReadinessReport.nextActionLabel}</button>
                      <button className="secondary compactButton" onClick={exportReadinessReport}>Export readiness report</button>
                      <button className="ghost compactButton" onClick={() => setShowReadinessReportText((value) => !value)}>
                        {showReadinessReportText ? 'Hide report text' : 'Show report text'}
                      </button>
                      <button className="secondary compactButton" onClick={exportFinalTemplateSheet}>Export template sheet</button>
                      <button className="ghost compactButton" onClick={() => setShowFinalTemplateSheet((value) => !value)}>
                        {showFinalTemplateSheet ? 'Hide template sheet' : 'Show template sheet'}
                      </button>
                    </div>
                    {showReadinessReportText && (
                      <textarea
                        readOnly
                        className="reportTextArea"
                        value={learnerReadinessReportText}
                        aria-label="Readiness report text"
                      />
                    )}
                    {showFinalTemplateSheet && (
                      <textarea
                        readOnly
                        className="reportTextArea"
                        value={finalTemplateSheetText}
                        aria-label="Final template sheet text"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Final operating plan</span>
                    <h2>{testDayPlan.title}</h2>
                    <p className="copy">{testDayPlan.summary}</p>
                  </div>
                  <span className="chip">{testDayPlan.blocks.reduce((total, block) => total + block.minutes, 0)} min total</span>
                </div>
                <div className="grid two">
                  {testDayPlan.blocks.map((block) => (
                    <div className="sectionCard stack" key={block.title}>
                      <div className="row">
                        <span className={block.mode === 'rest' ? 'pill-warn' : block.mode === 'proof' ? 'pill-good' : 'chip'}>{block.mode}</span>
                        <span className="mini">{block.minutes ? `${block.minutes} min` : 'stop rule'}</span>
                      </div>
                      <h3>{block.title}</h3>
                      <p className="copy">{block.instruction}</p>
                    </div>
                  ))}
                </div>
                {testWeekCommandPanel}
                <div className="sectionCard stack">
                  <h3>Do not do this before test day</h3>
                  <div className="chips">
                    {testDayPlan.avoid.map((item) => <span className="pill-warn" key={item}>{item}</span>)}
                  </div>
                </div>
              </div>

              {personalProofGatePanel}

              <div className="panel stack">
                <div className="row">
                  <div>
                    <span className="kicker">Founder launch gate</span>
                    <h2>{founderLaunchGate.label}</h2>
                    <p className="copy">This gate checks production auth/backend/support configuration and the Korea-first beta safety path before inviting learners.</p>
                  </div>
                  <span className={founderLaunchGate.ready ? 'pill-good' : launchAuditStatus === 'error' ? 'pill-bad' : 'pill-warn'}>
                    {launchAuditStatus === 'loading' ? 'Checking' : founderLaunchGate.ready ? 'Ready' : 'Blocked'}
                  </span>
                </div>
                {launchAuditStatus === 'error' ? (
                  <div className="sectionCard"><p>Launch readiness could not be loaded. Check `/api/readiness` before onboarding users.</p></div>
                ) : (
                  <div className="grid two">
                    {(launchAudit?.checks ?? []).filter((item) => item.status !== 'manual').map((item) => (
                      <div className="sectionCard stack" key={item.key}>
                        <div className="row">
                          <span>{item.label}</span>
                          <span className={item.status === 'pass' ? 'pill-good' : item.status === 'manual' ? 'pill-warn' : 'pill-bad'}>
                            {item.status}
                          </span>
                        </div>
                        <p className="copy">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
                {launchAudit?.blockers.length ? (
                  <div className="sectionCard stack">
                    <h3>Launch blockers</h3>
                    {launchAudit.blockers.map((item) => <p className="copy" key={item}>- {item}</p>)}
                  </div>
                ) : null}
                <div className="sectionCard stack">
                  <h3>Founder smoke checks</h3>
                  {launchSmokeCheckDefinitions.map((item) => (
                    <label className="row" key={item.key} style={{ justifyContent: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={launchSmokeChecks[item.key].done}
                        onChange={(event) => setLaunchSmokeCheck(item.key, event.target.checked)}
                        style={{ width: 'auto' }}
                      />
                      <span>{item.label}</span>
                      <span className={launchSmokeChecks[item.key].done ? 'pill-good' : 'pill-warn'}>
                        {launchSmokeChecks[item.key].done ? 'done' : 'pending'}
                      </span>
                    </label>
                  ))}
                  <p className="copy">{founderLaunchGate.manualReady ? 'Manual smoke checks are complete on this device.' : 'Do not invite beta users until both founder smoke checks are marked done.'}</p>
                </div>
              </div>

              <div className="grid two">
                <div className="panel stack">
                  <h2>Recent practice trend</h2>
                  {state.practiceHistory.length ? state.practiceHistory.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="sectionCard stack">
                      <div className="row">
                        <span className="chip">{sectionLabels[entry.section]}</span>
                        <span className={getStatusPill(entry.score)}>{Math.round(entry.score * 100)}%</span>
                      </div>
                      <p className="copy">{entry.subskill} • {new Date(entry.completedAt).toLocaleString()}</p>
                      <p>{entry.notes || 'No note added.'}</p>
                    </div>
                  )) : <p className="copy">Complete practice to unlock trend history.</p>}
                </div>
                <div className="panel stack">
                  <h2>Blockers to 120</h2>
                  {blockerList.length ? blockerList.map((item) => <div key={item} className="sectionCard"><p>{item}</p></div>) : <p className="copy">You are trending clean right now. Keep accumulating stable sessions.</p>}
                </div>
              </div>

              <div className="panel stack">
                <div className="row">
                  <div>
                    <h2>Progress controls</h2>
            <p className="copy">Signed-in progress syncs to Convex. Guest progress stays on this device and remains exportable as a private JSON backup.</p>
                  </div>
                  <div className="chips">
                    <button className="secondary" onClick={exportProgress}>Export backup</button>
                    <button className="ghost compactButton" onClick={() => setShowBackupText((value) => !value)}>
                      {showBackupText ? 'Hide backup JSON' : 'Show backup JSON'}
                    </button>
                    <button className="secondary" onClick={() => importInputRef.current?.click()}>Import backup</button>
                    <button className="danger" onClick={clearAllData}>Reset data</button>
                  </div>
                </div>
                {showBackupText && (
                  <textarea
                    readOnly
                    className="reportTextArea"
                    value={progressBackupText}
                    aria-label="Progress backup JSON"
                  />
                )}
                <div className="sectionCard stack">
                  <h3>Paste backup restore</h3>
                  <p className="copy">Use this when downloads or file pickers are blocked. Paste a TOEFL 120 Coach JSON backup, import it, then confirm the learner loop and progress return.</p>
                  <textarea
                    className="backupImportArea"
                    value={backupImportText}
                    onChange={(event) => setBackupImportText(event.target.value)}
                    placeholder="Paste TOEFL 120 Coach JSON backup"
                    aria-label="Paste progress backup JSON"
                  />
                  <div className="chips">
                    <button className="secondary compactButton" onClick={importBackupText}>Import pasted backup</button>
                    <button className="ghost compactButton" onClick={() => setBackupImportText('')}>Clear pasted backup</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {feedback && <section className="toast" role="status" aria-live="polite"><p>{feedback}</p></section>}
        </>
      )}
        </>
      )}
      <footer className="legalLinks" aria-label="Legal and support">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/support">Support</a>
        <a href="/beta">Beta</a>
        <a href="/korea">Korea beta</a>
      </footer>
      </div>
    </main>
  );
}
