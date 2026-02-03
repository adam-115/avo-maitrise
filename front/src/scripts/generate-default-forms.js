const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../db.json');

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function generateTimestampId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Default questions configurations
const defaultQuestions = [
    {
        type: 'select',
        name: 'Origine des fonds',
        labelMessage: "Quelle est l'origine principale des fonds ?",
        facteur: 5,
        required: true,
        optionsLayout: 'block',
        options: [
            { value: 'Salaire / Revenus professionnels', score: 1 },
            { value: 'Épargne personnelle', score: 1 },
            { value: 'Vente immobilière', score: 2 },
            { value: 'Héritage / Donation', score: 3 },
            { value: 'Investissements crypto', score: 8 },
            { value: 'Inconnue / Non justifiée', score: 10 }
        ]
    },
    {
        type: 'radio',
        name: 'PPE',
        labelMessage: "Le client est-il une Personne Politiquement Exposée (PPE) ?",
        facteur: 10,
        required: true,
        optionsLayout: 'inline',
        options: [
            { value: 'Non', score: 0 },
            { value: 'Oui', score: 10 }
        ]
    },
    {
        type: 'select',
        name: 'Montant de la transaction',
        labelMessage: "Montant estimé des transactions annuelles",
        facteur: 3,
        required: true,
        optionsLayout: 'block',
        options: [
            { value: '< 10 000 €', score: 1 },
            { value: '10 000 € - 50 000 €', score: 2 },
            { value: '50 000 € - 150 000 €', score: 5 },
            { value: '> 150 000 €', score: 8 }
        ]
    }
];

function createInputConfigs() {
    return defaultQuestions.map((q, index) => {
        const inputId = generateTimestampId();
        return {
            id: inputId,
            ...q,
            displayOrer: index,
            options: q.options ? q.options.map((opt, i) => ({
                id: generateTimestampId(),
                ...opt,
                order: i
            })) : []
        };
    });
}

try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // Initialize arrays if they don't exist
    if (!data.AmlFormConfig) data.AmlFormConfig = [];
    if (!data.MappingForm) data.MappingForm = [];

    let newFormsCount = 0;

    // Type Clients
    const typeClients = data.type_client || data.TypeClient || []; // Handle potential key variations
    // Secteurs
    const secteurs = data.SecteurActivite || [];
    // Organismes
    const organismes = data.TypeOrganisme || [];

    // Combinations to check
    const combinations = [];

    typeClients.filter(t => t.actif !== false).forEach(client => {
        if (client.code === 'INSTITUTION') {
            organismes.filter(o => o.actif !== false).forEach(org => {
                combinations.push({ typeClient: 'INSTITUTION', secteur: org.libelle }); // mapping uses 'secteurActivite' field for org type too in code logic
            });
        } else {
            secteurs.filter(s => s.actif !== false).forEach(sect => {
                combinations.push({ typeClient: client.code, secteur: sect.code });
            });
        }
    });

    console.log(`Found ${combinations.length} potential combinations.`);

    combinations.forEach(combo => {
        // Check if a mapping already exists for this combo
        const exists = data.MappingForm.find(m =>
            m.typeClient === combo.typeClient &&
            m.secteurActivite === combo.secteur
        );

        if (!exists) {
            console.log(`Creating form for: ${combo.typeClient} - ${combo.secteur}`);

            // 1. Create Form Config
            const formId = String(Math.floor(Math.random() * 100000)); // String ID for consistency
            const newForm = {
                id: formId,
                formName: `aml_default_${combo.typeClient}_${combo.secteur}`.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                formTitle: `KYC Standard - ${combo.typeClient}`,
                formDescription: `Formulaire de conformité standard pour le secteur ${combo.secteur}`,
                order: 0,
                inputConfigs: createInputConfigs()
            };

            data.AmlFormConfig.push(newForm);

            // 2. Create Mapping
            const mappingId = String(Math.floor(Math.random() * 100000));
            const newMapping = {
                id: mappingId,
                typeClient: combo.typeClient,
                secteurActivite: combo.secteur,
                amlFormConfigID: formId
            };

            data.MappingForm.push(newMapping);
            newFormsCount++;
        } else {
            console.log(`Skipping: ${combo.typeClient} - ${combo.secteur} (Already exists)`);
        }
    });

    if (newFormsCount > 0) {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        console.log(`SUCCESS: Created ${newFormsCount} new default forms.`);
    } else {
        console.log("No new forms needed. All combinations already covered.");
    }

} catch (err) {
    console.error("Error generating forms:", err);
}
