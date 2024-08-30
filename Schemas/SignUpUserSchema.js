import mongoose from "mongoose";

export const SignUpUserSchema = mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  phone: {
    type: Number,
    unique: true,
  },
  gender: {
    type: String,
  },
  password: {
    type: String,
  },
  cartData: {
    type: [
      {
        productId: Number,
        quantity: Number,
        size: String,
      },
    ],
    default: [],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
