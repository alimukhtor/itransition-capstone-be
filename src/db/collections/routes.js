import express from "express";
import createHttpError from "http-errors";
import { JWTAuthMiddleware } from "../../middleware/authentication.js";
import { adminOnly } from "../../middleware/authorization.js";
import CollectionModel from "./schema.js";
import { uuid } from "uuidv4";

const collectionRouter = express.Router();

// all collections for admin
collectionRouter.get(
  "/allCollections",
  JWTAuthMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const getAllCollections = await CollectionModel.find({}).populate("user");
      res.status(200).send(getAllCollections);
    } catch (error) {
      next(error);
    }
  }
);

// full text search engine for collections
collectionRouter.get("/search", async (req, res, next) => {
  try {
    const { title } = req.query;
    const searchCollection = await CollectionModel.find({
      $text: { $search: title },
    });
    res.status(200).send(searchCollection);
  } catch (error) {
    next(error);
  }
});

// get collection
collectionRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const collections = await CollectionModel.find({ user: req.user._id });
    console.log("collections", collections);
    res.send(collections);
  } catch (error) {
    next(error);
  }
});

// create collection
collectionRouter.post("/", async (req, res, next) => {
  try {
    const collection = new CollectionModel(req.body);
    const { _id } = await collection.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

//updates collection
collectionRouter.put("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const collection = await CollectionModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(201).send(collection);
  } catch (error) {
    next(error);
  }
});

// deletes collection
collectionRouter.delete("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await CollectionModel.findByIdAndDelete(req.params.id);
    res
      .status(201)
      .send({ msg: `Collection with a id of ${req.params.id} deleted!` });
  } catch (error) {
    next(error);
  }
});

//get comments for specific collection
collectionRouter.get("/:collectionId/comments", async (req, res, next) => {
  try {
    if (req.params.collectionId.length !== 24)
      return next(createHttpError(400, "Invalid ID"));
    const collections = await CollectionModel.findById(req.params.collectionId);
    if (!collections)
      return next(
        createHttpError(
          400,
          `The id ${req.params.collectionId} does not match any collections`
        )
      );
    res.status(200).send(collections);
  } catch (error) {
    next(error);
  }
});

// create comment for specific collection
collectionRouter.post(
  "/:collectionId/comments",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      if (req.params.collectionId.length !== 24)
        return next(createHttpError(400, "Invalid ID"));
      const collection = await CollectionModel.findByIdAndUpdate(
        req.params.collectionId,
        {
          $push: { comments: { ...req.body, user: req.user._id, id: uuid() } },
        },
        { new: true }
      ).populate({
        path: "user",
        select: "username",
      });
      if (!collection)
        return next(
          createHttpError(
            400,
            `The id ${req.params.collectionId} does not match any collections`
          )
        );
      res.send(collection);
    } catch (error) {
      next(error);
    }
  }
);

// delete comment for specific collection
collectionRouter.delete(
  "/:collectionId/comments/:commentId",
  async (req, res, next) => {
    try {
      const collection = await CollectionModel.findById(
        req.params.collectionId
      );
      if (!collection) {
        res
          .status(404)
          .send({
            message: `collection with ${req.params.collectionId} is not found!`,
          });
      } else {
        await CollectionModel.findByIdAndUpdate(
          req.params.collectionId,
          {
            $pull: { comments: { _id: req.params.commentId } },
          },
          { new: true }
        );
        res.status(204).send();
      }
    } catch (error) {
      console.log(error);
      res.send(500).send({ message: error.message });
    }
  }
);

// adds like
collectionRouter.post(
  "/:collectionId/add-like",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const collection = await CollectionModel.findByIdAndUpdate(
        req.params.collectionId,
        { $push: { likes: req.user._id } },
        { new: true }
      );
      if (!collection)
        return next(
          createHttpError(
            404,
            `The id ${req.params.collectionId} does not match any collections`
          )
        );
      res.send(collection);
    } catch (error) {
      next(error);
    }
  }
);

//removes like
collectionRouter.post("/:collectionId/remove-like", async (req, res, next) => {
  try {
    const collection = await CollectionModel.findByIdAndUpdate(
      req.params.collectionId,
      { $pull: { likes: req.user._id } },
      { new: true }
    );
    if (!collection)
      return next(
        createHttpError(
          404,
          `The id ${req.params.collectionId} does not match any collections`
        )
      );
    res.send(collection);
  } catch (error) {
    next(error);
  }
});

export default collectionRouter;
