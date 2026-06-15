import { v } from 'convex/values';
import { appState } from './appState';
import { mutation, query } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';

async function getUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    console.log('CONVEX_AUTH_STATE', {
      operation: 'getUserId',
      hasIdentity: false,
      identifierUsed: 'tokenIdentifier',
    });
    return null;
  }

  const existing = await findExistingUser(ctx, identity);
  console.log('CONVEX_AUTH_STATE', {
    operation: 'getUserId',
    hasIdentity: true,
    identifierUsed: 'tokenIdentifier',
    hasSubject: Boolean(identity.subject),
    hasTokenIdentifier: Boolean(identity.tokenIdentifier),
    matchedUser: Boolean(existing),
  });

  return existing?._id ?? null;
}

async function findExistingUser(ctx: QueryCtx | MutationCtx, identity: NonNullable<Awaited<ReturnType<QueryCtx['auth']['getUserIdentity']>>>) {
  const byToken = await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();
  if (byToken) return byToken;

  if (identity.subject) {
    const bySubject = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', identity.subject))
      .unique();
    if (bySubject) return bySubject;
  }

  if (identity.email) {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email))
      .unique();
  }

  return null;
}

async function requireUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');

  const existing = await findExistingUser(ctx, identity);

  console.log('CONVEX_AUTH_STATE', {
    operation: 'requireUser',
    hasIdentity: true,
    identifierUsed: 'tokenIdentifier',
    hasSubject: Boolean(identity.subject),
    hasTokenIdentifier: Boolean(identity.tokenIdentifier),
    matchedUser: Boolean(existing),
  });

  if (existing) {
    await ctx.db.patch(existing._id, {
      tokenIdentifier: identity.tokenIdentifier,
      subject: identity.subject,
      email: identity.email,
      name: identity.name,
      updatedAt: Date.now(),
    });
    return existing._id;
  }

  return await ctx.db.insert('users', {
    tokenIdentifier: identity.tokenIdentifier,
    subject: identity.subject,
    email: identity.email,
    name: identity.name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export const getSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return { profile: null, progress: null, dueReviews: [], recentPractice: [] };

    const [profile, progress] = await Promise.all([
      ctx.db.query('profiles').withIndex('by_userId', (q) => q.eq('userId', userId)).unique(),
      ctx.db.query('progress').withIndex('by_userId', (q) => q.eq('userId', userId)).unique(),
    ]);

    const dueReviews = await ctx.db
      .query('reviewCards')
      .withIndex('by_user_dueDate', (q) => q.eq('userId', userId))
      .take(20);

    const recentPractice = await ctx.db
      .query('practiceResults')
      .withIndex('by_user_completedAt', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);

    return { profile, progress, dueReviews, recentPractice };
  },
});

export const saveProfile = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.query('profiles').withIndex('by_userId', (q) => q.eq('userId', userId)).unique();
    const doc = { ...args, userId, updatedAt: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }

    return await ctx.db.insert('profiles', doc);
  },
});

export const getAppState = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      console.log('CLOUD_RESTORE_BACKEND_RESULT', {
        hasUser: false,
        hasState: false,
      });
      return null;
    }

    const appState = await ctx.db.query('appStates').withIndex('by_userId', (q) => q.eq('userId', userId)).unique();
    console.log('CLOUD_RESTORE_BACKEND_RESULT', {
      hasUser: true,
      hasState: Boolean(appState),
    });
    return appState;
  },
});

export const saveAppState = mutation({
  args: {
    schemaVersion: v.optional(v.number()),
    state: appState,
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.query('appStates').withIndex('by_userId', (q) => q.eq('userId', userId)).unique();
    const doc = { userId, schemaVersion: args.schemaVersion ?? 1, state: args.state, updatedAt: Date.now() };
    console.log('CLOUD_SAVE_BACKEND_START', {
      hasExistingState: Boolean(existing),
      hasProfile: Boolean(args.state.profile),
      diagnosticCompleted: Boolean(args.state.diagnosticCompleted),
      progressCounts: {
        practiceHistory: args.state.practiceHistory.length,
        reviewQueue: args.state.reviewQueue.length,
        miniMockAttempts: args.state.miniMockAttempts?.length ?? 0,
      },
      xp: args.state.xp,
      streak: args.state.streak,
    });

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      console.log('CLOUD_SAVE_BACKEND_SUCCESS', { mode: 'patch' });
      return doc.state;
    }

    await ctx.db.insert('appStates', doc);
    console.log('CLOUD_SAVE_BACKEND_SUCCESS', { mode: 'insert' });
    return doc.state;
  },
});

export const deleteMyData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    for (const table of ['profiles', 'progress', 'appStates', 'practiceResults', 'reviewCards', 'errorEntries', 'writingDrafts', 'speakingAttempts'] as const) {
      const docs = await ctx.db.query(table).withIndex('by_userId', (q) => q.eq('userId', userId)).collect();
      await Promise.all(docs.map((doc) => ctx.db.delete(doc._id)));
    }
  },
});
