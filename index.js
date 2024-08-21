import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import multer from "multer";
import cors from "cors";
import { type } from "os";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Database connection with MongoDB
dotenv.config();
mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DB}`
);

// API connection endpoints
app.get("/", (req, res) => {
  res.send("Hello");
});

// Image storage engine
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

// Upload endpoint for images
app.use("/images", express.static("upload/images"));
app.post("/upload", upload.single("product"), async (req, res) => {
  res.json({
    succes: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

// Schema for creating products
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  sizes: {
    type: [String],
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

// Endpoint to add product to database
app.post("/addproduct", async (req, res) => {
  const currentLength = (await Product.find({})).length;
  let id;
  if (currentLength > 0) {
    id = (await Product.find({})).splice(-1)[0].id + 1;
  } else {
    id = 1;
  }
  const product = new Product({
    id: id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
    sizes: req.body.sizes,
  });
  console.log(product);
  await product.save();
  console.log("Product saved in the database");
  res.status(200).json({
    success: 1,
    name: req.body.name,
  });
});

// Endpoint to delete product from database
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Product removed");
  res.status(200).json({
    succes: 1,
    name: req.body.name,
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
