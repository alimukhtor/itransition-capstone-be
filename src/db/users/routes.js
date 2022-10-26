import express from "express";
import UsersModal from "./schema.js";
import createHttpError from "http-errors";
import { JWTAuthenticate } from "../../middleware/tools.js";
import { JWTAuthMiddleware } from "../../middleware/authentication.js";
import CollectionModal from "../collections/schema.js";
import { adminOnly } from "../../middleware/authorization.js";
import passport from "passport";
const userRouter = express.Router();

//get all users
userRouter.get(
  "/allUsers",
  JWTAuthMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const users = await UsersModal.find({}).populate({
        path: "collections",
        populate: [
          {
            path: "items",
            model: "Item",
          },
        ],
      });
      if (!users)
        return next(createHttpError(404, "Bad request. Users not found"));
      res.status(200).send(users);
    } catch (error) {
      next(error);
    }
  }
);

// get user themself
userRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModal.findById(req.user._id);
    res.status(200).send(user);
  } catch (error) {
    next(error);
  }
});

// get user items
userRouter.get("/me/stories", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const collection = await CollectionModal.find({
      owner: req.user._id,
    });
    res.status(200).send(collection);
  } catch (error) {
    next(error);
  }
});

// get single user
userRouter.get("/:userId", adminOnly, async (req, res, next) => {
  try {
    if (req.params.userId.length !== 24)
      return next(createHttpError(400, "Invalid ID"));
    const user = await UsersModal.findById(req.params.userId);
    if (!user)
      return next(
        createHttpError(
          400,
          `The id ${req.params.userId} does not match any users`
        )
      );
    res.send(user);
  } catch (error) {
    res.send(500).send({ message: error.message });
  }
});

// create user
userRouter.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!(username && email && password)) {
      res.status(200).send({ msg: "All the fields are required!" });
    }
    const oldUser = await UsersModal.findOne({ email });
    if (oldUser) {
      res.status(409).send({ msg: "User already exist with this email!" });
    }
    const user = new UsersModal(req.body);
    const { _id } = await user.save();
    res.status(204).send({ _id });
  } catch (error) {
    next(error);
  }
});

// user login
userRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!(email && password))
      res.status(204).send({ msg: "All fields are required!" });
    const user = await UsersModal.checkCredentials(email, password);
    if (!user)
      return next(
        createHttpError(401, "Credentials are not ok. User does not exist!")
      );
    const accessToken = await JWTAuthenticate(user);
    res.status(200).send({ accessToken, user });
  } catch (error) {
    next(error);
  }
});

userRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

userRouter.get(
  "/googleRedirect",
  passport.authenticate("google", {
    failureRedirect: `${process.env.GOOGLE_FE_URL}`,
  }),
  async (req, res, next) => {
    try {
      console.log("Token:", process.env.GOOGLE_FE_URL);
      console.log("Hi");
      console.log("Token:", req.user.token);
      res.redirect(
        `${process.env.GOOGLE_FE_URL}?accessToken=${req.user.token}`
      );
    } catch (error) {
      next(error);
    }
  }
);

// deletes user only by admins
userRouter.delete(
  "/deleteUsers",
  JWTAuthMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const selectedUsers = req.body;
      console.log("ROLE", req.user.role);
      console.log("selectedUsers id", selectedUsers);
      UsersModal.deleteMany(
        {
          _id: {
            $in: selectedUsers,
          },
        },
        function (err, result) {
          if (err) {
            res.status(404).send(err);
          } else {
            res.status(200).send(selectedUsers);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

userRouter.put(
  "/updateUserStatus",
  JWTAuthMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const { title, isChecked } = req.body;
      UsersModal.updateMany(
        {
          _id: {
            $in: isChecked,
          },
        },
        { $set: { status: title } },
        { multi: true },
        function (err, result) {
          if (err) {
            res.status(404).send(err);
          } else {
            res.status(200).send(isChecked);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

userRouter.put(
  "/updateUserRole",
  JWTAuthMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const { title, isChecked } = req.body;
      UsersModal.updateMany(
        {
          _id: {
            $in: isChecked,
          },
        },
        { $set: { role: title } },
        { multi: true },
        function (err, result) {
          if (err) {
            res.status(404).send(err);
          } else {
            res.status(200).send(isChecked);
          }
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

// update user
// userRouter.put(
//   "/:userId",
//   JWTAuthMiddleware,
//   adminAndUserOnly,
//   async (req, res, next) => {
//     try {
//       if (req.params.userId.length !== 24)
//         return next(createHttpError(400, "Invalid ID"));
//       const updatedUser = await UsersModal.findByIdAndUpdate(
//         req.params.userId,
//         req.body,
//         { new: true }
//       );
//       if (!updatedUser)
//         return next(
//           createHttpError(
//             400,
//             `The id ${req.params.userId} does not match any users`
//           )
//         );
//       res.send(updatedUser);
//     } catch (error) {
//       next(error);
//     }
//   }
// );
export default userRouter;
