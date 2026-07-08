package com.avo.entities;

/**
 * Enumération représentant le statut d'une facture (Invoice) au cours de son cycle de vie.
 */
public enum InvoiceStatusEnum {
    
    // 1. Phase de Création et de Validation
    
    /**
     * Brouillon / Proforma : La facture est en cours de montage. Elle est modifiable, 
     * ne possède pas de numéro séquentiel définitif, et les prestations associées peuvent encore être ajustées.
     */
    DRAFT,
    
    /**
     * Émise / Validée : Le point de non-retour. La facture reçoit son numéro comptable officiel. 
     * Elle devient strictement immuable, et toutes les prestations qui y sont liées sont définitivement verrouillées.
     */
    ISSUED,
    
    // 2. Phase de Paiement (Cycle Nominal)
    
    /**
     * Partiellement payée : Un règlement a été reçu, mais il ne couvre pas la totalité du montant exigé 
     * (acompte, échéancier, ou paiement partiel).
     */
    PARTIALLY_PAID,
    
    /**
     * Payée / Soldée : L'intégralité du montant a été réglée par le client. Le cycle standard est terminé.
     */
    PAID,
    
    // 3. Phase de Retard et de Litige
    
    /**
     * En retard : La date d'échéance de la facture (due_date) est dépassée sans que le solde ne soit nul. 
     * Ce statut déclenche généralement les processus de relance automatiques.
     */
    OVERDUE,
    
    // 4. Phase de Résolution d'Échec
    
    /**
     * Annulée : La facture contenait une erreur interne (mauvais destinataire, erreur de TVA) 
     * et doit être annulée par le cabinet.
     */
    CANCELLED,
    
    /**
     * Pertes et profits / Irrécouvrable : Le processus de recouvrement a échoué. 
     * La facture est comptabilisée comme une perte définitive.
     */
    WRITTEN_OFF
}
