import jwt from "jsonwebtoken";

export const JWTAuthenticate = async (user) => {
  try {
    const accessToken = await generateJWTToken({ _id: user._id, role:user.role });
    return accessToken;
  } catch (error) {
    console.log(error);
  }
};

const generateJWTToken = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1w" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    )
  );

export const verifyJWT = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
      if (err) reject(err);
      else resolve(payload);
    })
  );
