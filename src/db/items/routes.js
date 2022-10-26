import express from "express";
import createHttpError from "http-errors";
import { JWTAuthMiddleware } from "../../middleware/authentication.js";
import { adminAndUserOnly, adminOnly } from "../../middleware/authorization.js";
import ItemModal from "./schema.js";
import CollectionModal from "../collections/schema.js";
import { v4 as uuidv4 } from "uuid";
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

// image upload for specific item by users and admins
itemRouter.post(
  "/:itemId",
  JWTAuthMiddleware,
  adminAndUserOnly,
  parser.single("image"),
  async (req, res, next) => {
    try {
      console.log("ITEM id", req.params.itemId);
      if (req.params.itemId.length !== 24)
        return next(createHttpError(400, "Invalid ID"));
      const item = await ItemModal.findById(req.params.itemId);
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
      const getAllitems = await ItemModal.find({})
        .populate({ path: "owner", select: "username" })
        .populate({ path: "collections", select: "name" });
      res.status(200).send(getAllitems);
    } catch (error) {
      next(error);
    }
  }
);

// full text search engine for items for everyone
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

// get item for authorized users
itemRouter.get(
  "/",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      const items = await ItemModal.find({ owner: req.user._id }).populate({
        path: "collections",
        select: ["name", "owner"],
      });
      res.send(items);
    } catch (error) {
      next(error);
    }
  }
);

// get single item by users and admins
itemRouter.get("/:itemId", async (req, res, next) => {
  try {
    if (req.params.itemId.length !== 24)
      return next(createHttpError(400, "Invalid ID"));
    const items = await ItemModal.findById(req.params.itemId)
      .populate("owner")
      .populate({ path: "collections", select: "name" });
    res.status(200).send(items);
  } catch (error) {
    next(error);
  }
});

// create an item
itemRouter.post("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const item = new ItemModal(req.body);
    await item.save();
    const newItem = await CollectionModal.findByIdAndUpdate(
      req.body.collections,
      {
        $push: { items: { ...item, owner: req.user._id } },
      },
      { new: true }
    );
    if (!newItem)
      next(
        createHttpError(
          404,
          `The collection with an id of ${req.body.collections} not found.`
        )
      );
    res.send(item);
  } catch (error) {
    next(error);
  }
});

//updates an item by users and admins
itemRouter.put(
  "/:id",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      const item = await ItemModal.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      res.status(201).send(item);
    } catch (error) {
      next(error);
    }
  }
);

// deletes an item by users and admins
itemRouter.delete(
  "/:id",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      await ItemModal.findByIdAndDelete(req.params.id);
      res
        .status(201)
        .send({ msg: `item with a id of ${req.params.id} deleted!` });
    } catch (error) {
      next(error);
    }
  }
);

//get comments for specific item
itemRouter.get("/:itemId/comments", async (req, res, next) => {
  try {
    if (req.params.itemId.length !== 24)
      return next(createHttpError(400, "Invalid ID"));
    const items = await ItemModal.findById(req.params.itemId).populate({
      path: "comments",
      populate: {
        path: "owner",
        select: "username",
        model: "User",
      },
    });
    if (!items)
      return next(
        createHttpError(
          400,
          `The id ${req.params.itemId} does not match any items`
        )
      );
    res.status(200).send(items.comments);
  } catch (error) {
    next(error);
  }
});

// create comment for specific item
itemRouter.post(
  "/:itemId/comments",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      if (req.params.itemId.length !== 24)
        return next(createHttpError(400, "Invalid ID"));
      const comment = await ItemModal.findByIdAndUpdate(
        req.params.itemId,
        {
          $push: {
            comments: { ...req.body, owner: req.user._id },
          },
        },
        { new: true }
      ).populate({
        path: "owner",
        select: "username",
      });
      if (!comment) {
        next(createHttpError(404, `Id with ${req.params.itemId} not found!`));
      }
      res.send(comment);
    } catch (error) {
      next(error);
    }
  }
);

// delete comment for specific item by users and admins
itemRouter.delete(
  "/:itemId/comments/:commentId",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      const item = await ItemModal.findById(req.params.itemId);
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
      next(error);
    }
  }
);

// adds and removes like by users and admins
itemRouter.put("/:itemId/like", async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const isLiked = await ItemModal.findOne({
      _id: req.params.id,
      likes: itemId,
    });
    if (isLiked) {
      await ItemModal.findByIdAndUpdate(req.params.itemId, {
        $pull: { likes: itemId },
      });
      res.send("UNLIKED");
    } else {
      await ItemModal.findByIdAndUpdate(req.params.itemId, {
        $push: { likes: itemId },
      });
      res.send("LIKED");
    }
  } catch (error) {
    res.send(500).send({ message: error.message });
  }
});
export default itemRouter;
