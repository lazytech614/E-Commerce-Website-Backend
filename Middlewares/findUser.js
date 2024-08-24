import jwt from "jsonwebtoken";

const findUser = async (req, res, next) => {
  const token = req.headers.authtoken;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.VITE_TOKEN_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export default findUser;
