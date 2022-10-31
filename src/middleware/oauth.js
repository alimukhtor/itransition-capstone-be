import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import GitHubStrategy from "passport-github";
import FacebookStrategy from "passport-facebook";
import { JWTAuthenticate } from "../middleware/tools.js";
import UsersModal from "../db/users/schema.js";

////////// LOG IN WITH GOOGLE ACCOUNT ///////////////
export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.CALLBACK_URL}/users/googleRedirect`,
  },

  async (accessToken, refreshToken, profile, passportNext) => {
    try {
      const user = await UsersModal.findOne({ googleId: profile.id });
      if (user) {
        const token = await JWTAuthenticate(user);
        passportNext(null, { token });
      } else {
        const newUser = new UsersModal({
          username: profile.name.givenName,
          email: profile.emails[0].value,
          googleId: profile.id,
          role: "user",
          status: "active",
        });
        const savedUser = await newUser.save()
        const token = await JWTAuthenticate(savedUser);
        passportNext(null, { token });
      }
    } catch (error) {
      passportNext(error);
    }
  }
);

passport.serializeUser(function (data, passportNext) {
  passportNext(null, data);
});

////////// LOG IN WITH FACEBOOK ACCOUNT ///////////////
export const facebookStrategy = new FacebookStrategy(
  {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_SECRET_KEY,
    callbackURL: `${process.env.CALLBACK_URL}/users/facebookRedirect`,
    profileFields: ["id", "email", "name"],
  },
  async (accessToken, refreshToken, profile, passportNext) => {
    try {
      const user = await UsersModal.findOne({ facebookId: profile.id });
      if (user) {
        const token = await JWTAuthenticate(user);
        passportNext(null, { token });
      } else {
        const newUser = new UsersModal({
          username: profile.name.givenName,
          email: `${profile.name.givenName}@facebook.com`,
          facebookId: profile.id,
          role: "user",
          status: "active",
        });
        const savedUser = await newUser.save()
        const token = await JWTAuthenticate(savedUser);
        console.log(token);
        passportNext(null, { token });
      }
    } catch (error) {
      console.log(error);
    }
  }
);

///////// LOG IN ITH GITHUB///////////////
export const gitHubStrategy = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_SECRET_KEY,
    callbackURL: `${process.env.CALLBACK_URL}/users/githubRedirect`,
    profileFields: ["id", "email", "username"],
  },
  async (accessToken, refreshToken, profile, passportNext) => {
    try {
      console.log("Github:", profile);
      const user = await UsersModal.findOne({ githubId: profile.id });
      if (user) {
        console.log("passport.initialize()");
        const token = await JWTAuthenticate(user);
        passportNext(null, { token });
      } else {
        const newUser = new UsersModal({
          username: profile.username,
          email: `${profile.username}@github.com`,
          githubId: profile.id,
          role: "user",
          status: "active",
        });

        const savedUser = await newUser.save()
        const token = await JWTAuthenticate(savedUser);
        passportNext(null, { token });
      }
    } catch (error) {
      console.log(error);
    }
  }
);
