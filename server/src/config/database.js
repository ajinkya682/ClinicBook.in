import mongoose from "mongoose";
import config from "./config.js";

const connectToDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log("MongoDB connected");
  } catch (error) {
    console.log(error);
  }
};

export default connectToDB;
