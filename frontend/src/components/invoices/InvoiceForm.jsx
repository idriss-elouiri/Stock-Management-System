"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaSave,
  FaSync,
  FaTimes,
  FaPlus,
  FaMinus,
  FaBox,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaIdCard,
} from "react-icons/fa";
import { useFormik } from "formik";
import { toast } from "react-toastify";

const InvoiceForm = ({ invoice, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";
  useEffect(() => {
    fetchProducts();
    if (!invoice) {
      formik.resetForm();
    }
  }, [invoice]);

  const fetchProducts = async () => {
    try {
      let allProducts = [];
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const response = await fetch(`${API_URL}/api/products?page=${page}`);
        if (!response.ok) break;

        const data = await response.json();
        allProducts = [...allProducts, ...data.data];

        hasNext = data.pagination.hasNext;
        page++;
      }

      setProducts(allProducts);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    }
  };

  // دالة لتنسيق السعر كدرهم مغربي
  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formik = useFormik({
    // داخل initialValues
    initialValues: {
      customerName: invoice?.customerName || "",
      customerPhone: invoice?.customerPhone || "",
      customerEmail: invoice?.customerEmail || "",
      customerICE: invoice?.customerICE || "", // صححت هذا السطر
      items:
        invoice?.items?.map((item) => ({
          productId: item.product?._id || item.product,
          quantity: item.quantity,
        })) || [],
      tax: invoice?.tax || 0,
      discount: invoice?.discount || 0,
      paymentMethod: invoice?.paymentMethod || "Espèces",
      notes: invoice?.notes || "",
    },

    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const url = invoice
          ? `${API_URL}/api/invoices/${invoice._id}`
          : `${API_URL}/api/invoices`;
        const method = invoice ? "PUT" : "POST";

        // إضافة معلومات المنتج الكاملة عند التعديل
        const itemsWithProductInfo = await Promise.all(
          values.items.map(async (item) => {
            const product = products.find((p) => p._id === item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              // إضافة المعلومات الإضافية للمنتج
              productName: product?.name,
              unitPrice: product?.price,
              productCode: product?.code,
            };
          })
        );

        const payload = {
          ...values,
          items: itemsWithProductInfo,
        };

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Échec de l'enregistrement de la facture"
          );
        }

        onSuccess();
      } catch (error) {
        alert(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const addItem = () => {
    if (selectedProduct && selectedProduct.quantity > 0) {
      const existingItemIndex = formik.values.items.findIndex(
        (item) => item.productId === selectedProduct._id
      );

      if (existingItemIndex >= 0) {
        const newItems = [...formik.values.items];
        if (newItems[existingItemIndex].quantity < selectedProduct.quantity) {
          newItems[existingItemIndex].quantity += 1;
          formik.setFieldValue("items", newItems);
        } else {
          toast.error("Quantité non disponible en stock");
        }
      } else {
        formik.setFieldValue("items", [
          ...formik.values.items,
          {
            productId: selectedProduct._id,
            quantity: 1,
          },
        ]);
      }
      setSelectedProduct(null);
    } else {
      toast.error("Produit non disponible en stock");
    }
  };

  const removeItem = (index) => {
    const newItems = formik.values.items.filter((_, i) => i !== index);
    formik.setFieldValue("items", newItems);
  };

  const updateQuantity = (index, quantity) => {
    if (quantity < 1) return;

    const productId = formik.values.items[index].productId;
    const product = products.find((p) => p._id === productId);

    if (product && quantity > product.quantity) {
      toast.error(`Quantité non disponible. Disponible: ${product.quantity}`);
      return;
    }

    const newItems = [...formik.values.items];
    newItems[index].quantity = quantity;
    formik.setFieldValue("items", newItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;

    formik.values.items.forEach((item) => {
      const product = products.find((p) => p._id === item.productId);
      if (product) {
        subtotal += item.quantity * product.price;
      }
    });

    // خصم كنسبة مئوية (%)
    const discountRate = parseFloat(formik.values.discount) || 0;
    const discountAmount = (subtotal * discountRate) / 100;
    const ht = subtotal - discountAmount;

    // الضريبة (TVA) كنسبة مئوية (%)
    const taxRate = parseFloat(formik.values.tax) || 0;
    const taxAmount = (ht * taxRate) / 100;

    // Net à Payer
    const total = ht + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const { subtotal, total } = calculateTotals();

  const inputClass = (touched, error) =>
    `w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
      touched && error
        ? "border-red-500 bg-red-50"
        : "border-gray-300 hover:border-indigo-300"
    }`;

  return (
    <>
      <form
        onSubmit={formik.handleSubmit}
        className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Informations du client */}
          <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-indigo-700 flex items-center pb-2 border-b border-indigo-100">
              <FaUser className="ml-2 text-indigo-500" /> Informations du client
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du client *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="customerName"
                  value={formik.values.customerName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={inputClass(
                    formik.touched.customerName,
                    formik.errors.customerName
                  )}
                  placeholder="Entrez le nom du client"
                />
                <FaUser className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {formik.touched.customerName && formik.errors.customerName && (
                <p className="mt-1 text-sm text-red-600">
                  {formik.errors.customerName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="customerPhone"
                  value={formik.values.customerPhone}
                  onChange={formik.handleChange}
                  className={inputClass(
                    formik.touched.customerPhone,
                    formik.errors.customerPhone
                  )}
                  placeholder="Entrez le numéro de téléphone"
                />
                <FaPhone className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="customerEmail"
                  value={formik.values.customerEmail}
                  onChange={formik.handleChange}
                  className={inputClass(
                    formik.touched.customerEmail,
                    formik.errors.customerEmail
                  )}
                  placeholder="Entrez l'adresse email"
                />
                <FaEnvelope className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ICE
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="customerICE"
                  value={formik.values.customerICE}
                  onChange={formik.handleChange}
                  className={inputClass(
                    formik.touched.customerICE,
                    formik.errors.customerICE
                  )}
                  placeholder="Entrez le numéro ICE"
                />
                <FaIdCard className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              {formik.touched.customerICE && formik.errors.customerICE && (
                <p className="text-red-500 text-sm mt-1">
                  {formik.errors.customerICE}
                </p>
              )}
            </div>
          </div>

          {/* Ajouter des produits */}
          <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-indigo-700 flex items-center pb-2 border-b border-indigo-100">
              <FaBox className="ml-2 text-indigo-500" /> Ajouter des produits
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choisir un produit
              </label>
              <select
                value={selectedProduct?._id || ""}
                onChange={(e) => {
                  const product = products.find(
                    (p) => p._id === e.target.value
                  );
                  setSelectedProduct(product);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Sélectionner un produit</option>
                {products
                  .filter((p) => p.quantity > 0)
                  .map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} - {formatPrice(product.price)} -
                      Disponible: {product.quantity}
                    </option>
                  ))}
              </select>
            </div>

            <button
              type="button"
              onClick={addItem}
              disabled={!selectedProduct}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus className="ml-2" /> Ajouter à la facture
            </button>
          </div>
        </div>

        {/* Produits ajoutés */}
        {formik.values.items.length > 0 && (
          <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-indigo-700 pb-2 border-b border-indigo-100">
              Produits ajoutés
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                      Produit
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                      Prix
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                      Quantité
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formik.values.items.map((item, index) => {
                    const product = products.find(
                      (p) => p._id === item.productId
                    );
                    if (!product) return null;

                    const itemTotal = item.quantity * product.price;

                    return (
                      <tr key={index}>
                        <td className="px-4 py-3">{product.name}</td>
                        <td className="px-4 py-3">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(index, item.quantity - 1)
                              }
                              className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              <FaMinus size={12} />
                            </button>
                            <span className="px-2">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(index, item.quantity + 1)
                              }
                              disabled={item.quantity >= product.quantity}
                              className="p-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                              <FaPlus size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatPrice(itemTotal)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTimes />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calculs finaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-indigo-700 pb-2 border-b border-indigo-100">
              Calculs
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Sous-total:</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Remise (%):</span>
                <input
                  type="number"
                  name="discount"
                  value={formik.values.discount}
                  onChange={formik.handleChange}
                  className="w-20 p-1 border border-gray-300 rounded text-right"
                  min="0"
                  max="100"
                />
              </div>

              <div className="flex justify-between">
                <span>Taxe (%):</span>
                <input
                  type="number"
                  name="tax"
                  value={formik.values.tax}
                  onChange={formik.handleChange}
                  className="w-20 p-1 border border-gray-300 rounded text-right"
                  min="0"
                  max="100"
                />
              </div>

              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-lg">
                <span>Net à Payer:</span>
                <span className="text-green-700">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-indigo-700 pb-2 border-b border-indigo-100">
              Informations supplémentaires
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode de paiement
              </label>
              <select
                name="paymentMethod"
                value={formik.values.paymentMethod}
                onChange={formik.handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Espèces">Espèces</option>
                <option value="Carte de crédit">Carte de crédit</option>
                <option value="Virement bancaire">Virement bancaire</option>
                <option value="chèque">chèque</option>
                <option value="effet">effet</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Entrez des notes supplémentaires"
              />
            </div>
          </div>
        </div>

        {/* Boutons Enregistrer, Annuler et Imprimer */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors text-sm md:text-base"
          >
            <FaTimes className="ml-2" /> Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 md:px-6 py-2 md:py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center justify-center transition-colors disabled:opacity-50 text-sm md:text-base"
          >
            {isSubmitting ? (
              <>
                <FaSync className="ml-2 animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <FaSave className="ml-2" /> Enregistrer la facture
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default InvoiceForm;
