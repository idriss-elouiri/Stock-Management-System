"use client";

import { useEffect, useState } from "react";
import {
  FaSave,
  FaSync,
  FaTimes,
  FaBox,
  FaDollarSign,
  FaHashtag,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useFormik } from "formik";

const ProductForm = ({ product, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

  const formik = useFormik({
    initialValues: {
      code: product?.code || "",
      name: product?.name || "",
      price: product?.price || 0,
      quantity: product?.quantity || 0,
      category: product?.category || "",
      description: product?.description || "",
      minStockLevel: product?.minStockLevel || 0,
    },
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const url = product
          ? `${API_URL}/api/products/${product._id}`
          : `${API_URL}/api/products`;
        const method = product ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Échec de l'enregistrement du produit");
        }

        onSuccess();
      } catch (error) {
        alert(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const inputClass = (touched, error) =>
    `w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
      touched && error
        ? "border-red-500 bg-red-50"
        : "border-gray-300 hover:border-indigo-300"
    }`;

  const sectionClass =
    "space-y-4 p-5 bg-white rounded-xl shadow-sm border border-gray-100";
  const sectionHeaderClass =
    "text-lg font-semibold text-indigo-700 flex items-center pb-2 border-b border-indigo-100";

  // دالة لتنسيق السعر كدرهم مغربي
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Informations de base */}
        <div className={sectionClass}>
          <h3 className={sectionHeaderClass}>
            <FaBox className="ml-2 text-indigo-500" /> Informations de base
          </h3>

          {/* Code produit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code produit *
            </label>
            <div className="relative">
              <input
                type="text"
                name="code"
                value={formik.values.code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass(formik.touched.code, formik.errors.code)}
                placeholder="Entrez le code du produit"
              />
              <FaHashtag className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            {formik.touched.code && formik.errors.code && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FaInfoCircle className="ml-1" /> {formik.errors.code}
              </p>
            )}
          </div>

          {/* Nom du produit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit *
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass(formik.touched.name, formik.errors.name)}
                placeholder="Entrez le nom du produit"
              />
              <FaBox className="absolute left-3 top-3.5 text-gray-400" />
            </div>
            {formik.touched.name && formik.errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FaInfoCircle className="ml-1" /> {formik.errors.name}
              </p>
            )}
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <input
              type="text"
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={inputClass(
                formik.touched.category,
                formik.errors.category
              )}
              placeholder="Entrez la catégorie du produit"
            />
          </div>
        </div>

        {/* Informations financières et stock */}
        <div className={sectionClass}>
          <h3 className={sectionHeaderClass}>
            <FaDollarSign className="ml-2 text-indigo-500" /> Informations financières et stock
          </h3>

          {/* Prix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix (MAD) *
            </label>
            <div className="relative">
              <input
                type="number"
                name="price"
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={inputClass(formik.touched.price, formik.errors.price)}
                placeholder="Entrez le prix du produit"
                step="0.01"
                min="0"
              />
              <span className="absolute left-3 top-3.5 text-gray-400">MAD</span>
            </div>
            {formik.touched.price && formik.errors.price && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FaInfoCircle className="ml-1" /> {formik.errors.price}
              </p>
            )}
            {formik.values.price > 0 && (
              <p className="mt-1 text-sm text-green-600">
                {formatPrice(formik.values.price)}
              </p>
            )}
          </div>

          {/* Quantité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité *
            </label>
            <input
              type="number"
              name="quantity"
              value={formik.values.quantity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={inputClass(
                formik.touched.quantity,
                formik.errors.quantity
              )}
              placeholder="Entrez la quantité du produit"
              min="0"
            />
            {formik.touched.quantity && formik.errors.quantity && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <FaInfoCircle className="ml-1" /> {formik.errors.quantity}
              </p>
            )}
          </div>

          {/* Niveau d'alerte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaExclamationTriangle className="ml-1 text-sm text-amber-500" />{" "}
              Niveau d'alerte
            </label>
            <input
              type="number"
              name="minStockLevel"
              value={formik.values.minStockLevel}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={inputClass(
                formik.touched.minStockLevel,
                formik.errors.minStockLevel
              )}
              placeholder="Seuil minimum d'alerte"
              min="0"
            />
            {formik.touched.minStockLevel &&
              formik.errors.minStockLevel && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FaInfoCircle className="ml-1" />{" "}
                  {formik.errors.minStockLevel}
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className={sectionClass}>
        <h3 className={sectionHeaderClass}>
          <FaInfoCircle className="ml-2 text-indigo-500" /> Description
        </h3>
        <textarea
          name="description"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          rows={4}
          className={inputClass(
            formik.touched.description,
            formik.errors.description
          )}
          placeholder="Entrez la description du produit"
        />
      </div>

      {/* Boutons Enregistrer et Annuler */}
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
              <FaSave className="ml-2" /> Enregistrer
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;