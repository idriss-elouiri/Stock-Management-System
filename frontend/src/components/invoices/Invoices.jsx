"use client";

import { useState, useEffect } from "react";
import InvoicesTable from "./InvoicesTable";
import InvoiceForm from "./InvoiceForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../../../public/logo.png";
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
      if (!response.ok)
        throw new Error("Échec de la suppression de la facture");
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
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handlePrintInvoice = (invoice) => {
    const printWindow = window.open("", "_blank");
    const logoPath = logo.src;
    const items = invoice.items || [];

    // حساب الضريبة (مثال: 20%)
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const discountAmount = (subtotal * (invoice.discount || 0)) / 100;
    const ht = subtotal - discountAmount;
    const taxRate = 0.2; // 20%
    const tax = ht * taxRate;
    const total = ht + tax;

    const invoiceContent = `
<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.invoiceNumber || "inconnu"}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 20px 40px; 
      color: #333; 
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .logo { max-height: 150px; }
    .facture-info {
      border: 1px solid #000;
      padding: 10px 15px;
      font-size: 12px;
    }
    .facture-info p { margin: 4px 0; }
    .box {
      border: 1px solid #000;
      padding: 10px 15px;
      margin-top: 8px;
      font-size: 12px;
    }
    .client-info, .payment-info {
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
      font-size: 12px;
    }
    th { background: #f1f1f1; }
    .totals {
      margin-top: 20px;
      width: 250px;
      margin-left: auto;
      border: 1px solid #000;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      padding: 6px 10px;
      border-bottom: 1px solid #000;
      font-size: 12px;
    }
    .totals div:last-child {
      font-weight: bold;
      background: #f1f1f1;
    }
 .footer {
  margin-top: 40px;
  font-size: 11px;
  text-align: center;
  border-top: 2px solid #4f46e5;
  padding-top: 15px;
  color: #444;
  line-height: 1.6;
}

.footer .thanks {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #4f46e5;
}

.footer p {
  margin: 3px 0;
}

.print-btn {
  margin-top: 18px;
  padding: 8px 18px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: background 0.3s ease;
}

.print-btn:hover {
  background: #3730a3;
}


  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <img src="${logoPath}" alt="Logo" class="logo">
    </div>
    <div class="facture-info">
      <p><strong>FACTURE N°:</strong> ${invoice.invoiceNumber || "inconnu"}</p>
      <p><strong>Date:</strong> ${new Date(
        invoice.createdAt
      ).toLocaleDateString("fr-FR")}</p>
    </div>
  </div>

  <!-- Client + Payment -->
  <div style="display:flex; gap:15px; margin-bottom:20px;">
   <div class="box payment-info" style="flex:1;">
      <strong>MODE DE RÈGLEMENT:</strong><br>
      <p>${invoice.paymentMethod || "Espèces"}</p>
    </div>
    <div class="box client-info" style="flex:1;">
      <strong>CLIENT:</strong><br>
      <p>Nom: ${invoice.customerName || "inconnu"}</p>
      ${
        invoice.customerPhone
          ? `<p>Téléphone: ${invoice.customerPhone}</p>`
          : ""
      }
      ${invoice.customerICE ? `<p>ICE: ${invoice.customerICE}</p>` : ""}
    </div>
  </div>

  <!-- Table Produits -->
   <table>
      <thead>
        <tr>
          <th>Référence</th>
          <th>Désignation</th>
          <th>Quantité</th>
          <th>P.U. TTC</th>
          <th>Tx Rem</th>
          <th>Montant TTC</th>
        </tr>
      </thead>
      <tbody>
    ${items
      .map((item) => {
        const reference = item.productCode || item.product?.code || "-";
        const discountRate =
          item.discountRate !== undefined
            ? item.discountRate
            : invoice.discount
            ? invoice.discount
            : 0;

        // حساب المبلغ بعد الخصم
        const amount = item.unitPrice * item.quantity;
        const discounted = amount - (amount * discountRate) / 100;

        return `
          <tr>
            <td>${reference}</td>
            <td>${item.productName || "Produit inconnu"}</td>
            <td>${item.quantity || 0}</td>
            <td>${formatPrice(item.unitPrice)}</td>
            <td>${discountRate}%</td>
            <td>${formatPrice(discounted)}</td>
          </tr>
        `;
      })
      .join("")}
  </tbody>
    </table>

    <!-- Totaux -->
    <div class="totals">
      <div><span>H.T:</span><span>${formatPrice(ht)}</span></div>
      <div><span>T.V.A:</span><span>${formatPrice(tax)}</span></div>
      <div><span>NET À PAYER:</span><span>${formatPrice(total)}</span></div>
    </div>

  <!-- Footer -->
<div class="footer">
  <p class="thanks">Merci pour votre confiance</p>

  <p>N RUE 43 ETAGE 4 HAY TARIK SIDI BERNOUSSI CASABLANCA, Tél: +212 658569830</p>
  <p>RC N 661333, IF 66214735, PATENTE 2985974, CNSS 5936021</p>
  <p>ICE 003663464000088</p>

  <button class="print-btn" onclick="window.print()">🖨️ Imprimer la facture</button>
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
                  {selectedInvoice
                    ? "Voir la facture"
                    : "Créer une nouvelle facture"}
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
