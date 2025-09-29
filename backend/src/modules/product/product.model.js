import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  minStockLevel: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
productSchema.index({ code: 1 });
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });

export default mongoose.model("Product", productSchema);