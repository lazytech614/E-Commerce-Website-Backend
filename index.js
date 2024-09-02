import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import multer from "multer";
import cors from "cors";
import { type } from "os";
import dotenv from "dotenv";
import { productSchema } from "./Schemas/ProductSchema.js";
import { error } from "console";
import { SignUpUserSchema } from "./Schemas/SignUpUserSchema.js";
import findUser from "./Middlewares/findUser.js";
import { orderModel } from "./Models/orderModel.js";
import Stripe from "stripe";

const app = express();
const port = process.env.PORT || 4000;

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
    success: 1,
    image_url: `http://localhost:4000/images/${req.file.filename}`,
  });
});

// Schema for creating products
const Product = mongoose.model("Product", productSchema);

// Endpoint to add product to database
app.post("/addproduct", async (req, res) => {
  try {
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
    await product.save();
    res.status(200).json({
      success: 1,
      name: req.body.name,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error saving the product in database", details: err });
  }
});

// Endpoint to delete product from database
app.post("/removeproduct", async (req, res) => {
  try {
    const productToBeDeleted = await Product.findOne({ id: req.body.id });
    if (!productToBeDeleted) {
      throw new Error("Product not found");
    }

    await Product.deleteOne({ id: req.body.id });
    res.status(200).json({ message: "Product removed successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting the product", details: err.message });
  }
});

// Endpoint for getting all products
app.get("/allproducts", async (req, res) => {
  try {
    const allProducts = await Product.find({});
    res.status(200).send(allProducts);
  } catch (err) {
    res.status(500).json({ message: "Cannot get all products", details: err });
  }
});

const createCart = () => {
  let cart = [];
  for (let i = 1; i <= 300; i++) {
    cart.push({
      productId: i,
      quantity: 0,
      size: "Not selected",
    });
  }
  return cart;
};

// Users schema for sign up
const Users = mongoose.model("Users", SignUpUserSchema);

// endpoint for user signup
app.post("/signup", async (req, res) => {
  const checkEmail = await Users.findOne({ email: req.body.email });
  const checkPhone = await Users.findOne({ phone: req.body.phone });

  if (checkEmail) {
    res.status(500).json({ success: false, error: "Email already exist." });
  } else if (checkPhone) {
    res
      .status(500)
      .json({ success: false, error: "Phone number already exist" });
  }

  // let cart = [];
  // for (let i = 1; i <= 300; i++) {
  //   cart.push({
  //     productId: i,
  //     quantity: 0,
  //     size: "Not selected",
  //   });
  // }

  createCart();

  const user = new Users({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    gender: req.body.gender,
    password: req.body.password,
    cartData: cart,
  });
  await user.save();

  const data = {
    id: user.id,
  };
  const token = jwt.sign(data, process.env.VITE_TOKEN_SECRET_KEY);
  res.json({ success: true, token });
});

// Endpoint for user signin
app.post("/signin", async (req, res) => {
  const user = await Users.findOne({ phone: req.body.phone });
  if (!user) {
    res.json({ success: false, error: "User not found" });
  }

  const passwordCompare = user.password === req.body.password;
  if (passwordCompare) {
    const data = {
      id: user.id,
    };
    const token = jwt.sign(data, process.env.VITE_TOKEN_SECRET_KEY);
    res.json({ success: true, token });
  } else {
    res.json({ success: false, error: "Wrong password" });
  }
});

// Endpoint for new collections
app.get("/newcollections", async (req, res) => {
  const products = await Product.find({});
  const newCollections = products.slice(1).slice(-8);
  res.send(newCollections);
});

// Endpoint for popular category women
app.get("/popular/women", async (req, res) => {
  const womenProducts = await Product.find({ category: "Women" });
  const popularProducts = womenProducts.slice(0, 4);
  res.send(popularProducts);
});

// Endpoint for popular category men
app.get("/popular/men", async (req, res) => {
  const womenProducts = await Product.find({ category: "Men" });
  const popularProducts = womenProducts.slice(0, 4);
  res.send(popularProducts);
});

// Endpoint for popular category kid
app.get("/popular/kids", async (req, res) => {
  const womenProducts = await Product.find({ category: "Kid" });
  const popularProducts = womenProducts.slice(0, 4);
  res.send(popularProducts);
});

// Endpoint for women category
app.get("/women", async (req, res) => {
  const products = await Product.find({ category: "Women" });
  res.send(products);
});

// Endpoint for men category
app.get("/men", async (req, res) => {
  const products = await Product.find({ category: "Men" });
  res.send(products);
});

// Endpoint for kids category
app.get("/kids", async (req, res) => {
  const products = await Product.find({ category: "Kid" });
  res.send(products);
});

app.post("/addtocart", findUser, async (req, res) => {
  const { itemId, size } = req.body;

  try {
    const user = await Users.findById(req.user.id);
    let cartData = user.cartData || [];

    const itemIndex = cartData.findIndex((cart) => itemId === cart.productId);

    if (itemIndex !== -1) {
      // Item exists in cart
      cartData[itemIndex].quantity += 1;
      cartData[itemIndex].size = size;
    } else {
      // Item does not exist, add new item
      cartData.push({
        productId: itemId,
        quantity: 1,
        size: size,
      });
    }

    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: cartData });

    // Ensure cartData is an array
    if (!Array.isArray(cartData)) {
      throw new Error("Cart data is not an array");
    }

    res.json({
      success: true,
      message: "Item added to cart successfully",
      cartData,
    });
  } catch (err) {
    console.error("Error adding item to cart:", err);
    res.status(500).json({
      success: false,
      message: "Error adding item to cart",
      error: err.message,
    });
  }
});

// Endpoint for removing product from the cart
app.post("/removefromcart", findUser, async (req, res) => {
  const { itemId } = req.body;

  try {
    const user = await Users.findById(req.user.id);
    const cartData = user.cartData;

    const item = cartData.find((cart) => itemId === cart.productId);

    if (item) {
      item.quantity -= 1;
    }
    // if (user.cartData[req.body.itemId] > 0) user.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: cartData });

    res.json({
      success: true,
      message: "Item removed from cart successfully",
      cartData,
    });
  } catch (err) {
    console.error("Error removing the item from cart:", err);
    res.status(500).json({
      success: false,
      message: "Error removing the item from cart",
      error: err.message,
    });
  }
});

// Endpoint to get cartData
app.post("/getcartdata", findUser, async (req, res) => {
  const user = await Users.findOne({ _id: req.user.id });
  res.json(user.cartData);
});

// Endpoint for payment

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/payment", findUser, async (req, res) => {
  const { products } = req.body;

  const line_items = products.map((product) => ({
    price_data: {
      currency: "inr",
      product_data: {
        name: product.name,
      },
      unit_amount: product.price * 100,
    },
    quantity: product.quantity || 1,
  }));

  const session = await stripe.checkout.sessions.create({
    line_items: line_items,
    mode: "payment",
    success_url: "http://localhost:5173/success",
    cancel_url: "http://localhost:5173/cancel",
  });

  res.json({ id: session.id });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
