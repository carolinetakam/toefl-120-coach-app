import type { SprintAction } from '@/lib/sprint';
import type { Section as AppSection } from '@/lib/types';

export type Section = AppSection;
export type CoachingConfidence = 'low' | 'medium' | 'high';
export type PredictionSource = 'mini_mock' | 'diagnostic' | 'practice' | 'onboarding' | 'insufficient_data';
export type NextActionPriority = 'diagnostic' | 'required_repair' | 'largest_bottleneck' | 'current_path' | 'mini_mock';

export interface SectionScores {
  reading: number;
  listening: number;
  speaking: number;
  writing: number;
}

export interface TrendPoint {
  date: string;
  predictedScore: number;
  sectionScores: SectionScores;
}

export interface Bottleneck {
  id: string;
  section: Section;
  title: string;
  description: string;
  severity: number;
  evidenceCount: number;
  estimatedScoreLoss: number;
  recommendedFocus: string;
}

export interface NextAction {
  id: string;
  title: string;
  reason: string;
  section: Section;
  estimatedMinutes: number;
  expectedImpact: number;
  href: string;
  priority: NextActionPriority;
  source?: SprintAction | { type: 'diagnostic' };
}

export interface WeeklyCoachingReport {
  weekStart: string;
  weekEnd: string;
  startingPredictedScore: number;
  endingPredictedScore: number;
  improvement: number;
  strongestSection: Section;
  weakestSection: Section;
  topBottleneck?: Bottleneck;
  recommendedFocus: string;
}

export interface CoachingProfile {
  predictionSource: PredictionSource;
  predictionAvailable: boolean;
  predictedScore: number;
  targetScore?: number;
  scoreGap?: number;
  sectionScores: SectionScores;
  strongestSection: Section;
  weakestSection: Section;
  confidence: CoachingConfidence;
  bottlenecks: Bottleneck[];
  nextBestAction: NextAction;
  scoreTrend: TrendPoint[];
  weeklyReport?: WeeklyCoachingReport;
  generatedAt: string;
}
