import express from "express";
import createHttpError from "http-errors";
import CollectionModal from "./schema.js";
import UsersModal from '../users/schema.js'
import { v2 as Cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { JWTAuthMiddleware } from "../../middleware/authentication.js";
import { adminAndUserOnly, adminOnly } from "../../middleware/authorization.js";
const collectionRoute = express.Router();

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

// get all collections by only admins
collectionRoute.get(
  "/allCollections",
  JWTAuthMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const collection = await CollectionModal.find({})
        .populate({
          path: "owner",
          select: "username",
        })
        .populate("items");
      res.status(200).send(collection);
    } catch (error) {
      next(error);
    }
  }
);

// create collection only by users and admins
collectionRoute.post(
  "/",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      const collection = new CollectionModal(req.body);
      await collection.save();
      const newCollection = await UsersModal.findByIdAndUpdate(
        req.body.owner,
        {
          $push: { collections: { ...collection, owner: req.user._id } },
        },
        { new: true }
      );
      res.status(201).send(newCollection);
    } catch (error) {
      next(error);
    }
  }
);

// get single collection by users and admins
collectionRoute.get(
  "/:id",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      if (req.params.id.length !== 24)
        return next(createHttpError(400, "Invalid ID"));
      const collection = await CollectionModal.findById(req.params.id).populate("items");
      res.status(200).send(collection);
    } catch (error) {
      next(error);
    }
  }
);

// image upload for specific collection  by users and admins
collectionRoute.post(
  "/:id",
  JWTAuthMiddleware,
  adminAndUserOnly,
  parser.single("image"),
  async (req, res, next) => {
    try {
      if (req.params.id.length !== 24)
        return next(createHttpError(400, "Invalid ID"));
      const collection = await CollectionModal.findById(req.params.id);
      if (collection) {
        await collection.updateOne({ image: req.file.path });
        res.send(collection);
      } else {
        next(
          createHttpError(
            404,
            `The collection with id ${req.params.id} not found.`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

// update single collection  by users and admins
collectionRoute.put(
  "/:id",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      if (req.params.itemId.length !== 24)
        return next(createHttpError(400, "Invalid ID"));
      const updateCollection = await CollectionModal.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.status(201).send(updateCollection);
    } catch (error) {
      next(error);
    }
  }
);

// delete single collection  by users and admins
collectionRoute.delete(
  "/:id",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      if (req.params.id.length !== 24)
        return next(createHttpError(400, "Invalid ID"));
      await CollectionModal.findByIdAndDelete(req.params.id);
      res.send();
    } catch (error) {
      next(error);
    }
  }
);

export default collectionRoute;
