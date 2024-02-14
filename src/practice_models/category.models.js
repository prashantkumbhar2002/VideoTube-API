import mongoose from "mongoose";

const categoryScema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Category = mongoose.model("Catgory", categoryScema);
