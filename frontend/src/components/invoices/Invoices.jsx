"use client";

import { useState, useEffect } from "react";
import InvoicesTable from "./InvoicesTable";
import InvoiceForm from "./InvoiceForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// مكون مؤقت للإحصائيات
const InvoiceStats = () => (
  <div className="p-6 text-center text-gray-600">
    Les statistiques ne sont pas disponibles pour le moment
  </div>
);

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("table");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006";

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/invoices`;
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("customerName", searchTerm);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Échec de la récupération des données");
      const data = await response.json();
      setInvoices(data.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, searchTerm]);

  const handleCancelInvoice = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Annulé" }),
      });
      if (!response.ok) throw new Error("Échec de l'annulation de la facture");
      toast.success("Facture annulée avec succès");
      fetchInvoices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;

    try {
      const response = await fetch(`${API_URL}/api/invoices/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Échec de la suppression de la facture");
      toast.success("Facture supprimée avec succès");
      fetchInvoices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmitSuccess = () => {
    setFormOpen(false);
    setSelectedInvoice(null);
    fetchInvoices();
    toast.success(
      selectedInvoice ? "Facture mise à jour" : "Nouvelle facture créée"
    );
  };

  // دالة لتنسيق السعر كدرهم مغربي
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const handlePrintInvoice = (invoice) => {
    const printWindow = window.open("", "_blank");

    // التأكد من أن items موجود ومحدد بشكل صحيح
    const items = invoice.items || [];

    const invoiceContent = `
  <!DOCTYPE html>
  <html dir="ltr">
  <head>
    <meta charset="UTF-8">
    <title>Facture ${invoice.invoiceNumber || "inconnu"}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
      .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #4f46e5; padding-bottom: 15px; }
      .invoice-title { color: #4f46e5; font-size: 24px; font-weight: bold; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
      th { background-color: #f8fafc; }
      .totals { margin-left: auto; width: 300px; }
      .footer { margin-top: 40px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; color: #666; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 style="color: #4f46e5;">Votre Magasin</h1>
        <p>Adresse du magasin, Ville, Pays</p>
      </div>
      <div>
        <h2 class="invoice-title">Facture de Vente</h2>
        <p>Numéro de facture: ${invoice.invoiceNumber || "inconnu"}</p>
        <p>Date: ${new Date(invoice.createdAt).toLocaleDateString(
          "fr-FR"
        )}</p>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div>
        <h3>Informations du magasin:</h3>
        <p>Nom du magasin: Votre Magasin</p>
        <p>Téléphone: +212 612-345678</p>
      </div>
      <div>
        <h3>Informations du client:</h3>
        <p>Nom: ${invoice.customerName || "inconnu"}</p>
        ${invoice.customerPhone ? `<p>Téléphone: ${invoice.customerPhone}</p>` : ""}
      </div>
    </div>

    <h3>Produits:</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Nom du produit</th>
          <th>Prix</th>
          <th>Quantité</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.productName || "Produit inconnu"}</td>
            <td>${formatPrice(item.unitPrice)}</td>
            <td>${item.quantity || 0}</td>
            <td>${formatPrice(item.total)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="font-weight: bold;">Sous-total:</span>
        <span>${formatPrice(invoice.subtotal)}</span>
      </div>
      ${
        invoice.tax > 0
          ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="font-weight: bold;">Taxe:</span>
          <span>${formatPrice(invoice.tax)}</span>
        </div>
      `
          : ""
      }
      ${
        invoice.discount > 0
          ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="font-weight: bold;">Remise:</span>
          <span>-${formatPrice(invoice.discount)}</span>
        </div>
      `
          : ""
      }
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #ddd; font-weight: bold; font-size: 18px;">
        <span>Total:</span>
        <span>${formatPrice(invoice.total)}</span>
      </div>
    </div>

    <div style="margin-top: 30px;">
      <h3>Mode de paiement:</h3>
      <p>${invoice.paymentMethod || "Espèces"}</p>
    </div>

    <div class="footer">
      <p>Merci pour votre confiance</p>
      <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">
        Imprimer la facture
      </button>
    </div>
  </body>
  </html>
  `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Gestion des Factures
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos factures de vente et rapports de ventes
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              viewMode === "table"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Voir les factures
          </button>
        </div>

        {viewMode === "table" ? (
          <InvoicesTable
            data={invoices}
            loading={loading}
            onView={(invoice) => {
              setSelectedInvoice(invoice);
              setFormOpen(true);
            }}
            onCancel={handleCancelInvoice}
            onDelete={handleDeleteInvoice}
            onPrint={handlePrintInvoice} // تمرير دالة الطباعة
            onRefresh={fetchInvoices}
            onAdd={() => {
              setSelectedInvoice(null);
              setFormOpen(true);
            }}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        ) : (
          <InvoiceStats />
        )}

        {formOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-indigo-800">
                  {selectedInvoice ? "Voir la facture" : "Créer une nouvelle facture"}
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
              <InvoiceForm
                invoice={selectedInvoice}
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

export default Invoices;