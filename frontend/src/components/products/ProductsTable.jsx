"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSync,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaBox,
} from "react-icons/fa";
import { motion } from "framer-motion";

const ProductsTable = ({
  data,
  onEdit,
  onDelete,
  onRefresh,
  onAdd,
  loading,
  searchTerm,
  onSearchChange,
  filterLowStock,
  onFilterLowStockChange,
}) => {
  const [categoryFilter, setCategoryFilter] = useState("");

  const handlePrintProducts = () => {
    const printWindow = window.open("", "_blank");
    const content = `
    <html>
      <head>
        <title>Liste des Produits</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 15px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
          th { background-color: #f4f4f4; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Liste des Produits</h1>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Prix Vente</th>
              <th>Quantité</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData
              .map(
                (p) => `
              <tr>
                <td>${p.code}</td>
                <td>${p.name}</td>
                <td>${p.category || "---"}</td>
              
                <td>${formatPrice(p.price)}</td>
                <td>${p.quantity}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDeleteClick = (id, name) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer le produit "${name}" ?`
      )
    ) {
      onDelete(id);
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

  const columns = useMemo(
    () => [
      {
        id: "code",
        header: "Code Produit",
        accessorKey: "code",
        cell: ({ getValue }) => (
          <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {getValue()}
          </span>
        ),
      },
      {
        id: "name",
        header: "Nom du Produit",
        accessorKey: "name",
      },
      {
        id: "category",
        header: "Catégorie",
        accessorKey: "category",
        cell: ({ getValue }) => getValue() || "---",
      },
      {
        id: "purchasePrice",
        header: "PRIX D'ACHAT",
        accessorKey: "purchasePrice",
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? (
            <span className="font-medium text-green-700">
              {formatPrice(value)}
            </span>
          ) : (
            "---"
          ); // 👈 إذا ماكانش، ما يبان والو
        },
      },
      {
        id: "price",
        header: "Prix (MAD)",
        accessorKey: "price",
        cell: ({ getValue }) => (
          <span className="font-medium text-green-700">
            {formatPrice(getValue())}
          </span>
        ),
      },
      {
        id: "quantity",
        header: "Quantité",
        accessorKey: "quantity",
        cell: ({ row }) => {
          const quantity = row.original.quantity;
          const minStockLevel = row.original.minStockLevel || 0;
          const isLowStock = quantity <= minStockLevel;

          return (
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                isLowStock
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {quantity} {isLowStock && "⚠️"}
            </span>
          );
        },
      },
      {
        id: "minStockLevel",
        header: "Seuil d'Alerte",
        accessorKey: "minStockLevel",
        cell: ({ getValue }) => getValue() || "---",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(row.original)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Modifier"
            >
              <FaEdit />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                handleDeleteClick(row.original._id, row.original.name)
              }
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Supprimer"
            >
              <FaTrash />
            </motion.button>
          </div>
        ),
      },
    ],
    []
  );

  // استخراج الفئات الفريدة من البيانات
  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    data.forEach((product) => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return Array.from(categories).sort();
  }, [data]);

  // تطبيق الفلترة حسب الفئة
  const filteredData = useMemo(() => {
    let result = data;

    if (categoryFilter) {
      result = result.filter(
        (product) => product.category && product.category === categoryFilter
      );
    }

    if (filterLowStock) {
      result = result.filter(
        (product) => product.quantity <= (product.minStockLevel || 0)
      );
    }

    return result;
  }, [data, categoryFilter, filterLowStock]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200"
    >
      <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaBox /> Liste des Produits
          </h2>
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAdd}
              className="bg-white text-indigo-700 px-4 py-2.5 rounded-xl flex items-center font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              <FaPlus className="ml-2" /> Ajouter un Produit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRefresh}
              className="bg-indigo-800 hover:bg-indigo-900 text-white px-4 py-2.5 rounded-xl flex items-center font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              <FaSync className="ml-2" /> Actualiser
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePrintProducts}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl flex items-center font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              🖨️ Imprimer
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-4 pr-10 py-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-4 pr-10 py-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="">Toutes les catégories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="lowStockFilter"
              checked={filterLowStock}
              onChange={(e) => onFilterLowStockChange(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="lowStockFilter" className="text-sm text-gray-700">
              Afficher seulement les produits en stock faible
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-inner">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider bg-gray-100"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                    <p className="mt-4 text-gray-600">
                      Chargement des produits...
                    </p>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Aucun produit disponible
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <motion.tr
                    key={row.id}
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Afficher</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm"
            >
              {[5, 8, 10, 20].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">produits par page</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <FaChevronLeft className="text-gray-600" />
              </motion.button>

              <span className="text-sm text-gray-700 min-w-[100px] text-center">
                Page {table.getState().pagination.pageIndex + 1} sur{" "}
                {table.getPageCount()}
              </span>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <FaChevronRight className="text-gray-600" />
              </motion.button>
            </div>

            <div className="bg-indigo-50 rounded-lg px-3 py-1.5">
              <span className="text-indigo-700 font-medium text-sm">
                {filteredData.length} produit(s)
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductsTable;
