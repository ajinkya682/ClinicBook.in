import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

const config = {
  mongoURI: process.env.MONGO_URI,
};

export default config;
