import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: false,
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("DB Connection Error:", err);
  }
};
