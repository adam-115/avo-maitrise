export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID';

export interface InvoiceLineItem {
    id: string;
    description: string;
    quantity: number;      // Heures ou Unités
    hourlyRate: number;    // Taux unitaire
    vatRate: number;       // TVA (ex: 20)
    totalHT: number;
    totalTTC: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string; // N° facture
    date: Date;
    clientId: string;      // Référence au client (ID ou nom pour l'instant)

    status: InvoiceStatus;

    lineItems: InvoiceLineItem[];

    // Footer / Totaux globaux
    disbursements: number; // Débours/Frais supplémentaires
    totalHT: number;
    totalVAT: number;
    totalTTC: number;

    createdAt: Date;
    updatedAt: Date;
}
