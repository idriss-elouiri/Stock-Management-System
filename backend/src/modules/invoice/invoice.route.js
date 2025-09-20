import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  updateInvoiceStatus,
  getInvoiceStats,
  updateInvoice,
  deleteInvoice
} from "./invoice.controller.js";

const router = express.Router();


// POST /api/invoices → إنشاء فاتورة جديدة
router.post("/", createInvoice);

// GET /api/invoices → جلب جميع الفواتير
router.get("/", getInvoices);

// GET /api/invoices/stats → إحصائيات الفواتير
router.get("/stats", getInvoiceStats);

// GET /api/invoices/:id → جلب فاتورة بواسطة ID
router.get("/:id", getInvoiceById);

// تعديل فاتورة
router.put("/:id", updateInvoice);

// حذف فاتورة
router.delete("/:id", deleteInvoice);

// GET /api/invoices/number/:invoiceNumber → جلب فاتورة بواسطة رقم الفاتورة
router.get("/number/:invoiceNumber", getInvoiceByNumber);

// PATCH /api/invoices/:id/status → تحديث حالة الفاتورة
router.patch("/:id/status", updateInvoiceStatus);

export default router;