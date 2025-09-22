import Product from "./product.model.js";
import { errorHandler } from "../../utils/error.js";

// إنشاء سلعة جديدة
export const createProduct = async (req, res, next) => {
  try {
    const {
      code,
      name,
      price,
      quantity,
      description,
      category,
      minStockLevel,
    } = req.body;

    // التحقق من وجود سلعة بنفس الكود
    const existingProduct = await Product.findOne({ code });
    if (existingProduct) {
      return next(errorHandler(400, "كود السلعة موجود مسبقاً"));
    }

    const product = new Product({
      code: code.toUpperCase(),
      name,
      price,
      quantity: quantity || 0,
      description,
      category,
      minStockLevel,
    });

    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: "تم إضافة السلعة بنجاح",
      data: savedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// جلب جميع السلع
export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    let filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const products = await Product.find(filter)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalProducts: total,
        hasNext: options.page < Math.ceil(total / options.limit),
        hasPrev: options.page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// جلب سلعة بواسطة ID
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return next(errorHandler(404, "السلعة غير موجودة"));
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// تحديث سلعة
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // إذا كان هناك تحديث للكود، تحقق من أنه غير مكرر
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
      const existingProduct = await Product.findOne({
        code: updateData.code,
        _id: { $ne: id },
      });

      if (existingProduct) {
        return next(errorHandler(400, "كود السلعة موجود مسبقاً"));
      }
    }

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return next(errorHandler(404, "السلعة غير موجودة"));
    }

    res.status(200).json({
      success: true,
      message: "تم تحديث السلعة بنجاح",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// حذف سلعة
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return next(errorHandler(404, "السلعة غير موجودة"));
    }

    res.status(200).json({
      success: true,
      message: "تم حذف السلعة بنجاح",
    });
  } catch (error) {
    next(error);
  }
};

// تحديث الكمية فقط
export const updateProductQuantity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

    const product = await Product.findById(id);
    if (!product) {
      return next(errorHandler(404, "السلعة غير موجودة"));
    }

    let newQuantity = product.quantity;

    if (operation === "add") {
      newQuantity += quantity;
    } else if (operation === "subtract") {
      if (product.quantity < quantity) {
        return next(errorHandler(400, "الكمية غير كافية"));
      }
      newQuantity -= quantity;
    } else {
      newQuantity = quantity;
    }

    if (newQuantity < 0) {
      return next(errorHandler(400, "الكمية لا يمكن أن تكون سالبة"));
    }

    product.quantity = newQuantity;
    await product.save();

    res.status(200).json({
      success: true,
      message: "تم تحديث الكمية بنجاح",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
