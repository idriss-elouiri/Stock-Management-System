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
  FaEye,
  FaTrash,
  FaPlus,
  FaSync,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaFileInvoiceDollar,
  FaPrint,
  FaTimes,
} from "react-icons/fa";
import { motion } from "framer-motion";

const InvoicesTable = ({
  data,
  onView,
  onCancel,
  onDelete,
  onRefresh,
  onAdd,
  onPrint, // إضافة خاصية onPrint
  loading,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
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
        id: "invoiceNumber",
        header: "Numéro de facture",
        accessorKey: "invoiceNumber",
        cell: ({ getValue }) => (
          <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {getValue()}
          </span>
        ),
      },
      {
        id: "customerName",
        header: "Nom du client",
        accessorKey: "customerName",
      },
      {
        id: "date",
        header: "Date",
        accessorKey: "createdAt",
        cell: ({ getValue }) => (
          <span className="text-gray-600">
            {new Date(getValue()).toLocaleDateString("fr-FR")}
          </span>
        ),
      },
      {
        id: "items",
        header: "Nombre de produits",
        accessorKey: "items",
        cell: ({ getValue }) => {
          const items = getValue();
          return (
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
              {items.length} produit(s)
            </span>
          );
        },
      },
      {
        id: "total",
        header: "Montant total",
        accessorKey: "items", // بدل total استعمل items
        cell: ({ row }) => {
          const invoice = row.original;
          const items = invoice.items || [];

          const subtotal = items.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          );

          const discountRate = invoice.discount || 0;
          const discountAmount = (subtotal * discountRate) / 100;
          const ht = subtotal - discountAmount;

          const taxRate = 0.2;
          const tax = ht * taxRate;

          const total = ht + tax;

          return (
            <span className="font-medium text-green-700">
              {formatPrice(total)}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Statut",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const status = getValue();
          const statusConfig = {
            Complété: {
              color: "bg-green-100 text-green-800",
              label: "Complété",
            },
            "En attente": {
              color: "bg-yellow-100 text-yellow-800",
              label: "En attente",
            },
            Annulé: { color: "bg-red-100 text-red-800", label: "Annulé" },
          };

          const config = statusConfig[status] || statusConfig["Complété"];

          return (
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}
            >
              {config.label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onView(row.original)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Voir"
            >
              <FaEye />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPrint(row.original)} // استخدام onPrint الممررة من الأب
              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Imprimer"
            >
              <FaPrint />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(row.original._id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Supprimer"
            >
              <FaTrash />
            </motion.button>
          </div>
        ),
      },
    ],
    [onView, onPrint, onDelete] // إضافة onPrint إلى تبعيات useMemo
  );

  const table = useReactTable({
    data,
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
            <FaFileInvoiceDollar /> Liste des Factures
          </h2>
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAdd}
              className="bg-white text-indigo-700 px-4 py-2.5 rounded-xl flex items-center font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              <FaPlus className="ml-2" /> Nouvelle Facture
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRefresh}
              className="bg-indigo-800 hover:bg-indigo-900 text-white px-4 py-2.5 rounded-xl flex items-center font-medium shadow-md hover:shadow-lg transition-shadow"
            >
              <FaSync className="ml-2" /> Actualiser
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
              placeholder="Rechercher par nom du client..."
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
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="pl-4 pr-10 py-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="">Tous les statuts</option>
              <option value="Complété">Complété</option>
              <option value="En attente">En attente</option>
              <option value="Annulé">Annulé</option>
            </select>
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
                      Chargement des factures...
                    </p>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Aucune facture disponible
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
            <span className="text-sm text-gray-700">factures par page</span>
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
                {data.length} facture(s)
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InvoicesTable;
