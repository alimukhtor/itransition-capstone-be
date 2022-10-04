import express from "express";
import createHttpError from "http-errors";
import { JWTAuthMiddleware } from "../../middleware/authentication.js";
import { adminOnly } from "../../middleware/authorization.js";
import ItemModal from "./schema.js";
import { uuid } from "uuidv4";
import { v2 as Cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const itemRouter = express.Router();

// Cloudinary config
Cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: Cloudinary,
  params: {
    folder: "Itransition_Capstone",
    format: async (req, file) => "png", // supports promises as well
    public_id: (req, file) => "new",
  },
});

const parser = multer({ storage: storage });

// image upload for specific item
itemRouter.post(
  "/:itemId",
  parser.single("image"),
  async (req, res, next) => {
    try {
      if (req.params.itemId.length !== 24)
        return next(createHttpError(400, "Invalid ID"));
      const item = await ItemModal.findById(
        req.params.itemId
      );
      if (item) {
        await item.updateOne({ image: req.file.path });
        res.send(item);
      } else {
        next(
          createHttpError(
            404,
            `The item with id ${req.params.itemId} not found.`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

// all items for admin
itemRouter.get(
  "/allitems",
  JWTAuthMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const getAllitems = await ItemModal.find({}).populate("user");
      res.status(200).send(getAllitems);
    } catch (error) {
      next(error);
    }
  }
);

// full text search engine for items
itemRouter.get("/search", async (req, res, next) => {
  try {
    const { title } = req.query;
    const searchitem = await ItemModal.find({
      $text: { $search: title },
    });
    res.status(200).send(searchitem);
  } catch (error) {
    next(error);
  }
});

// get item
itemRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const items = await ItemModal.find({ user: req.user._id });
    console.log("items", items);
    res.send(items);
  } catch (error) {
    next(error);
  }
});

// create item
itemRouter.post("/", async (req, res, next) => {
  try {
    const item = new ItemModal(req.body);
    const { _id } = await item.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

//updates item
itemRouter.put("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const item = await ItemModal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(201).send(item);
  } catch (error) {
    next(error);
  }
});

// deletes item
itemRouter.delete("/:id", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await ItemModal.findByIdAndDelete(req.params.id);
    res
      .status(201)
      .send({ msg: `item with a id of ${req.params.id} deleted!` });
  } catch (error) {
    next(error);
  }
});

//get comments for specific item
itemRouter.get("/:itemId/comments", async (req, res, next) => {
  try {
    if (req.params.itemId.length !== 24)
      return next(createHttpError(400, "Invalid ID"));
    const items = await ItemModal.findById(req.params.itemId);
    if (!items)
      return next(
        createHttpError(
          400,
          `The id ${req.params.itemId} does not match any items`
        )
      );
    res.status(200).send(items);
  } catch (error) {
    next(error);
  }
});

// create comment for specific item
itemRouter.post(
  "/:itemId/comments",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      if (req.params.itemId.length !== 24)
        return next(createHttpError(400, "Invalid ID"));
      const item = await ItemModal.findByIdAndUpdate(
        req.params.itemId,
        {
          $push: { comments: { ...req.body, user: req.user._id, id: uuid() } },
        },
        { new: true }
      ).populate({
        path: "user",
        select: "username",
      });
      if (!item)
        return next(
          createHttpError(
            400,
            `The id ${req.params.itemId} does not match any items`
          )
        );
      res.send(item);
    } catch (error) {
      next(error);
    }
  }
);

// delete comment for specific item
itemRouter.delete(
  "/:itemId/comments/:commentId",
  async (req, res, next) => {
    try {
      const item = await ItemModal.findById(
        req.params.itemId
      );
      if (!item) {
        res.status(404).send({
          message: `item with ${req.params.itemId} is not found!`,
        });
      } else {
        await ItemModal.findByIdAndUpdate(
          req.params.itemId,
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
itemRouter.post(
  "/:itemId/add-like",
  JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const item = await ItemModal.findByIdAndUpdate(
        req.params.itemId,
        { $push: { likes: req.user._id } },
        { new: true }
      );
      if (!item)
        return next(
          createHttpError(
            404,
            `The id ${req.params.itemId} does not match any items`
          )
        );
      res.send(item);
    } catch (error) {
      next(error);
    }
  }
);

//removes like
itemRouter.post("/:itemId/remove-like", async (req, res, next) => {
  try {
    const item = await ItemModal.findByIdAndUpdate(
      req.params.itemId,
      { $pull: { likes: req.user._id } },
      { new: true }
    );
    if (!item)
      return next(
        createHttpError(
          404,
          `The id ${req.params.itemId} does not match any items`
        )
      );
    res.send(item);
  } catch (error) {
    next(error);
  }
});

export default itemRouter;
