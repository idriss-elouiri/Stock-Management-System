import mongoose from "mongoose";
import { config } from "./index.js";

export const connectDb = () =>
  mongoose
    .connect(config.mongoUrl)
    .then(() => {
      console.log("MongoDb is connected");
    })
    .catch((err) => {
      console.log(err);
    });