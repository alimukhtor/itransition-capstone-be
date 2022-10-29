module.exports = {
  googleAuth: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.CALLBACK_URL}/users/googleRedirect`,
    profileFields: ["id", "email", "name"],
  },

  facebookAuth: {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_SECRET_KEY,
    callbackURL: `${process.env.CALLBACK_URL}/users/facebookRedirect`,
    profileFields: ["id", "email", "name"],
  },

  //   githubAuth: {
  //     clientID: "your-secret-clientID-here",
  //     clientSecret: "your-client-secret-here",
  //     callbackURL: "http://localhost:8080/auth/google/callback",
  //   },
};
