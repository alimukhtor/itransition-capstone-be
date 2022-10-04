import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
const server = express();
server.use(cors());
server.use(express.json());
// *********************** ENV IMPORTS ******************

const { MONGO_URL } = process.env;
const port = process.env.PORT || 3030;

// *********************** IMPORT ROUTES ******************

import userRouter from "./db/users/routes.js";
import itemRouter from "./db/items/routes.js";

// ************************ ROUTES *********************

server.use("/users", userRouter);
server.use("/items", itemRouter);

// *********************** MIDDLEWARES ******************

// *********************** DB CONNECTION ****************
mongoose.connect(MONGO_URL);
mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB!");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server running on port ${port}`);
  });
});
