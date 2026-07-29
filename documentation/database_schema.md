# Schéma de la Base de Données (Avo)

Voici le diagramme Entité-Relation (ER Diagram) représentant la structure principale de votre base de données, divisée par modules métier.

```mermaid
erDiagram
    %% Module : Cabinet & Utilisateurs
    CABINET_PROFILE {
        Long id PK
        String name
        String address
        String phone
        String email
    }
    
    APP_USER {
        Long id PK
        String username
        String email
        String role
    }

    %% Module : Clients & KYC
    CLIENT_ENTITY {
        Long id PK
        String email
        String telephone
        String type "PERSONNE, SOCIETE, ASSOCIATION..."
        String adresse
    }
    
    CLIENT_MORAL {
        Long id PK
        String raisonSociale
        String numImmatriculation
    }
    
    CLIENT_PHYSIQUE {
        Long id PK
        String nom
        String prenom
        String dateNaissance
    }
    
    UBO {
        Long id PK
        String fullName
        Double percentageOfOwnership
        String roleInCompany
    }
    
    SCREENING_MATCH {
        Long id PK
        String alertId
        Double score
        String status
    }
    
    DOCUMENT {
        Long id PK
        String fileName
        String path
    }

    %% Module : Formulures Dynamiques & Due Diligence
    FORM_CONFIG {
        String id PK
        String title
        String type
    }
    
    FIELD_CONFIG {
        String id PK
        String label
        String type
    }
    
    FIELD_OPTION {
        String id PK
        String value
    }
    
    DILIGENCE_FORM_RESULT {
        String id PK
        Date creationDate
    }
    
    FIELD_RESULT {
        String id PK
        String value
    }
    
    CLIENT_DILIGENCE_STATUS {
        String id PK
        String status "PENDING, SUBMITTED"
    }

    %% Module : Dossiers & Activités
    DOSSIER {
        Long id PK
        String title
        String status
    }
    
    TASK {
        Long id PK
        String description
        String status
    }
    
    MATTER_EVENT {
        Long id PK
        String title
        Date startDate
    }

    %% Module : Facturation (Billing)
    INVOICE {
        Long id PK
        String numeroFacture
        Double totalAmount
        String status
    }
    
    INVOICE_TIME_ENTRY {
        Long id PK
        Integer nbrOfMinutes
        Double price5min
    }

    %% Relations Clients
    CLIENT_ENTITY ||--|{ CLIENT_MORAL : "Hérite (Table per class)"
    CLIENT_ENTITY ||--|{ CLIENT_PHYSIQUE : "Hérite (Table per class)"
    CLIENT_MORAL ||--o{ UBO : "Possède"
    CLIENT_ENTITY ||--o{ DOCUMENT : "KYC Documents"
    CLIENT_ENTITY ||--o{ SCREENING_MATCH : "Résultats Sanctions"
    UBO ||--o{ SCREENING_MATCH : "Résultats Sanctions"

    %% Relations Due Diligence
    FORM_CONFIG ||--o{ FIELD_CONFIG : "Contient"
    FIELD_CONFIG ||--o{ FIELD_OPTION : "Choix multiples"
    
    CLIENT_ENTITY ||--o{ CLIENT_DILIGENCE_STATUS : "Assignation form."
    FORM_CONFIG ||--o{ CLIENT_DILIGENCE_STATUS : "Concerne"
    UBO |o--o{ CLIENT_DILIGENCE_STATUS : "Cible (Optionnel)"
    
    DILIGENCE_FORM_RESULT ||--|{ FIELD_RESULT : "Réponses"
    FORM_CONFIG ||--o{ DILIGENCE_FORM_RESULT : "Template"
    CLIENT_ENTITY ||--o{ DILIGENCE_FORM_RESULT : "Rempli par"
    UBO |o--o{ DILIGENCE_FORM_RESULT : "Concerne"
    
    CLIENT_DILIGENCE_STATUS |o--o| DILIGENCE_FORM_RESULT : "Lien au résultat"

    %% Relations Dossiers
    CLIENT_ENTITY ||--o{ DOSSIER : "Possède"
    DOSSIER ||--o{ TASK : "Tâches"
    DOSSIER ||--o{ MATTER_EVENT : "Événements/Audiences"

    %% Relations Facturation
    DOSSIER ||--o{ INVOICE : "Factures"
    INVOICE ||--o{ INVOICE_TIME_ENTRY : "Lignes de temps"
```

## Explication des Modules

1. **Clients & KYC** : Le `ClientEntity` est la table parente. Elle se décline en sous-types (Moral, Physique, etc.). Les sociétés (`ClientMoral`) peuvent avoir plusieurs bénéficiaires effectifs (`UBO`). Chacun peut être lié à des `ScreeningMatch` (alertes Yente/OpenSanctions).
2. **Due Diligence** : Les formulaires sont entièrement dynamiques (`FormConfig` contient des `FieldConfig`). Lorsqu'un cabinet assigne un formulaire à un client (ou à un UBO spécifique de ce client), un `ClientDiligenceStatus` est créé (statut PENDING). Une fois rempli, un `DiligenceFormResult` est généré, qui stocke une liste de `FieldResult` (les réponses réelles).
3. **Dossiers** : Un client a un ou plusieurs `Dossier`. Un dossier regroupe des événements, des tâches et des notes liés au cas légal.
4. **Facturation** : Chaque `Dossier` génère des `Invoice` (factures). Les factures contiennent des `InvoiceTimeEntry` (le temps passé par l'avocat facturé par tranches).
