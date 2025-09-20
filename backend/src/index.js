import express from "express";
import cors from "cors";
import { connectDb } from "./config/db.js";
import dotenv from "dotenv";
import productRouter from "./modules/product/product.route.js";
import invoiceRouter from "./modules/invoice/invoice.route.js";
import reportRouter from "./modules/report/report.route.js";

const app = express();
dotenv.config();

connectDb();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Your frontend origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/api/products", productRouter);
app.use("/api/invoices", invoiceRouter); 
app.use("/api/reports", reportRouter); // إضافة هذا السطر


app.get("/*", (req, res) => {
  res.json("hello world");
});

const port = process.env.PORT || 3006;
app.listen(port, () => {
  console.log(`Server is running on port ${port}!`);
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500; // Default to 500 if not set
  const message = err.message || "Internal Server Error"; // Default message

  console.error(err);

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

