import { db, connection } from './index';
import { user, session, account, verification } from './schema';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Create tables using raw SQL since drizzle-kit is having issues
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "emailVerified" boolean DEFAULT false NOT NULL,
        "image" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "user_email_unique" UNIQUE("email")
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" text PRIMARY KEY NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "token" text NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        "ipAddress" text,
        "userAgent" text,
        "userId" text NOT NULL,
        CONSTRAINT "session_token_unique" UNIQUE("token")
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" text PRIMARY KEY NOT NULL,
        "accountId" text NOT NULL,
        "providerId" text NOT NULL,
        "userId" text NOT NULL,
        "accessToken" text,
        "refreshToken" text,
        "idToken" text,
        "accessTokenExpiresAt" timestamp,
        "refreshTokenExpiresAt" timestamp,
        "scope" text,
        "password" text,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" text PRIMARY KEY NOT NULL,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `);

    // Add foreign key constraints
    await db.execute(sql`
      ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade;
    `);

    await db.execute(sql`
      ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade;
    `);

    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (import.meta.main) {
  migrate().catch(console.error);
}

export { migrate };