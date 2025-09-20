import Invoice from "../invoice/invoice.model.js";
import Product from "../product/product.model.js";
import { errorHandler } from "../../utils/error.js";

// الحصول على المنتجات الأكثر مبيعاً
export const getTopProducts = async (req, res, next) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const topProducts = await Invoice.aggregate([
      { $match: { status: "مكتمل", ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          productCode: { $first: "$items.productCode" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // الحصول على معلومات إضافية عن المنتجات
    const populatedProducts = await Promise.all(
      topProducts.map(async (product) => {
        const productDetails = await Product.findById(product._id);
        return {
          ...product,
          currentStock: productDetails?.quantity || 0,
          price: productDetails?.price || 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: populatedProducts,
      total: populatedProducts.length,
    });
  } catch (error) {
    next(error);
  }
};

// الحصول على المنتجات ذات المخزون المنخفض
export const getLowStockProducts = async (req, res, next) => {
  try {
    const { threshold = 5 } = req.query;

    const lowStockProducts = await Product.find({
      quantity: { $lte: parseInt(threshold) },
    }).sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      data: lowStockProducts,
      total: lowStockProducts.length,
      threshold: parseInt(threshold),
    });
  } catch (error) {
    next(error);
  }
};

// الحصول على ملخص المبيعات
export const getSalesSummary = async (req, res, next) => {
  try {
    const { period = "month", startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    } else {
      // إذا لم يتم تحديد تاريخ، افترض آخر 30 يومًا
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.createdAt = { $gte: thirtyDaysAgo };
    }

    // إجمالي المبيعات
    const totalSales = await Invoice.aggregate([
      { $match: { status: "مكتمل", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    // عدد الفواتير
    const invoiceCount = await Invoice.countDocuments({
      status: "مكتمل",
      ...dateFilter,
    });

    // متوسط قيمة الفاتورة
    const averageInvoice = totalSales[0]?.total / invoiceCount || 0;

    // المبيعات حسب اليوم/الشهر
    let groupBy;
    switch (period) {
      case "day":
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      case "week":
        groupBy = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" },
        };
        break;
      default:
        groupBy = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
    }

    const salesByPeriod = await Invoice.aggregate([
      { $match: { status: "مكتمل", ...dateFilter } },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: "$total" },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // عدد المنتجات المباعة
    const productsSold = await Invoice.aggregate([
      { $match: { status: "مكتمل", ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: "$items.quantity" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSales: totalSales[0]?.total || 0,
        invoiceCount,
        averageInvoice: Math.round(averageInvoice),
        totalProductsSold: productsSold[0]?.totalProducts || 0,
        salesByPeriod,
        period,
      },
    });
  } catch (error) {
    next(error);
  }
};

// الحصول على إحصائيات سريعة
export const getQuickStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // مبيعات اليوم
    const todaySales = await Invoice.aggregate([
      {
        $match: {
          status: "مكتمل",
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]);

    // عدد فواتير اليوم
    const todayInvoices = await Invoice.countDocuments({
      status: "مكتمل",
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // المنتجات المنخفضة المخزون
    const lowStockCount = await Product.countDocuments({
      quantity: { $lte: 5 }
    });

    // إجمالي المخزون
    const totalInventory = await Product.aggregate([
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        todaySales: todaySales[0]?.total || 0,
        todayInvoices,
        lowStockCount,
        totalInventory: totalInventory[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};