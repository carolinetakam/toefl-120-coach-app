import { MockTest } from '@/lib/mock-tests';
import { PracticeCard, Section } from '@/lib/types';

export interface SelectionRecovery<T> {
  item: T;
  recoveryMessage: string | null;
}

export function resolvePracticeCardSelection(cards: PracticeCard[], selectedCardId: string, section: Section): SelectionRecovery<PracticeCard> {
  if (cards.length === 0) {
    throw new Error(`No approved practice cards are available for ${section}.`);
  }

  const selected = cards.find((card) => card.id === selectedCardId);
  if (selected) {
    return { item: selected, recoveryMessage: null };
  }

  return {
    item: cards[0],
    recoveryMessage: `The saved ${section} practice item is no longer available. Showing the next approved ${section} drill instead.`,
  };
}

export function resolveMockSelection(mockTests: MockTest[], currentMockId: string): SelectionRecovery<MockTest> {
  if (mockTests.length === 0) {
    throw new Error('No approved mini mocks are available.');
  }

  const selected = mockTests.find((mock) => mock.id === currentMockId);
  if (selected) {
    return { item: selected, recoveryMessage: null };
  }

  return {
    item: mockTests[0],
    recoveryMessage: 'The saved mini mock is no longer available. Showing the next approved mini mock instead.',
  };
}
