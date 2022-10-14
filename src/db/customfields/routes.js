import express from "express";
import CollectionModal from "../collections/schema.js";
import CustomFieldModal from "./schema.js";

const customFieldRouter = express.Router();

// get all custom fields
customFieldRouter.get(
  "/",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      const allFields = await CustomFieldModal.find({});
      res.send(allFields);
    } catch (error) {
      next(error);
    }
  }
);

// create a custom field
customFieldRouter.post(
  "/",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      const field = new CustomFieldModal(req.body);
      await field.save();
      const newField = await CollectionModal.findByIdAndUpdate(
        req.body.collections,
        {
          $push: { customFields: field },
        },
        { new: true }
      );
      if (!newField)
        next(
          createHttpError(
            404,
            `The collection with an id of ${req.body.collections} not found.`
          )
        );
      res.send(newField);
    } catch (error) {
      next(error);
    }
  }
);

//updates an custom fields by users and admins
itemRouter.put(
  "/:id",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      const fields = await CustomFieldModal.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );
      res.status(201).send(fields);
    } catch (error) {
      next(error);
    }
  }
);

// deletes field by users and admins
itemRouter.delete(
  "/:id",
  JWTAuthMiddleware,
  adminAndUserOnly,
  async (req, res, next) => {
    try {
      await CustomFieldModal.findByIdAndDelete(req.params.id);
      res
        .status(201)
        .send({ msg: `Fields with an id of ${req.params.id} deleted!` });
    } catch (error) {
      next(error);
    }
  }
);
