
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { env } from "./env";

import {
  findOrCreateGoogleUser,
  getUserById
} from "../modules/auth/auth.service";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
      state: true
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser(profile);

        done(null, user);
      } catch (error) {
        done(
          error instanceof Error
            ? error
            : new Error("Google authentication failed")
        );
      }
    }
  )
);

/*
 * Store only the database user ID in the session.
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/*
 * Retrieve the user from MySQL for each authenticated session.
 */

passport.deserializeUser(async (id: unknown, done) => {
  try {
    // Validate the session user ID.
    if (
      typeof id !== "string" &&
      typeof id !== "number"
    ) {
      done(null, false);
      return;
    }

    const user = await getUserById(id);

    if (!user) {
      done(null, false);
      return;
    }

    done(null, user);

  } catch (error) {
    done(
      error instanceof Error
        ? error
        : new Error("Could not retrieve authenticated user")
    );
  }
});


export default passport;
