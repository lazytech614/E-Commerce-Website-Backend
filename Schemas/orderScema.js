import mongoose from "mongoose";

export const orderSchema = mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  address: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    default: "Order under process",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  payment: {
    type: Boolean,
    default: false,
  },
});
