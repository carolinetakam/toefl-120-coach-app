import { PracticeCard } from '@/lib/types';

export interface SkillEvaluation {
  score: number;
  band: 'weak' | 'developing' | 'ready';
  summary: string;
  strengths: string[];
  repairs: string[];
  proofChecks: Array<{
    label: string;
    passed: boolean;
    detail: string;
  }>;
  metrics: Record<string, number>;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceCount(value: string) {
  return value.split(/[.!?]+/).filter((sentence) => sentence.trim().split(/\s+/).length >= 4).length;
}

function keywordCoverage(value: string, keywords: string[]) {
  if (!keywords.length) return 0;
  const normalized = value.toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword)).length / keywords.length;
}

function hasAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function bandFor(score: number): SkillEvaluation['band'] {
  if (score >= 0.78) return 'ready';
  if (score >= 0.58) return 'developing';
  return 'weak';
}

function capReady(band: SkillEvaluation['band'], hasBlockingRepair: boolean): SkillEvaluation['band'] {
  if (band === 'ready' && hasBlockingRepair) return 'developing';
  return band;
}

function sectionKeywords(card: PracticeCard) {
  const text = `${card.title} ${card.prompt} ${card.subskill}`.toLowerCase();
  const keywords = [
    'reading',
    'lecture',
    'professor',
    'student',
    'campus',
    'reason',
    'example',
    'change',
    'problem',
    'solution',
    'topic',
    'definition',
    'opinion',
  ];
  return keywords.filter((keyword) => text.includes(keyword));
}

export function evaluateSpeakingAttempt(card: PracticeCard, selfRating: number, notes: string, hasAudio: boolean): SkillEvaluation {
  const words = countWords(notes);
  const sourceKeywords = sectionKeywords(card);
  const structure = hasAny(notes, [/\b(first|second|because|for example|overall|so)\b/i]) ? 1 : 0.35;
  const sourceCoverage = sourceKeywords.length ? keywordCoverage(notes, sourceKeywords.slice(0, 4)) : 0.65;
  const reflection = words >= 18 ? 1 : words >= 10 ? 0.7 : words >= 4 ? 0.45 : 0.2;
  const selfSignal = clamp(selfRating / 5);
  const audioSignal = hasAudio ? 1 : 0.45;
  const finishSignal = hasAny(notes, [/\bfinish(ed)?\b/i, /\bfinal sentence\b/i, /\bcomplete\b/i, /\bconclusion\b/i]) ? 1 : 0.55;
  const hesitationPenalty = hasAny(notes, [/\b(too long|long intro|pause|paused|hesitat|uhm|um|mumble|unclear|ran out)\b/i]) ? 0.08 : 0;
  const score = clamp(
    structure * 0.22 +
      sourceCoverage * 0.18 +
      reflection * 0.18 +
      selfSignal * 0.18 +
      audioSignal * 0.14 +
      finishSignal * 0.1 -
      hesitationPenalty,
  );

  const repairs = [
    structure < 0.8 ? 'Use a fixed opening: main idea, because, example, final sentence.' : '',
    sourceCoverage < 0.5 ? 'Add one source/task detail from the prompt instead of speaking generally.' : '',
    finishSignal < 0.8 ? 'Protect the final sentence even if you cut one detail.' : '',
    audioSignal < 0.8 ? 'Record audio so playback can catch speed, volume, and clarity.' : '',
    hesitationPenalty ? 'Redo with a 10-second opening limit to remove hesitation.' : '',
  ].filter(Boolean);

  const strengths = [
    structure >= 0.8 ? 'Uses clear response structure.' : '',
    sourceCoverage >= 0.5 ? 'Includes prompt/source detail.' : '',
    reflection >= 0.8 ? 'Reflection is specific enough to repair.' : '',
    hasAudio ? 'Audio evidence captured.' : '',
  ].filter(Boolean);
  const band = capReady(bandFor(score), sourceCoverage < 0.5 || audioSignal < 0.8 || finishSignal < 0.8 || Boolean(hesitationPenalty));
  const proofChecks = [
    {
      label: 'Recorded audio',
      passed: audioSignal >= 0.8,
      detail: hasAudio ? 'Audio playback exists for this attempt.' : 'No audio playback was saved for this attempt.',
    },
    {
      label: 'Prompt/source detail',
      passed: sourceCoverage >= 0.5,
      detail: sourceCoverage >= 0.5 ? 'Reflection references the task instead of only general delivery.' : 'Add a concrete task/source detail to the reflection.',
    },
    {
      label: 'Clean finish',
      passed: finishSignal >= 0.8,
      detail: finishSignal >= 0.8 ? 'Reflection indicates the answer finished cleanly.' : 'Confirm a complete final sentence after playback.',
    },
    {
      label: 'Low hesitation',
      passed: !hesitationPenalty,
      detail: hesitationPenalty ? 'Hesitation or unclear delivery was reported.' : 'No major hesitation marker was reported.',
    },
  ];

  return {
    score,
    band,
    summary: `Speaking signal ${Math.round(score * 100)}/100: ${repairs[0] ?? 'raise pressure with another timed recording.'}`,
    strengths,
    repairs: repairs.length ? repairs : ['Repeat under the same timer and focus on smoother delivery.'],
    proofChecks,
    metrics: {
      structure,
      sourceCoverage,
      reflection,
      selfSignal,
      audioSignal,
      finishSignal,
    },
  };
}

export function evaluateWritingAttempt(card: PracticeCard, draft: string, revision = ''): SkillEvaluation {
  const words = countWords(draft);
  const sentences = sentenceCount(draft);
  const combined = `${draft}\n${revision}`;
  const isDiscussion = /discussion|opinion|professor|student|classmate/i.test(card.title + card.prompt);
  const isIntegrated = /reading|lecture|listening|integrated|summarize|source/i.test(card.title + card.prompt);
  const lengthScore = words >= 120 && words <= 220 ? 1 : words >= 90 && words <= 260 ? 0.78 : words >= 60 ? 0.52 : 0.22;
  const stanceScore = hasAny(draft, [/\bi (think|believe|agree|disagree)\b/i, /\bmy (view|position|opinion)\b/i, /\bshould\b/i]) || isIntegrated ? 1 : 0.35;
  const structureScore = sentences >= 5 ? 1 : sentences >= 3 ? 0.72 : 0.35;
  const supportScore = hasAny(draft, [/\bbecause\b/i, /\bfor example\b/i, /\bfor instance\b/i, /\bthis means\b/i]) ? 1 : 0.35;
  const taskCoverage = isIntegrated
    ? keywordCoverage(draft, ['reading', 'lecture', 'professor'])
    : isDiscussion
      ? keywordCoverage(draft, ['student', 'class', 'discussion'])
      : keywordCoverage(draft, ['reason', 'example']);
  const revisionScore = countWords(revision) >= 20 ? 1 : countWords(revision) >= 8 ? 0.65 : 0.25;
  const repeatedErrorPenalty = [
    /\bmany student\b/i,
    /\bstudent speak\b/i,
    /\bteacher know\b/i,
    /\beven it is\b/i,
    /\bpeople is\b/i,
    /\bthey has\b/i,
  ].filter((pattern) => pattern.test(combined)).length * 0.04;

  const score = clamp(
    lengthScore * 0.18 +
      stanceScore * 0.14 +
      structureScore * 0.18 +
      supportScore * 0.18 +
      taskCoverage * 0.17 +
      revisionScore * 0.15 -
      repeatedErrorPenalty,
  );

  const repairs = [
    lengthScore < 0.8 ? `Move into the target range; this draft has ${words} words.` : '',
    stanceScore < 0.8 ? 'State your position in the first two sentences.' : '',
    structureScore < 0.8 ? 'Use at least three developed sentences plus a clear close.' : '',
    supportScore < 0.8 ? 'Add one concrete example and explain why it proves the point.' : '',
    taskCoverage < 0.45 ? 'Use task-specific language from the prompt or sources.' : '',
    revisionScore < 0.8 ? 'Do a real revision pass, not just a draft.' : '',
    repeatedErrorPenalty ? 'Fix repeated grammar patterns before adding new ideas.' : '',
  ].filter(Boolean);

  const strengths = [
    lengthScore >= 0.8 ? 'Word count is usable under test pressure.' : '',
    stanceScore >= 0.8 ? 'Position or source relationship is clear.' : '',
    supportScore >= 0.8 ? 'Includes support language.' : '',
    revisionScore >= 0.8 ? 'Revision evidence is present.' : '',
  ].filter(Boolean);
  const band = capReady(
    bandFor(score),
    lengthScore < 0.8 || structureScore < 0.8 || supportScore < 0.8 || taskCoverage < 0.45 || Boolean(repeatedErrorPenalty),
  );
  const proofChecks = [
    {
      label: 'Target length',
      passed: lengthScore >= 0.8,
      detail: lengthScore >= 0.8 ? `${words} words is in the usable range.` : `${words} words is outside the usable target range.`,
    },
    {
      label: 'Clear structure',
      passed: structureScore >= 0.8,
      detail: structureScore >= 0.8 ? `${sentences} developed sentences detected.` : 'Add a clearer beginning, support sentence, and close.',
    },
    {
      label: 'Concrete support',
      passed: supportScore >= 0.8,
      detail: supportScore >= 0.8 ? 'Support language such as because/example is present.' : 'Add one concrete example and explain it.',
    },
    {
      label: 'Task language',
      passed: taskCoverage >= 0.45,
      detail: taskCoverage >= 0.45 ? 'The response uses task/source language.' : 'Use vocabulary from the prompt or sources.',
    },
    {
      label: 'Revision evidence',
      passed: revisionScore >= 0.8,
      detail: revisionScore >= 0.8 ? 'A real revision pass is present.' : 'Add a short revision pass before trusting the score signal.',
    },
  ];

  return {
    score,
    band,
    summary: `Writing signal ${Math.round(score * 100)}/100: ${repairs[0] ?? 'run another timed response and tighten grammar.'}`,
    strengths,
    repairs: repairs.length ? repairs : ['Raise pressure with a timed response and one grammar-focused revision.'],
    proofChecks,
    metrics: {
      words,
      sentences,
      lengthScore,
      stanceScore,
      structureScore,
      supportScore,
      taskCoverage,
      revisionScore,
    },
  };
}
