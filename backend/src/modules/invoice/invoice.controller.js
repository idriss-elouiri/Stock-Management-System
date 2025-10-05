import Invoice from "./invoice.model.js";
import Product from "../product/product.model.js";
import { errorHandler } from "../../utils/error.js";
import mongoose from "mongoose";

// إنشاء فاتورة جديدة
export const createInvoice = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerICE,
      dateCreation,
      items,
      tax = 0,
      discount = 0,
      paymentMethod = "Espèces",
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return next(errorHandler(400, "يجب إضافة منتجات على الأقل إلى الفاتورة"));
    }

    let subtotal = 0;
    const invoiceItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product)
        return next(errorHandler(404, `المنتج غير موجود: ${item.productId}`));
      if (product.quantity < item.quantity)
        return next(
          errorHandler(
            400,
            `الكمية غير كافية للمنتج: ${product.name}. المتاح: ${product.quantity}`
          )
        );

      // حساب الخصم لكل منتج
      const itemTotal = item.quantity * product.price;
      const itemRemise = parseFloat(item.remise) || 0;
      const itemDiscountAmount = (itemTotal * itemRemise) / 100;
      const itemNetTotal = itemTotal - itemDiscountAmount;

      subtotal += itemNetTotal;

      invoiceItems.push({
        product: product._id,
        productCode: product.code,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        remise: itemRemise, // 👈 تخزين نسبة الخصم
        discountAmount: itemDiscountAmount, // 👈 تخزين مبلغ الخصم
        total: itemNetTotal, // 👈 تخزين الإجمالي بعد الخصم
      });

      // تحديث المخزون
      product.quantity -= item.quantity;
      await product.save({ session });
    }

    // حساب الخصم العام على الفاتورة
    const globalDiscountAmount = (subtotal * discount) / 100;
    const ht = subtotal - globalDiscountAmount;

    // حساب الضريبة
    const taxAmount = (ht * tax) / 100;
    const total = ht + taxAmount;

    const invoice = new Invoice({
      customerName,
      customerPhone,
      customerEmail,
      customerICE,
      dateCreation,
      items: invoiceItems,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      notes,
      status: "مكتمل",
    });

    const savedInvoice = await invoice.save({ session });
    await session.commitTransaction();
    session.endSession();

    // جلب الفاتورة مع بيانات المنتج المكتملة
    const populatedInvoice = await Invoice.findById(savedInvoice._id)
      .populate("items.product", "name code price")
      .lean();

    // تنسيق البيانات للاستجابة
    const formattedInvoice = {
      ...populatedInvoice,
      items: populatedInvoice.items.map((item) => ({
        ...item,
        productName: item.product ? item.product.name : item.productName,
        unitPrice: item.product ? item.product.price : item.unitPrice,
        remise: item.remise || 0, // 👈 تضمين الخصم في الاستجابة
        discountAmount: item.discountAmount || 0,
        total: item.total,
      })),
    };

    res.status(201).json({
      success: true,
      message: "تم إنشاء الفاتورة بنجاح",
      data: formattedInvoice,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// جلب جميع الفواتير
export const getInvoices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customerName,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // بناء فلتر الاستعلام
    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (customerName) {
      filter.customerName = { $regex: customerName, $options: "i" };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
    };

    const invoices = await Invoice.find(filter)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort)
      .populate({
        path: "items.product",
        select: "name code price", // تأكد من أن الحقول المطلوبة محددة
      });

    const total = await Invoice.countDocuments(filter);

    // تحويل البيانات إلى الشكل المناسب
    const formattedInvoices = invoices.map((invoice) => {
      const invoiceObj = invoice.toObject();
      return {
        ...invoiceObj,
        items: invoiceObj.items.map((item) => {
          // إذا كان المنتج مملوءاً (populated)، استخدم بياناته
          if (item.product && typeof item.product === "object") {
            return {
              ...item,
              productName: item.product.name,
              unitPrice: item.product.price,
              total: item.quantity * item.product.price,
            };
          }
          // إذا لم يكن مملوءاً، استخدم البيانات المخزنة في الفاتورة
          return {
            ...item,
            productName: item.productName || "منتج غير معروف",
            unitPrice: item.unitPrice || 0,
            total: item.total || item.quantity * (item.unitPrice || 0),
          };
        }),
      };
    });

    res.status(200).json({
      success: true,
      data: formattedInvoices,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalInvoices: total,
        hasNext: options.page < Math.ceil(total / options.limit),
        hasPrev: options.page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// جلب فاتورة بواسطة ID
export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id).populate(
      "items.product",
      "name code price description"
    );

    if (!invoice) {
      return next(errorHandler(404, "الفاتورة غير موجودة"));
    }

    // تحويل البيانات إلى الشكل المناسب
    const invoiceObj = invoice.toObject();
    const formattedInvoice = {
      ...invoiceObj,
      items: invoiceObj.items.map((item) => {
        // إذا كان المنتج مملوءاً (populated)، استخدم بياناته
        if (item.product && typeof item.product === "object") {
          return {
            ...item,
            productName: item.product.name,
            unitPrice: item.product.price,
            total: item.quantity * item.product.price,
          };
        }
        // إذا لم يكن مملوءاً، استخدم البيانات المخزنة في الفاتورة
        return {
          ...item,
          productName: item.productName || "منتج غير معروف",
          unitPrice: item.unitPrice || 0,
          total: item.total || item.quantity * (item.unitPrice || 0),
        };
      }),
    };

    res.status(200).json({
      success: true,
      data: formattedInvoice,
    });
  } catch (error) {
    next(error);
  }
};
// جلب فاتورة بواسطة رقم الفاتورة
export const getInvoiceByNumber = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate("items.product", "name code price description")
      .populate("name email phone");

    if (!invoice) {
      return next(errorHandler(404, "الفاتورة غير موجودة"));
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

// تحديث حالة الفاتورة
export const updateInvoiceStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["مكتمل", "معلق", "ملغى"].includes(status)) {
      return next(errorHandler(400, "حالة الفاتورة غير صالحة"));
    }

    const invoice = await Invoice.findById(id).session(session);

    if (!invoice) {
      return next(errorHandler(404, "الفاتورة غير موجودة"));
    }

    // إذا تم إلغاء الفاتورة، إرجاع الكميات إلى المخزون
    if (status === "ملغى" && invoice.status !== "ملغى") {
      for (const item of invoice.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          product.quantity += item.quantity;
          await product.save({ session });
        }
      }
    }

    // إذا تم استئناف فاتورة ملغاة، خصم الكميات من المخزون مرة أخرى
    if (invoice.status === "ملغى" && status !== "ملغى") {
      for (const item of invoice.items) {
        const product = await Product.findById(item.product).session(session);
        if (product) {
          if (product.quantity < item.quantity) {
            return next(
              errorHandler(
                400,
                `الكمية غير كافية للمنتج: ${product.name}. المتاح: ${product.quantity}`
              )
            );
          }
          product.quantity -= item.quantity;
          await product.save({ session });
        }
      }
    }

    invoice.status = status;
    const updatedInvoice = await invoice.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "تم تحديث حالة الفاتورة بنجاح",
      data: updatedInvoice,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// تحديث فاتورة موجودة
export const updateInvoice = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerICE,
      dateCreation,
      items,
      tax = 0,
      discount = 0,
      paymentMethod = "Espèces",
      notes,
    } = req.body;

    const invoice = await Invoice.findById(id).session(session);
    if (!invoice) return next(errorHandler(404, "الفاتورة غير موجودة"));

    // إرجاع الكميات القديمة إلى المخزون
    for (const oldItem of invoice.items) {
      const product = await Product.findById(oldItem.product).session(session);
      if (product) {
        product.quantity += oldItem.quantity;
        await product.save({ session });
      }
    }

    let subtotal = 0;
    const updatedItems = [];

    // معالجة العناصر الجديدة مع الخصم
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product)
        return next(errorHandler(404, `المنتج غير موجود: ${item.productId}`));
      if (product.quantity < item.quantity)
        return next(
          errorHandler(
            400,
            `الكمية غير كافية للمنتج: ${product.name}. المتاح: ${product.quantity}`
          )
        );

      // حساب الخصم لكل منتج
      const itemTotal = item.quantity * product.price;
      const itemRemise = parseFloat(item.remise) || 0;
      const itemDiscountAmount = (itemTotal * itemRemise) / 100;
      const itemNetTotal = itemTotal - itemDiscountAmount;

      subtotal += itemNetTotal;

      updatedItems.push({
        product: product._id,
        productCode: product.code,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        remise: itemRemise, // 👈 تخزين نسبة الخصم
        discountAmount: itemDiscountAmount, // 👈 تخزين مبلغ الخصم
        total: itemNetTotal, // 👈 تخزين الإجمالي بعد الخصم
      });

      // تحديث المخزون
      product.quantity -= item.quantity;
      await product.save({ session });
    }

    // حساب الخصم العام على الفاتورة
    const globalDiscountAmount = (subtotal * discount) / 100;
    const ht = subtotal - globalDiscountAmount;

    // حساب الضريبة
    const taxAmount = (ht * tax) / 100;
    const total = ht + taxAmount;

    // تحديث الفاتورة
    invoice.customerName = customerName;
    invoice.customerPhone = customerPhone;
    invoice.customerEmail = customerEmail;
    invoice.customerICE = customerICE;
    invoice.dateCreation = dateCreation;
    invoice.items = updatedItems;
    invoice.subtotal = subtotal;
    invoice.tax = tax;
    invoice.discount = discount;
    invoice.total = total;
    invoice.paymentMethod = paymentMethod;
    invoice.notes = notes;

    const updatedInvoice = await invoice.save({ session });
    await session.commitTransaction();
    session.endSession();

    // جلب البيانات المحدثة مع المنتجات
    const populatedInvoice = await Invoice.findById(updatedInvoice._id)
      .populate("items.product", "name code price")
      .lean();

    // تنسيق البيانات للاستجابة
    const formattedInvoice = {
      ...populatedInvoice,
      items: populatedInvoice.items.map((item) => ({
        ...item,
        productName: item.product ? item.product.name : item.productName,
        unitPrice: item.product ? item.product.price : item.unitPrice,
        remise: item.remise || 0, // 👈 تضمين الخصم في الاستجابة
        discountAmount: item.discountAmount || 0,
        total: item.total,
      })),
    };

    res.status(200).json({
      success: true,
      message: "تم تحديث الفاتورة بنجاح",
      data: formattedInvoice,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// حذف الفاتورة
export const deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) return next(errorHandler(404, "الفاتورة غير موجودة"));
    res.status(200).json({ success: true, message: "تم حذف الفاتورة" });
  } catch (err) {
    next(err);
  }
};

// الحصول على إحصائيات الفواتير
export const getInvoiceStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
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

    // المبيعات حسب الشهر
    const monthlySales = await Invoice.aggregate([
      { $match: { status: "مكتمل", ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    // المنتجات الأكثر مبيعاً
    const topProducts = await Invoice.aggregate([
      { $match: { status: "مكتمل", ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSales: totalSales[0]?.total || 0,
        invoiceCount,
        monthlySales,
        topProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};
