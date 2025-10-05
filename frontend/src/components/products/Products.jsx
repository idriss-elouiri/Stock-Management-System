"use client";

import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProductForm from "./ProductForm";
import ProductsTable from "./ProductsTable";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/products/all`);
      if (!response.ok) throw new Error("Échec de la récupération des données");
      const data = await response.json();
      setProducts(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Échec de la suppression du produit");

      toast.success("Produit supprimé avec succès");
      fetchProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmitSuccess = () => {
    setFormOpen(false);
    setSelectedProduct(null);
    fetchProducts();
    toast.success(
      selectedProduct ? "Produit mis à jour" : "Nouveau produit ajouté"
    );
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLowStock = filterLowStock
      ? product.quantity <= product.minStockLevel
      : true;

    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Gestion des Produits
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez votre inventaire de produits facilement et professionnellement
          </p>
        </div>

        <ProductsTable
          data={filteredProducts}
          loading={loading}
          onEdit={(product) => {
            setSelectedProduct(product);
            setFormOpen(true);
          }}
          onDelete={handleDelete}
          onRefresh={fetchProducts}
          onAdd={() => {
            setSelectedProduct(null);
            setFormOpen(true);
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterLowStock={filterLowStock}
          onFilterLowStockChange={setFilterLowStock}
        />

        {formOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-indigo-800">
                  {selectedProduct
                    ? "Modifier le Produit"
                    : "Ajouter un Nouveau Produit"}
                </h2>
                <button
                  onClick={() => setFormOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <ProductForm
                product={selectedProduct}
                onSuccess={handleSubmitSuccess}
                onCancel={() => setFormOpen(false)}
              />
            </div>
          </div>
        )}

        <ToastContainer
          position="top-center"
          autoClose={3000}
          toastClassName="!bg-white !text-gray-800 !shadow-lg !rounded-xl !border !border-gray-200"
          progressClassName="!bg-gradient-to-r !from-blue-500 !to-indigo-600"
        />
      </div>
    </div>
  );
};

export default Products;
