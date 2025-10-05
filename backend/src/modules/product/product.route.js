import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductQuantity,
  getAllProducts,
} from "./product.controller.js";

const router = express.Router();

// POST /api/products - إنشاء سلعة جديدة
router.post("/", createProduct);

// GET /api/products - جلب جميع السلع
router.get("/", getProducts);

router.get("/all", getAllProducts);

// GET /api/products/:id - جلب سلعة بواسطة ID
router.get("/:id", getProductById);

// PUT /api/products/:id - تحديث سلعة
router.put("/:id", updateProduct);

// DELETE /api/products/:id - حذف سلعة
router.delete("/:id", deleteProduct);

// PATCH /api/products/:id/quantity - تحديث كمية السلعة
router.patch("/:id/quantity", updateProductQuantity);

export default router;
