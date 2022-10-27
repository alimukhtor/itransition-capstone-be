import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
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
        console.log("Tokennn", token);
        passportNext(null, { token, });
      } else {
        const newUser = new UsersModal({
          first_name: profile.name.givenName,
          last_name: profile.name.familyName,
          email: profile.emails[0].value,
          googleId: profile.id,
        });
        // const savedUser = await newUser.save()
        // console.log("as", newUser);
        const token = await JWTAuthenticate(newUser);
        console.log(token);
        passportNext(null, { token });
      }
    } catch (error) {
      // passportNext(error)
    }
  }
);

passport.serializeUser(function (data, passportNext) {
  passportNext(null, data);
});
