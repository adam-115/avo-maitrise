describe('Dossier Lifecycle', () => {
  const uniqueId = Date.now();
  const dossierRef = `REF_${uniqueId}`;
  const dossierTitre = `DossierTitre_${uniqueId}`;
  const updatedTitre = `DossierTitre_Updated_${uniqueId}`;

  it('should create and update a dossier successfully', () => {
    cy.viewport(1920, 1080);
    // 0. Ensure at least one EventType exists
    cy.intercept('GET', '/api/EventType*').as('fetchEventTypes');
    cy.visit('http://localhost:8080/home/event-type');
    cy.wait('@fetchEventTypes');
    cy.get('table tbody tr').then($trs => {
      if ($trs.length === 1 && $trs.text().includes("Aucun type")) {
        cy.get('input[formControlName="label"]').type('Audience');
        cy.get('input[formControlName="code"]').type(`AUD_${Date.now()}`);
        cy.get('button[type="submit"]').click();
        cy.contains('td', 'Audience').should('exist');
      }
    });

    // 1. Visit new dossier form
    cy.visit('http://localhost:8080/home/dossier-form');

    // 2. Fill general info
    cy.get('input[formControlName="referenceInterne"]').type(dossierRef);
    cy.get('input[formControlName="titre"]').type(dossierTitre);
    cy.get('textarea[formControlName="description"]').type('Description de test');

    // 3. Select Client
    cy.contains('button', 'Sélectionner un client').click();
    // Click the first available client in list
    cy.get('app-client-selection-dialog li').first().click();
    cy.get('app-client-selection-dialog').contains('button', 'Confirmer').click();

    // 4. Select Responsable
    cy.contains('button', 'Assigner un responsable').click();
    // Click the first available user in list
    cy.get('app-user-selection-dialog li').first().click();
    cy.get('app-user-selection-dialog').contains('button', 'Confirmer').click();

    // 5. Select Domaine Juridique
    cy.contains('button', 'Sélectionner un domaine').click();
    // Click the first available legal domain
    cy.get('app-domaine-juridique-selection-dialog li').first().click();
    cy.get('app-domaine-juridique-selection-dialog').contains('button', 'Confirmer').click();

    // 6. Select Priority (Select index 1)
    cy.get('select[formControlName="prioriteID"]').select(1);

    // 7. Select Status (Select index 1)
    cy.get('select[formControlName="statutID"]').select(1);

    // 8. Submit the form
    cy.get('button[type="submit"]').click();

    // 9. Verify navigation back to the list and that it is present
    cy.url().should('include', '/home/dossier');
    
    // Wait for list page loading spinner to disappear
    cy.contains('Chargement des dossiers').should('not.exist');
    
    // Search for our dossier
    cy.get('input[placeholder*="Rechercher"]').clear().type(dossierRef);
    cy.contains('a', dossierTitre).should('exist');

    // 10. Go to dossier details
    cy.contains('a', dossierTitre).click();
    cy.url().should('include', '/home/dossier-detail');

    // 11. Click "Modifier"
    cy.contains('button', 'Modifier').click();
    cy.url().should('include', '/home/dossier/edit');

    // Wait for form to load dossier
    cy.get('input[formControlName="referenceInterne"]').should('have.value', dossierRef);

    // 12. Modify title
    cy.get('input[formControlName="titre"]').clear().type(updatedTitre);

    // 13. Submit modification
    cy.get('button[type="submit"]').click();

    // 14. Confirm sweetalert modal
    cy.get('.swal2-confirm').click();

    // 15. Verify redirection back to the list and check updated title
    cy.url().should('include', '/home/dossier');
    
    // Wait for list page loading spinner to disappear
    cy.contains('Chargement des dossiers').should('not.exist');
    
    cy.get('input[placeholder*="Rechercher"]').clear().type(dossierRef);
    cy.contains('a', updatedTitre).should('exist');

    // 16. Go back to the updated dossier details
    cy.contains('a', updatedTitre).click();
    cy.url().should('include', '/home/dossier-detail');

    // 17. Add an event
    cy.contains('button', 'Événements').click();
    cy.contains('button', 'Ajouter un Nouvel Événement').click();
    cy.get('input[formControlName="titre"]').type('Audience de test');
    cy.get('select[formControlName="typeId"]').select(1);
    cy.get('input[formControlName="startDate"]').type('2026-08-01');
    cy.contains('button', 'Sélectionner ou gérer les intervenants').click();
    cy.get('app-user-selection-dialog li').first().click();
    cy.get('app-user-selection-dialog').contains('button', 'Confirmer').click();
    cy.get('button[type="submit"]').click();
    cy.contains('Audience de test').should('exist');

    // 18. Add a task
    cy.contains('button', 'Tâches').click();
    cy.contains('button', 'Nouvelle Tâche').click();
    cy.get('input[formControlName="titre"]').type('Tâche de préparation');
    cy.get('textarea[formControlName="description"]').type("Préparer le dossier pour l'audience");
    cy.get('select[formControlName="categoryId"]').select(1);
    cy.get('select[formControlName="statusId"]').select(1);
    cy.get('select[formControlName="priorite"]').select(1);
    cy.get('input[formControlName="dateEcheance"]').type('2026-07-20');
    cy.get('button[type="submit"]').click();
    cy.contains('Tâche de préparation').should('exist');

    // 19. Add a note
    cy.contains('button', 'Notes').click();
    cy.contains('button', 'Nouvelle Note').click();
    cy.get('input[formControlName="titre"]').type('Note stratégique');
    cy.get('textarea[formControlName="description"]').type('Ne pas oublier de vérifier les pièces 4 et 5.');
    cy.get('select[formControlName="categoryId"]').select(1);
    cy.contains('button', 'Enregistrer la Note').click();
    cy.contains('Note stratégique').should('exist');

    // 20. Add a contact
    cy.contains('button', 'Contacts').click();
    cy.contains('button', 'Lier un Contact').click();
    cy.get('input[formControlName="nom"]').type('Expert');
    cy.get('input[formControlName="prenom"]').type('Jean');
    cy.get('input[formControlName="email"]').type('expert@test.com');
    cy.get('select[formControlName="civilite"]').select(1);
    cy.get('select[formControlName="notes"]').select(1); 
    cy.get('button[type="submit"]').click();
    cy.contains('Expert').should('exist');

    // 21. Verify Journal
    cy.contains('button', 'Journal').click();
    cy.get('app-matter-activity').should('exist');
  });
});
