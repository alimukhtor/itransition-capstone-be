import express from "express";
import UsersModel from "./schema.js";
import createHttpError from "http-errors";
import { JWTAuthenticate } from "../../auth/tools.js";
import { JWTAuthMiddleware } from "../../auth/token.js";

const userRouter = express.Router();
userRouter.get("/", async (req, res, next) => {
  try {
    const user = await UsersModel.find();
    res.send(user);
  } catch (error) {
    next(error);
  }
});

userRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.send({ message: "No Token Provided!" });
    const users = await UsersModel.findById(req.user);
    if (users) {
      res.status(200).send(users);
    } else {
      next(createHttpError(404, "User not found!"));
    }
  } catch (error) {
    next(error);
  }
});

userRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updateUser = await UsersModel.findByIdAndUpdate(req.user, req.body, {
      new: true,
    });
    if (updateUser) {
      res.status(204).send(updateUser);
    } else {
      createHttpError(404, `User with this ${userId} not found!`);
    }
  } catch (error) {
    next(error);
  }
});

userRouter.post("/register", async (req, res, next) => {
  try {
    console.log("REQ USER", req.user);
    const { username, email, password } = req.body;
    if (!(username && email && password)) {
      res.status(200).send({ msg: "All the fields are required!" });
    }
    const oldUser = await UsersModel.findOne({ email });
    if (oldUser) {
      res.status(409).send({ msg: "User already exist with this email!" });
    }
    const user = new UsersModel(req.body);
    const { _id } = await user.save();
    console.log("ID", _id);
    res.status(204).send({ _id });
  } catch (error) {
    next(error);
  }
});

userRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!(email && password))
      res.status(204).send({ msg: "All fields are required!" });
    const user = await UsersModel.checkCredentials(email, password);
    if (user) {
      const accessToken = await JWTAuthenticate(user);
      res.send({ accessToken });
    } else {
      next(
        createHttpError(401, "Credentials are not ok. User does not exist!")
      );
    }
  } catch (error) {
    next(error);
  }
});

userRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const deleteUser = await UsersModel.findByIdAndDelete(userId);
    if (deleteUser) {
      res.status(204).send({ msg: `User with id of ${userId} deleted!` });
    } else {
      createHttpError(404, `User with this ${userId} not found!`);
    }
  } catch (error) {
    next(error);
  }
});

userRouter.put("/:id", async (req, res, next) => {
  try {
    const updateUser = await UsersModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (updateUser) {
      res.status(204).send(updateUser);
    } else {
      createHttpError(404, `User with this ${userId} not found!`);
    }
  } catch (error) {
    next(error);
  }
});
export default userRouter;
