describe('Dossier Lifecycle', () => {
  const uniqueId = Date.now();
  const dossierRef = `REF_${uniqueId}`;
  const dossierTitre = `DossierTitre_${uniqueId}`;
  const updatedTitre = `DossierTitre_Updated_${uniqueId}`;

  it('should create and update a dossier successfully', () => {
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
  });
});
