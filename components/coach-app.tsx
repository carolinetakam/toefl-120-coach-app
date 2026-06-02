'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UserButton, useAuth, useClerk } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { buildRepairNote, getMockQuestionMetadata, getMockTestMetadata, getPracticeCardMetadata } from '@/lib/content-metadata';
import { applyPracticeOutcome, buildErrorEntry, buildReviewCard, getLocalDateKey, nextInterval, prioritizePracticeCards, readinessScore, scoreDiagnostic, updateStreak, updateSubskillScores } from '@/lib/logic';
import { evaluateMockAttempt, mockTests, scoreMockAnswers } from '@/lib/mock-tests';
import { generateDailyPlan, summarizeDailyPlanTask } from '@/lib/planner';
import { generateBlockerSummary, generateRecommendedDrills } from '@/lib/reporting';
import { diagnosticQuestions, initialState, practiceCards, sectionLabels } from '@/lib/seed';
import { loadState, resetState, saveState, toPersistableState } from '@/lib/storage';
import { elapsedSeconds, formatElapsedSeconds } from '@/lib/timing';
import { AppState, DailyTask, PracticeCard, ReviewCard, Section, UserProfile } from '@/lib/types';
import { parseAppStateJson, sanitizeAppState } from '@/lib/validation';

type TabKey = 'today' | 'practice' | 'mock' | 'review' | 'errors' | 'dashboard';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'practice', label: 'Practice' },
  { key: 'mock', label: 'Mock' },
  { key: 'review', label: 'Review' },
  { key: 'errors', label: 'Errors' },
  { key: 'dashboard', label: 'Dashboard' },
];

const sectionOrder: Section[] = ['reading', 'listening', 'speaking', 'writing'];
const speakingChecks = ['Clear main idea', 'Source detail included', 'Finished cleanly'];
const diagnosticStartedAtKey = 'toefl-120-coach-diagnostic-started-at';
const speakingRecordingLimitSeconds = 60;

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getStatusPill(value: number) {
  if (value >= 0.9) return 'pill-good';
  if (value >= 0.75) return 'pill-warn';
  return 'pill-bad';
}

function normalizeNumber(value: string, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function hasUserProgress(state: AppState) {
  return (
    state.onboarded ||
    state.diagnosticCompleted ||
    state.xp > 0 ||
    state.practiceHistory.length > 0 ||
    state.writingDrafts.length > 0 ||
    state.speakingAttempts.length > 0
  );
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function CoachApp() {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
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
  const [submittedChoices, setSubmittedChoices] = useState<Record<string, number>>({});
  const [mockAnswers, setMockAnswers] = useState<Record<string, number>>({});
  const [mockNotes, setMockNotes] = useState('');
  const [mockSpeakingNotes, setMockSpeakingNotes] = useState('');
  const [mockWriting, setMockWriting] = useState('');
  const [mockRubric, setMockRubric] = useState<Record<string, boolean>>({});
  const [mockSubmitted, setMockSubmitted] = useState(false);
  const [showMockTranscript, setShowMockTranscript] = useState(false);
  const [revealedReviewIds, setRevealedReviewIds] = useState<Record<string, boolean>>({});
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>();
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [diagnosticStartedAt, setDiagnosticStartedAt] = useState<number | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const submittedChoicesRef = useRef<Record<string, number>>({});
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const localStateRef = useRef<AppState>(initialState);
  const authModeRef = useRef<string | undefined>(undefined);
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const authMode = authLoaded ? (isSignedIn ? 'signed-in' : 'signed-out') : 'loading';
  const convexState = useQuery(api.coach.getAppState, authLoaded && isSignedIn ? {} : 'skip');
  const saveConvexState = useMutation(api.coach.saveAppState);
  const deleteConvexData = useMutation(api.coach.deleteMyData);

  useEffect(() => {
    const localState = loadState();
    localStateRef.current = localState;
    setState(localState);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !authLoaded) return;
    if (authModeRef.current === authMode) return;
    authModeRef.current = authMode;
    localStateRef.current = loadState();
    setSyncReady(false);
  }, [authLoaded, authMode, ready]);

  useEffect(() => {
    if (!ready || !authLoaded || syncReady) return;
    const localState = localStateRef.current;

    if (isSignedIn) {
      if (convexState === undefined) return;
      const remoteState = convexState ? sanitizeAppState(convexState.state) : null;

      if (remoteState && hasUserProgress(remoteState)) {
        setState(remoteState);
        saveState(remoteState);
        setSaveStatus('Synced');
        setSyncReady(true);
        return;
      }

      if (hasUserProgress(localState)) {
        saveConvexState({ schemaVersion: 1, state: toPersistableState(localState) })
          .then(() => setSaveStatus('Synced'))
          .catch(() => setSaveStatus('Offline'))
          .finally(() => setSyncReady(true));
        return;
      }

      setSaveStatus('Synced');
      setSyncReady(true);
      return;
    }

    setSaveStatus('Local');
    setSyncReady(true);
  }, [authLoaded, convexState, isSignedIn, ready, saveConvexState, syncReady]);

  useEffect(() => {
    if (!ready || !syncReady) return;
    saveState(state);
    setSaveStatus('Syncing');
    const timeout = window.setTimeout(() => {
      const cleanState = toPersistableState(state);
      if (!isSignedIn) {
        setSaveStatus('Local');
        return;
      }

      saveConvexState({ schemaVersion: 1, state: cleanState })
        .then(() => setSaveStatus('Synced'))
        .catch(() => setSaveStatus('Offline'));
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [isSignedIn, ready, saveConvexState, state, syncReady]);

  const dailyPlan = useMemo(() => generateDailyPlan(state), [state]);
  const readiness = useMemo(() => readinessScore(state), [state]);
  const todayReview = useMemo(
    () => state.reviewQueue.filter((item) => new Date(item.dueDate) <= new Date()),
    [state.reviewQueue],
  );
  const orderedPracticeCards = useMemo(() => prioritizePracticeCards(state, section), [section, state]);
  const recommendedDrillIds = useMemo(
    () => new Set(generateRecommendedDrills(orderedPracticeCards, state.sectionScores, state.subskillScores, 1).map((drill) => drill.cardId)),
    [orderedPracticeCards, state.sectionScores, state.subskillScores],
  );
  const currentCard = useMemo(() => {
    return orderedPracticeCards.find((card) => card.id === selectedCardId[section]) ?? orderedPracticeCards[0] ?? practiceCards[section][0];
  }, [orderedPracticeCards, section, selectedCardId]);
  const currentQuestion = diagnosticQuestions[diagnosticIndex];
  const blockerList = useMemo(() => generateBlockerSummary(state.sectionScores, state.errorLog), [state.errorLog, state.sectionScores]);
  const currentMock = mockTests[0];
  const currentMockMetadata = useMemo(() => getMockTestMetadata(currentMock.id), [currentMock.id]);
  const mockScore = useMemo(() => scoreMockAnswers(currentMock, mockAnswers), [currentMock, mockAnswers]);
  const currentCardMetadata = useMemo(() => getPracticeCardMetadata(currentCard), [currentCard]);

  useEffect(() => {
    const savedDraft = state.writingDrafts.find((entry) => entry.promptId === currentCard.id);
    const savedAttempt = state.speakingAttempts.find((entry) => entry.promptId === currentCard.id);

    if (currentCard.section === 'writing') {
      setWritingDraft(savedDraft?.draft ?? '');
      setWritingRevision(savedDraft?.revision ?? '');
      setSpeakingNotes('');
      setSpeakingRating(3);
      setAudioUrl(undefined);
      return;
    }

    if (currentCard.section === 'speaking') {
      setWritingDraft('');
      setWritingRevision('');
      setSpeakingNotes(savedAttempt?.notes ?? '');
      setSpeakingRating(savedAttempt?.selfRating ?? 3);
      setAudioUrl(savedAttempt?.audioUrl);
      return;
    }

    setWritingDraft('');
    setWritingRevision('');
    setSpeakingNotes('');
    setSpeakingRating(3);
    setAudioUrl(undefined);
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
    const shouldRunClock = (state.onboarded && !state.diagnosticCompleted) || recording;
    if (!shouldRunClock) return;
    const interval = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [recording, state.diagnosticCompleted, state.onboarded]);

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
  }

  function openAccountSignIn() {
    openSignIn();
  }

  function submitDiagnostic() {
    if (diagnosticChoice === null || !currentQuestion) return;

    const nextAnswers = { ...state.diagnosticAnswers, [currentQuestion.id]: diagnosticChoice };

    if (diagnosticIndex < diagnosticQuestions.length - 1) {
      setState((prev) => ({ ...prev, diagnosticAnswers: nextAnswers }));
      setDiagnosticIndex((prev) => prev + 1);
      setDiagnosticChoice(nextAnswers[diagnosticQuestions[diagnosticIndex + 1].id] ?? null);
      return;
    }

    const result = scoreDiagnostic(nextAnswers);
    const streakUpdate = updateStreak(state.lastActiveDate);

    setState((prev) => ({
      ...prev,
      diagnosticAnswers: nextAnswers,
      diagnosticCompleted: true,
      sectionScores: result.sectionScores,
      subskillScores: result.subskillScores,
      track: result.track,
      xp: prev.xp + 80,
      streak: streakUpdate === 'increment' ? prev.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(prev.streak, 1),
      lastActiveDate: getLocalDateKey(),
    }));
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(diagnosticStartedAtKey);
    }
    setDiagnosticStartedAt(null);
    setTab('today');
    setFeedback('Diagnostic saved. Your plan has been updated.');
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

    setState((prev) => {
      const existingError = prev.errorLog.find((entry) => entry.section === card.section && entry.subskill === card.subskill && entry.prompt === card.title && !entry.corrected);
      const mergedErrorLog = errorEntry
        ? existingError
          ? prev.errorLog.map((entry) =>
              entry === existingError
                ? { ...entry, repeatCount: entry.repeatCount + 1, lastSeen: now, dueDate: new Date(Date.now() + 86400000).toISOString() }
                : entry,
            )
          : [errorEntry, ...prev.errorLog]
        : prev.errorLog.map((entry) =>
            entry.section === card.section && entry.subskill === card.subskill ? { ...entry, corrected: true, lastSeen: now } : entry,
          );

      return {
        ...prev,
        sectionScores: applyPracticeOutcome(prev, card.section, card.subskill, score, supported),
        subskillScores: updateSubskillScores(prev.subskillScores, card.subskill, score),
        xp: prev.xp + card.xp,
        streak: streakUpdate === 'increment' ? prev.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(prev.streak, 1),
        lastActiveDate: getLocalDateKey(),
        reviewQueue: [reviewCard, ...prev.reviewQueue],
        errorLog: mergedErrorLog,
        practiceHistory: [
          { id: `${card.id}-${now}`, section: card.section, subskill: card.subskill, score, completedAt: now, notes, supported },
          ...prev.practiceHistory,
        ].slice(0, 40),
      };
    });

    setFeedback(correct ? `Strong work. ${metadata.cue} ${card.explanation}` : `Logged for repair. ${buildRepairNote(metadata)}`);
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
    const revisionBonus = writingRevision.trim().length > 40 ? 0.1 : 0;
    const score = Math.min(1, 0.62 + Math.min(writingDraft.trim().length / 400, 0.22) + revisionBonus);
    const supported = !writingRevision.trim();
    const streakUpdate = updateStreak(state.lastActiveDate);

    setState((prev) => ({
      ...prev,
      sectionScores: applyPracticeOutcome(prev, 'writing', card.subskill, score, supported),
      subskillScores: updateSubskillScores(prev.subskillScores, card.subskill, score),
      xp: prev.xp + card.xp + (writingRevision.trim() ? 8 : 0),
      streak: streakUpdate === 'increment' ? prev.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(prev.streak, 1),
      lastActiveDate: getLocalDateKey(),
      reviewQueue: [buildReviewCard(card), ...prev.reviewQueue],
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
        ...prev.practiceHistory,
      ].slice(0, 40),
      writingDrafts: [
        { promptId: card.id, draft: writingDraft, revision: writingRevision, score },
        ...prev.writingDrafts.filter((entry) => entry.promptId !== card.id),
      ],
    }));

    setFeedback(
      `Writing saved. Score signal: ${Math.round(score * 100)}. Feedback: keep structure explicit, tie support directly to claim, and revise one sentence for tighter logic.`,
    );
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

  function submitMockTest() {
    const evaluation = evaluateMockAttempt(currentMock, mockAnswers, Object.values(mockRubric).filter(Boolean).length, mockSpeakingNotes, mockWriting);
    const now = new Date().toISOString();
    const streakUpdate = updateStreak(state.lastActiveDate);

    setState((prev) => {
      let sectionScores = applyPracticeOutcome(prev, 'reading', 'mock reading', evaluation.objectiveScore, true);
      sectionScores = applyPracticeOutcome({ ...prev, sectionScores }, 'listening', 'mock listening', evaluation.objectiveScore, true);
      sectionScores = applyPracticeOutcome({ ...prev, sectionScores }, 'speaking', 'mock speaking', evaluation.speakingScore, true);
      sectionScores = applyPracticeOutcome({ ...prev, sectionScores }, 'writing', 'mock writing', evaluation.writingScore, true);

      return {
        ...prev,
        sectionScores,
        subskillScores: {
          ...prev.subskillScores,
          'mock reading': evaluation.objectiveScore,
          'mock listening': evaluation.objectiveScore,
          'mock speaking': evaluation.speakingScore,
          'mock writing': evaluation.writingScore,
        },
        xp: prev.xp + 70,
        streak: streakUpdate === 'increment' ? prev.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(prev.streak, 1),
        lastActiveDate: getLocalDateKey(),
        practiceHistory: [
          {
            id: `${currentMock.id}-${now}`,
            section: 'listening' as Section,
            subskill: 'mini mock',
            score: evaluation.overall / 100,
            completedAt: now,
            notes: `${evaluation.objectiveCorrect}/${evaluation.objectiveTotal} objective; speaking checklist ${Object.values(mockRubric).filter(Boolean).length}/3; writing ${evaluation.writingWords} words.`,
            supported: true,
          },
          ...prev.practiceHistory,
        ].slice(0, 40),
      };
    });
    setMockSubmitted(true);
    setFeedback(`Mini mock saved. Completion signal: ${evaluation.overall}/100. ${evaluation.feedback} Repair rule: ${currentMockMetadata?.repairRule ?? 'Review the first missed subskill.'}`);
  }

  function submitSpeaking(card: PracticeCard) {
    const score = Math.min(1, 0.45 + speakingRating * 0.1 + (audioUrl ? 0.05 : 0));
    const supported = speakingRating <= 3;
    const streakUpdate = updateStreak(state.lastActiveDate);

    setState((prev) => ({
      ...prev,
      sectionScores: applyPracticeOutcome(prev, 'speaking', card.subskill, score, supported),
      subskillScores: updateSubskillScores(prev.subskillScores, card.subskill, score),
      xp: prev.xp + card.xp,
      streak: streakUpdate === 'increment' ? prev.streak + 1 : streakUpdate === 'reset' ? 1 : Math.max(prev.streak, 1),
      lastActiveDate: getLocalDateKey(),
      reviewQueue: [buildReviewCard(card), ...prev.reviewQueue],
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
        ...prev.practiceHistory,
      ].slice(0, 40),
      speakingAttempts: [
        { promptId: card.id, selfRating: speakingRating, notes: speakingNotes },
        ...prev.speakingAttempts.filter((entry) => entry.promptId !== card.id),
      ],
    }));

    setFeedback(`Speaking logged. Feedback: keep one main idea, cut setup, and finish with a clean final sentence. Score signal: ${Math.round(score * 100)}.`);
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
    setState(initialState);
    setSubmittedChoices({});
    setDiagnosticIndex(0);
    setDiagnosticChoice(null);
    setDiagnosticStartedAt(null);
    setRecordingStartedAt(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(diagnosticStartedAtKey);
    }
    setTab('today');
    setFeedback('Progress cleared.');
  }

  function exportProgress() {
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      app: 'toefl-120-coach',
      state: toPersistableState(state),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `toefl-120-coach-backup-${getLocalDateKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback('Progress backup exported.');
  }

  async function importProgress(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as { state?: unknown };
      const importedState = parsed.state ? sanitizeAppState(parsed.state) : parseAppStateJson(JSON.stringify(parsed));
      submittedChoicesRef.current = {};
      setSubmittedChoices({});
      setState(importedState);
      saveState(importedState);
      if (isSignedIn) {
        await saveConvexState({ schemaVersion: 1, state: toPersistableState(importedState) });
      }
      setFeedback(isSignedIn ? 'Progress backup imported and synced.' : 'Progress backup imported on this device.');
    } catch {
      setFeedback('That backup file could not be imported. Use a TOEFL 120 Coach JSON export.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  useEffect(() => {
    if (!currentQuestion) return;
    setDiagnosticChoice(state.diagnosticAnswers[currentQuestion.id] ?? null);
  }, [currentQuestion, state.diagnosticAnswers]);

  if (!ready) {
    return <div className="shell"><div className="hero">Loading TOEFL 120 Coach...</div></div>;
  }

  const diagnosticProgress = Math.round((Object.keys(state.diagnosticAnswers).length / diagnosticQuestions.length) * 100);
  const selectedObjectiveChoice = submittedChoices[currentCard.id];
  const writingWordCount = countWords(writingDraft);
  const revisionWordCount = countWords(writingRevision);
  const diagnosticElapsed = elapsedSeconds(diagnosticStartedAt, clockNow);
  const recordingElapsed = elapsedSeconds(recordingStartedAt, clockNow);
  const firstRecommendedSection = dailyPlan[0]?.section ?? 'reading';
  const firstRecommendedCard = prioritizePracticeCards(state, firstRecommendedSection)[0] ?? practiceCards[firstRecommendedSection][0];
  const firstRecommendedMetadata = getPracticeCardMetadata(firstRecommendedCard);

  return (
    <main className="shell stack">
      <section className="hero stack">
        <div className="row">
          <div className="stack" style={{ gap: 10 }}>
            <span className="kicker">Private TOEFL practice coach</span>
            <h1>TOEFL 120 Coach</h1>
            <p className="copy">Adaptive TOEFL practice, signed-in cloud sync, local guest preview, and clear next drills on phone or tablet.</p>
            <p className="copy">한국 베타 Day 1: 가입, 목표 입력, 진단, 미니 모의고사, 오늘의 학습 계획.</p>
          </div>
          <div className="chips">
            {!isSignedIn && (
              <button className="secondary" onClick={openAccountSignIn}>Create beta account / Sign in</button>
            )}
            {authLoaded && isSignedIn && (
              <UserButton afterSignOutUrl="/" />
            )}
            <span className={getStatusPill(readiness / 100)}>Readiness {readiness}</span>
            <span className="chip">Track: {state.track}</span>
            <span className="chip">XP {state.xp}</span>
            <span className="chip">Streak {state.streak} day</span>
            <span className="chip">Save: {saveStatus}</span>
          </div>
        </div>
        <div className="grid four">
          {sectionOrder.map((item) => (
            <div className="stat" key={item}>
              <span className="mini">{sectionLabels[item]}</span>
              <strong>{formatPercent(state.sectionScores[item])}</strong>
              <div className="progressBar"><span style={{ width: formatPercent(state.sectionScores[item]) }} /></div>
            </div>
          ))}
        </div>
      </section>

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
              </div>
            </div>
          )}
          <div className="grid two">
            <label className="stack"><span>Name</span><input value={state.profile.name} onChange={(e) => handleProfileUpdate('name', e.target.value)} /></label>
            <label className="stack"><span>Target score</span><input type="number" inputMode="numeric" min={80} max={120} value={state.profile.targetScore} onChange={(e) => handleProfileUpdate('targetScore', normalizeNumber(e.target.value, state.profile.targetScore, 80, 120))} /></label>
            <label className="stack"><span>Target test date</span><input type="date" value={state.profile.testDate} onChange={(e) => handleProfileUpdate('testDate', e.target.value)} /></label>
            <label className="stack"><span>Daily minutes</span><input type="number" inputMode="numeric" min={20} max={240} value={state.profile.dailyMinutes} onChange={(e) => handleProfileUpdate('dailyMinutes', normalizeNumber(e.target.value, state.profile.dailyMinutes, 20, 240))} /></label>
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
              <button className="cta" disabled={diagnosticChoice === null} onClick={submitDiagnostic}>{diagnosticIndex < diagnosticQuestions.length - 1 ? 'Next question' : 'Finish diagnostic'}</button>
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
                    <h2>Today&apos;s adaptive plan</h2>
                    <p className="copy">Built from your weakest sections, review pressure, and test-date urgency.</p>
                  </div>
                  <div className="chips">
                    <span className="chip">{state.profile.dailyMinutes} min budget</span>
                    <span className="chip">{todayReview.length} due reviews</span>
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
                        setTab('practice');
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
                        setTab(task.block === 'Review' ? 'review' : 'practice');
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
            </section>
          )}

          {tab === 'practice' && (
            <section className="stack">
              <div className="panel stack">
                <div className="row">
                  <div>
                    <h2>Practice by section</h2>
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
                      <button key={card.id} className="sectionCard stack" onClick={() => selectPracticeCard(card)}>
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

              <div className="panel stack">
                <div className="row">
                  <div>
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
                  <p>{currentCardMetadata.cue}</p>
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
                    <label className="stack"><span>Draft</span><textarea value={writingDraft} onChange={(e) => setWritingDraft(e.target.value)} placeholder="Write your TOEFL response here..." /></label>
                    <div className="chips"><span className="chip">{writingWordCount} words</span><span className="chip">Target depends on task: 120-240</span></div>
                    <label className="stack"><span>Revision pass</span><textarea value={writingRevision} onChange={(e) => setWritingRevision(e.target.value)} placeholder="Revise for clearer structure, stronger support, and cleaner transitions..." /></label>
                    <div className="chips"><span className="chip">{revisionWordCount} revision words</span><span className="chip">Autosaves after submit</span></div>
                    <button className="cta" disabled={!writingDraft.trim()} onClick={() => submitWriting(currentCard)}>Save writing response</button>
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
                    <label className="stack"><span>Reflection note</span><textarea value={speakingNotes} onChange={(e) => setSpeakingNotes(e.target.value)} placeholder="Example: intro too long, example was clear, pronunciation broke on two words..." /></label>
                    <button className="cta" onClick={() => submitSpeaking(currentCard)}>Save speaking attempt</button>
                  </div>
                )}
                <div className="sectionCard stack">
                  <span className="mini">Review and repair</span>
                  <p>{currentCard.explanation}</p>
                  <p className="copy">Repair: {currentCardMetadata.repairRule}</p>
                  {currentCard.followUp && <p className="copy">Follow-up: {currentCard.followUp}</p>}
                </div>
              </div>
            </section>
          )}

          {tab === 'mock' && (
            <section className="stack">
              <div className="panel stack">
                <div className="row">
                  <div>
                    <h2>{currentMock.title}</h2>
                    <p className="copy">A timed-style mini set with reading, listening, speaking, and writing evidence. Completion signal is not an official TOEFL score.</p>
                  </div>
                  <div className="chips">
                    <span className="chip">{currentMock.minutes} min target</span>
                    <span className="chip">{mockScore.correct}/{mockScore.total} objective</span>
                    {currentMockMetadata && <span className="chip">Approved seed</span>}
                  </div>
                </div>
                {mockSubmitted && currentMockMetadata && (
                  <div className="sectionCard stack">
                    <span className="mini">Mini mock repair rule</span>
                    <p>{currentMockMetadata.repairRule}</p>
                  </div>
                )}
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

                <div className="panel stack">
                  <h2>Objective questions</h2>
                  <div className="grid two">
                    {currentMock.questions.map((question) => {
                      const answered = mockAnswers[question.id];
                      const metadata = getMockQuestionMetadata(question);
                      return (
                        <div key={question.id} className="sectionCard stack">
                          <div className="row">
                            <span className="chip">{sectionLabels[question.section]}</span>
                            <span className="mini">{metadata.questionType} • Strategy {metadata.strategyCardId}</span>
                          </div>
                          <h3>{question.prompt}</h3>
                          <div className="optionList">
                            {question.choices.map((choice, index) => (
                              <button
                                key={choice}
                                className={`option ${answered === index ? 'selected' : ''} ${mockSubmitted && question.answer === index ? 'correct' : ''}`}
                                aria-pressed={answered === index}
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

                <button className="cta" disabled={Object.keys(mockAnswers).length < currentMock.questions.length || !mockWriting.trim()} onClick={submitMockTest}>
                  Submit mini mock
                </button>
              </div>
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

          {tab === 'errors' && (
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

          {tab === 'dashboard' && (
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
                    <button className="secondary" onClick={() => importInputRef.current?.click()}>Import backup</button>
                    <button className="danger" onClick={clearAllData}>Reset data</button>
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
                  </div>
                </div>
              </div>
            </section>
          )}

          {feedback && <section className="toast" role="status" aria-live="polite"><p>{feedback}</p></section>}

          <nav className="tabs" aria-label="Primary">
            {tabs.map((item) => (
              <button key={item.key} className={`tab ${tab === item.key ? 'active' : ''}`} aria-current={tab === item.key ? 'page' : undefined} onClick={() => setTab(item.key)}>
                {item.label}
              </button>
            ))}
          </nav>
        </>
      )}
      <footer className="legalLinks" aria-label="Legal and support">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/support">Support</a>
        <a href="/beta">Beta</a>
        <a href="/korea">Korea beta</a>
      </footer>
    </main>
  );
}
