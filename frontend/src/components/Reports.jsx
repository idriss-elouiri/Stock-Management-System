"use client";

import { useState, useEffect } from "react";
import {
  FaChartBar,
  FaBox,
  FaMoneyBillWave,
  FaFilter,
  FaDownload,
  FaPrint,
  FaSync
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("top-products");
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("30days");
  const [topProductsLimit, setTopProductsLimit] = useState(10);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [reportData, setReportData] = useState({});
  const [lowStockData, setLowStockData] = useState([]);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

  useEffect(() => {
    if (activeTab === "top-products") {
      fetchSalesReport();
    } else if (activeTab === "low-stock") {
      fetchLowStockProducts();
    }
  }, [activeTab, timeRange, topProductsLimit, lowStockThreshold]);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/invoices/stats`;
      let params = new URLSearchParams();

      params.append("limit", topProductsLimit);
      
      if (timeRange === "7days") {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        params.append("startDate", startDate.toISOString().split('T')[0]);
      } else if (timeRange === "30days") {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        params.append("startDate", startDate.toISOString().split('T')[0]);
      } else if (timeRange === "90days") {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        params.append("startDate", startDate.toISOString().split('T')[0]);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Échec de la récupération des données de vente");
      const data = await response.json();
      setReportData(data.data || {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/products?limit=100`);
      if (!response.ok) throw new Error("Échec de la récupération des produits");
      const data = await response.json();
      
      // Filtrer les produits à faible stock
      const lowStockProducts = data.data.filter(product => 
        product.quantity <= lowStockThreshold
      );
      
      setLowStockData(lowStockProducts);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };


  const renderTopProducts = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center bg-white rounded-xl p-3 shadow-sm">
          <FaFilter className="text-gray-400 ml-2" />
          <select
            value={topProductsLimit}
            onChange={(e) => setTopProductsLimit(e.target.value)}
            className="bg-transparent border-none focus:ring-0"
          >
            <option value="5">Top 5 produits</option>
            <option value="10">Top 10 produits</option>
            <option value="20">Top 20 produits</option>
          </select>
        </div>
        
        <div className="flex items-center bg-white rounded-xl p-3 shadow-sm">
          <FaFilter className="text-gray-400 ml-2" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent border-none focus:ring-0"
          >
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
            <option value="90days">90 derniers jours</option>
          </select>
        </div>
      </div>

      {reportData.topProducts && reportData.topProducts.length > 0 ? (
        <>
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  <tr>
                    <th className="px-4 py-3 md:px-6 md:py-3 text-right">Produit</th>
                    <th className="px-4 py-3 md:px-6 md:py-3 text-right">Quantité vendue</th>
                    <th className="px-4 py-3 md:px-6 md:py-3 text-right">Revenus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.topProducts.map((product, index) => (
                    <tr key={product._id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 md:px-6 md:py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="font-bold text-indigo-600 text-sm md:text-base">{index + 1}</span>
                          </div>
                          <div className="mr-3">
                            <p className="font-medium text-gray-900 text-sm md:text-base">
                              {product.productName || "Produit inconnu"}
                            </p>
                            {product.productCode && (
                              <p className="text-xs md:text-sm text-gray-500">{product.productCode}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-4 font-medium text-sm md:text-base">{product.totalSold}</td>
                      <td className="px-4 py-4 md:px-6 md:py-4 font-medium text-green-600 text-sm md:text-base">
                        {product.totalRevenue?.toLocaleString()} MAD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Résumé des ventes</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Ventes totales:</span>
                  <span className="font-bold text-green-600 text-sm md:text-base">
                    {reportData.totalSales?.toLocaleString()} MAD
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Nombre de factures:</span>
                  <span className="font-bold text-blue-600 text-sm md:text-base">
                    {reportData.invoiceCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Moyenne par facture:</span>
                  <span className="font-bold text-purple-600 text-sm md:text-base">
                    {reportData.totalSales && reportData.invoiceCount 
                      ? Math.round(reportData.totalSales / reportData.invoiceCount).toLocaleString() 
                      : 0
                    } MAD
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Meilleurs produits</h3>
              <div className="space-y-3">
                {reportData.topProducts.slice(0, 3).map((product, index) => (
                  <div key={product._id || index} className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-medium">{product.productName || "Produit inconnu"}</span>
                    <div className="flex items-center">
                      <div className="w-16 md:w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="h-2 rounded-full bg-indigo-600" 
                          style={{ 
                            width: `${(product.totalRevenue / (reportData.topProducts[0]?.totalRevenue || 1)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round((product.totalRevenue / (reportData.topProducts[0]?.totalRevenue || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl p-6 md:p-8 text-center">
          <p className="text-gray-500">Aucune donnée de vente disponible</p>
        </div>
      )}
    </div>
  );

  const renderLowStock = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center bg-white rounded-xl p-3 shadow-sm">
          <FaFilter className="text-gray-400 ml-2" />
          <select
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
            className="bg-transparent border-none focus:ring-0"
          >
            <option value="3">3 pièces ou moins</option>
            <option value="5">5 pièces ou moins</option>
            <option value="10">10 pièces ou moins</option>
          </select>
        </div>
      </div>

      {lowStockData.length > 0 ? (
        <>
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <tr>
                    <th className="px-4 py-3 md:px-6 md:py-3 text-right">Produit</th>
                    <th className="px-4 py-3 md:px-6 md:py-3 text-right">Code</th>
                    <th className="px-4 py-3 md:px-6 md:py-3 text-right">Stock actuel</th>
                    <th className="px-4 py-3 md:px-6 md:py-3 text-right">Prix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lowStockData.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 md:px-6 md:py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <FaBox className="text-orange-600 text-sm md:text-base" />
                          </div>
                          <div className="mr-3">
                            <p className="font-medium text-gray-900 text-sm md:text-base">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-4">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                          {product.code}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.quantity === 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-6 md:py-4 font-medium text-sm md:text-base">{product.price?.toLocaleString()} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Résumé du stock faible</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="text-center p-3 md:p-4 bg-red-50 rounded-xl">
                <p className="text-xl md:text-2xl font-bold text-red-600">
                  {lowStockData.filter(p => p.quantity === 0).length}
                </p>
                <p className="text-xs md:text-sm text-red-800">Produits en rupture de stock</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-orange-50 rounded-xl">
                <p className="text-xl md:text-2xl font-bold text-orange-600">
                  {lowStockData.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold).length}
                </p>
                <p className="text-xs md:text-sm text-orange-800">Produits à faible stock</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl p-6 md:p-8 text-center">
          <p className="text-gray-500">Aucun produit à faible stock</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800">Rapports et Statistiques</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">Analyse des performances des ventes et du stock</p>
        </div>

        {/* Barre de contrôle */}
        <div className="bg-white rounded-2xl p-3 md:p-4 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("top-products")}
                className={`px-3 py-2 md:px-4 md:py-2 rounded-xl font-medium transition-all duration-200 flex items-center text-sm md:text-base ${
                  activeTab === "top-products"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <FaChartBar className="ml-2" /> Plus vendus
              </button>
              <button
                onClick={() => setActiveTab("low-stock")}
                className={`px-3 py-2 md:px-4 md:py-2 rounded-xl font-medium transition-all duration-200 flex items-center text-sm md:text-base ${
                  activeTab === "low-stock"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <FaBox className="ml-2" /> Stock faible
              </button>
            </div>

          </div>
        </div>

        {/* Contenu du rapport */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
          {loading ? (
            <div className="flex justify-center items-center py-12 md:py-20">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="mr-3 text-gray-600">Chargement des données...</p>
            </div>
          ) : (
            <>
              {activeTab === "top-products" && renderTopProducts()}
              {activeTab === "low-stock" && renderLowStock()}
            </>
          )}
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        toastClassName="!bg-white !text-gray-800 !shadow-lg !rounded-xl !border !border-gray-200"
        progressClassName="!bg-gradient-to-r !from-blue-500 !to-indigo-600"
      />
    </div>
  );
};

export default Reports;