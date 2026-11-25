
import type { Profile } from "passport-google-oauth20";

import db from "../../config/database";

export interface AuthUser {
  id: number | string;
  googleId: string;
  name: string;
  email: string;
  avatar?: string;
}

interface UserDatabaseRow {
  id: number | string;
  google_id: string;
  name: string;
  email: string;
  avatar: string | null;
}

function mapUser(row: UserDatabaseRow): AuthUser {
  return {
    id: row.id,
    googleId: row.google_id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? undefined
  };
}

/**
 * Find an existing Google user or create a new one.
 */
export async function findOrCreateGoogleUser(
  profile: Profile
): Promise<AuthUser> {
  const googleId = profile.id;

  const email = profile.emails?.[0]?.value
    ?.trim()
    .toLowerCase();

  const name = profile.displayName?.trim();

  const avatar = profile.photos?.[0]?.value ?? null;

  // Only accept verified Google email addresses.
  const emailVerified =
    profile._json?.email_verified === true;

  if (!googleId) {
    throw new Error("Google account ID is missing");
  }

  if (!email) {
    throw new Error("Google account email is missing");
  }

  if (!emailVerified) {
    throw new Error("Google email address is not verified");
  }

  const user = await db.transaction(async (trx) => {
    // First check whether this Google account already exists.
    const existingGoogleUser = await trx("users")
      .where({ google_id: googleId })
      .first() as UserDatabaseRow | undefined;

    if (existingGoogleUser) {
      await trx("users")
        .where({ id: existingGoogleUser.id })
        .update({
          name: name || existingGoogleUser.name,
          email,
          avatar,
          updated_at: trx.fn.now()
        });

      const updatedUser = await trx("users")
        .where({ id: existingGoogleUser.id })
        .first() as UserDatabaseRow;

      return mapUser(updatedUser);
    }

    // Check whether this verified email already belongs to a user.
    const existingEmailUser = await trx("users")
      .where({ email })
      .first() as UserDatabaseRow | undefined;

    if (existingEmailUser) {
      // Link the verified Google account to the existing user.
      await trx("users")
        .where({ id: existingEmailUser.id })
        .update({
          google_id: googleId,
          name: name || existingEmailUser.name,
          avatar,
          updated_at: trx.fn.now()
        });

      const linkedUser = await trx("users")
        .where({ id: existingEmailUser.id })
        .first() as UserDatabaseRow;

      return mapUser(linkedUser);
    }

    // Create a new user.
    await trx("users").insert({
      google_id: googleId,
      name: name || email.split("@")[0],
      email,
      avatar,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    const newUser = await trx("users")
      .where({ google_id: googleId })
      .first() as UserDatabaseRow | undefined;

    if (!newUser) {
      throw new Error("Could not create Google user");
    }

    return mapUser(newUser);
  });

  return user;
}

/**
 * Retrieve an authenticated user by database ID.
 */
export async function getUserById(
  id: string | number
): Promise<AuthUser | null> {
  const user = await db("users")
    .where({ id })
    .first() as UserDatabaseRow | undefined;

  return user ? mapUser(user) : null;
}
