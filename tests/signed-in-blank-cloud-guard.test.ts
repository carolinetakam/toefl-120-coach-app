// @vitest-environment jsdom

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoachApp } from '@/components/coach-app';

const saveAppState = vi.fn().mockResolvedValue(null);

vi.mock('@clerk/nextjs', () => ({
  UserButton: () => React.createElement('span', { 'data-testid': 'user-button' }, 'User'),
  useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: 'user_blank_guard' }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock('convex/react', () => ({
  useQuery: () => null,
  useMutation: () => saveAppState,
}));

vi.mock('@/convex/_generated/api', () => ({
  api: {
    coach: {
      getAppState: {},
      saveAppState: {},
      deleteMyData: {},
    },
  },
}));

describe('signed-in blank cloud guard', () => {
  beforeEach(() => {
    saveAppState.mockClear();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({ audit: { ready: true, checks: [], blockers: [] } }),
    }));
  });

  it('does not sync the default Learner profile over an empty cloud restore', async () => {
    await act(async () => {
      render(React.createElement(CoachApp));
    });

    await waitFor(() => expect(screen.getAllByText('Save Offline').length).toBeGreaterThan(0));
    expect(saveAppState).not.toHaveBeenCalled();
  });
});
