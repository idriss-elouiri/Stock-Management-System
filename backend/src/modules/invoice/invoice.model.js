import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productCode: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  remise: { type: Number, default: 0, min: 0, max: 100 }, // 👈 نسبة الخصم
  discountAmount: { type: Number, default: 0, min: 0 }, // 👈 مبلغ الخصم
  total: { type: Number, required: true, min: 0 }, // 👈 الإجمالي بعد الخصم
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    customerICE: { type: String, trim: true },
    dateCreation: { type: String, trim: true },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: [
        "Espèces",
        "Carte de crédit",
        "Virement bancaire",
        "chèque",
        "effet",
        "Autre",
      ],
      default: "Espèces",
    },
    status: {
      type: String,
      enum: ["مكتمل", "معلق", "ملغى"],
      default: "مكتمل",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// إنشاء رقم فاتورة تلقائي قبل الحفظ
invoiceSchema.pre("validate", async function (next) {
  if (!this.invoiceNumber) {
    try {
      const year = new Date().getFullYear();
      const lastInvoice = await this.constructor.findOne(
        { invoiceNumber: new RegExp(`^INV-${year}-`) },
        {},
        { sort: { createdAt: -1 } }
      );

      let sequentialNumber = 1;
      if (lastInvoice?.invoiceNumber) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
        sequentialNumber = lastNumber + 1;
      }

      this.invoiceNumber = `INV-${year}-${sequentialNumber
        .toString()
        .padStart(4, "0")}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ customerName: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ status: 1 });

invoiceSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

invoiceSchema.set("toJSON", { virtuals: true });
invoiceSchema.set("toObject", { virtuals: true });

export default mongoose.model("Invoice", invoiceSchema);
