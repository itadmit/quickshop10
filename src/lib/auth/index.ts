import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { db } from '@/lib/db';
import { users, sessions, accounts, stores } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Custom Drizzle Adapter
const DrizzleAdapter = {
  async createUser(data: { email: string; name?: string; image?: string }) {
    const [user] = await db.insert(users).values({
      email: data.email,
      name: data.name || null,
      avatarUrl: data.image || null,
      emailVerifiedAt: new Date(),
    }).returning();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.avatarUrl,
      emailVerified: user.emailVerifiedAt,
    };
  },
  
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.avatarUrl,
      emailVerified: user.emailVerifiedAt,
    };
  },
  
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.avatarUrl,
      emailVerified: user.emailVerifiedAt,
    };
  },
  
  async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, providerAccountId)
      ))
      .limit(1);
    
    if (!account) return null;
    
    const [user] = await db.select().from(users).where(eq(users.id, account.userId)).limit(1);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.avatarUrl,
      emailVerified: user.emailVerifiedAt,
    };
  },
  
  async updateUser(data: { id: string; email?: string; name?: string; image?: string; emailVerified?: Date }) {
    const [user] = await db
      .update(users)
      .set({
        email: data.email,
        name: data.name,
        avatarUrl: data.image,
        emailVerifiedAt: data.emailVerified,
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.id))
      .returning();
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.avatarUrl,
      emailVerified: user.emailVerifiedAt,
    };
  },
  
  async linkAccount(data: {
    userId: string;
    provider: string;
    providerAccountId: string;
    type: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    token_type?: string;
    scope?: string;
    id_token?: string;
  }) {
    await db.insert(accounts).values({
      userId: data.userId,
      provider: data.provider,
      providerAccountId: data.providerAccountId,
      type: data.type,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      tokenType: data.token_type,
      scope: data.scope,
      idToken: data.id_token,
    });
    return data;
  },
  
  async createSession(data: { userId: string; sessionToken: string; expires: Date }) {
    const [session] = await db.insert(sessions).values({
      userId: data.userId,
      sessionToken: data.sessionToken,
      expires: data.expires,
    }).returning();
    return {
      userId: session.userId,
      sessionToken: session.sessionToken,
      expires: session.expires,
    };
  },
  
  async getSessionAndUser(sessionToken: string) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionToken, sessionToken))
      .limit(1);
    
    if (!session) return null;
    
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user) return null;
    
    return {
      session: {
        userId: session.userId,
        sessionToken: session.sessionToken,
        expires: session.expires,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatarUrl,
        emailVerified: user.emailVerifiedAt,
      },
    };
  },
  
  async updateSession(data: { sessionToken: string; userId?: string; expires?: Date }) {
    const [session] = await db
      .update(sessions)
      .set({
        userId: data.userId,
        expires: data.expires,
      })
      .where(eq(sessions.sessionToken, data.sessionToken))
      .returning();
    
    if (!session) return null;
    return {
      userId: session.userId,
      sessionToken: session.sessionToken,
      expires: session.expires,
    };
  },
  
  async deleteSession(sessionToken: string) {
    await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter as any,
  session: {
    strategy: 'jwt', // JWT works better with Credentials
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
  },
  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    
    // Email + Password
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('אנא הזן אימייל וסיסמה');
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          throw new Error('אימייל או סיסמה שגויים');
        }

        if (!user.passwordHash) {
          throw new Error('אנא התחבר באמצעות Google');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error('אימייל או סיסמה שגויים');
        }

        // Update last login
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // First time jwt callback is called, user object is available
      if (user) {
        token.id = user.id;
        
        // Get user's store
        const [store] = await db
          .select({ id: stores.id, slug: stores.slug, name: stores.name })
          .from(stores)
          .where(eq(stores.ownerId, user.id as string))
          .limit(1);
        
        if (store) {
          token.storeId = store.id;
          token.storeSlug = store.slug;
          token.storeName = store.name;
        }
        
        // Get user role
        const [dbUser] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, user.id as string))
          .limit(1);
        
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // @ts-expect-error - Adding custom property
        session.user.storeId = token.storeId;
        // @ts-expect-error - Adding custom property
        session.user.storeSlug = token.storeSlug;
        // @ts-expect-error - Adding custom property
        session.user.storeName = token.storeName;
        // @ts-expect-error - Adding custom property
        session.user.role = token.role;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth, check if user exists
      if (account?.provider === 'google' && user.email) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        
        // Update last login for existing users
        if (existingUser) {
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, existingUser.id));
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Send welcome email when user is created via OAuth
      if (user.email) {
        const { sendWelcomeEmail } = await import('@/lib/email');
        await sendWelcomeEmail(user.email, user.name || undefined);
      }
    },
  },
  trustHost: true,
});

// ============ HELPER FUNCTIONS ============

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function getUserStore(userId: string) {
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.ownerId, userId))
    .limit(1);
  return store;
}

