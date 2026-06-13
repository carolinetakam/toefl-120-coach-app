import { describe, expect, it } from 'vitest';
import { mockTests } from '@/lib/mock-tests';
import { resolveMockSelection, resolvePracticeCardSelection } from '@/lib/selection-recovery';
import { practiceCards } from '@/lib/seed';

describe('selection recovery', () => {
  it('keeps valid practice card selections silent', () => {
    const selected = practiceCards.reading[0];

    expect(resolvePracticeCardSelection(practiceCards.reading, selected.id, 'reading')).toEqual({
      item: selected,
      recoveryMessage: null,
    });
  });

  it('recovers stale practice card selections with a visible learner message', () => {
    const recovered = resolvePracticeCardSelection(practiceCards.reading, 'deleted-practice-card', 'reading');

    expect(recovered.item.id).toBe(practiceCards.reading[0].id);
    expect(recovered.recoveryMessage).toMatch(/saved reading practice item is no longer available/i);
    expect(recovered.recoveryMessage).toMatch(/next approved reading drill/i);
  });

  it('throws when a section has no approved practice cards instead of hiding the content failure', () => {
    expect(() => resolvePracticeCardSelection([], 'missing', 'reading')).toThrow(/No approved practice cards/i);
  });

  it('keeps valid mock selections silent', () => {
    const selected = mockTests[0];

    expect(resolveMockSelection(mockTests, selected.id)).toEqual({
      item: selected,
      recoveryMessage: null,
    });
  });

  it('recovers stale mock selections with a visible learner message', () => {
    const recovered = resolveMockSelection(mockTests, 'deleted-mini-mock');

    expect(recovered.item.id).toBe(mockTests[0].id);
    expect(recovered.recoveryMessage).toMatch(/saved mini mock is no longer available/i);
    expect(recovered.recoveryMessage).toMatch(/next approved mini mock/i);
  });

  it('throws when no approved mini mocks exist instead of hiding the content failure', () => {
    expect(() => resolveMockSelection([], 'missing')).toThrow(/No approved mini mocks/i);
  });
});
