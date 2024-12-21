const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
const port = 5000;

// Kết nối đến cơ sở dữ liệu MySQL
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "shop",
});

// Cấu hình Multer để lưu trữ file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Thư mục lưu trữ ảnh
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file theo thời gian
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads")); // Cho phép truy cập ảnh từ thư mục "uploads"

// API lấy danh sách sản phẩm
app.get("/api/products", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM products");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy sản phẩm" });
  }
});

// API thêm sản phẩm
app.post("/api/products", upload.single("image"), async (req, res) => {
  const { name, description, price } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !description || !price) {
    return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });
  }

  const query =
    "INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)";
  try {
    const [result] = await db.query(query, [
      name,
      description,
      price,
      imageUrl,
    ]);
    res.status(201).json({
      message: "Sản phẩm đã được thêm",
      productId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi thêm sản phẩm" });
  }
});

// API sửa sản phẩm
app.put("/api/products/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  let query = "UPDATE products SET name = ?, description = ?, price = ?";
  const params = [name, description, price];

  if (imageUrl) {
    query += ", image_url = ?";
    params.push(imageUrl);
  }

  query += " WHERE id = ?";
  params.push(id);

  try {
    const [result] = await db.query(query, params);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để sửa" });
    }
    res.status(200).json({ message: "Sản phẩm đã được cập nhật thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi sửa sản phẩm" });
  }
});

// API xóa sản phẩm
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm để xóa" });
    }
    res.status(200).json({ message: "Sản phẩm đã được xóa thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa sản phẩm" });
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server chạy trên http://localhost:${port}`);
});
