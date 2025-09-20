import express from "express";
import {
  getTopProducts,
  getLowStockProducts,
  getSalesSummary,
  getQuickStats
} from "./report.controller.js";

const router = express.Router();

// GET /api/reports/top-products → المنتجات الأكثر مبيعاً
router.get("/top-products", getTopProducts);

// GET /api/reports/low-stock → المنتجات ذات المخزون المنخفض
router.get("/low-stock", getLowStockProducts);

// GET /api/reports/sales-summary → ملخص المبيعات
router.get("/sales-summary", getSalesSummary);

// GET /api/reports/quick-stats → إحصائيات سريعة
router.get("/quick-stats", getQuickStats);


export default router;