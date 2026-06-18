describe('CRM Client Lifecycle', () => {
  const uniqueId = Date.now();
  const clientNom = `ClientNom_${uniqueId}`;
  const clientPrenom = `ClientPrenom_${uniqueId}`;
  const clientEmail = `client_${uniqueId}@example.com`;
  const updatedEmail = `client_updated_${uniqueId}@example.com`;

  it('should create a new client and update it successfully', () => {
    // 1. Visit the page to add a new client
    cy.visit('http://localhost:8080/home/crm/personne/new');

    // 2. Fill out the form
    cy.get('input[formControlName="nom"]').type(clientNom);
    cy.get('input[formControlName="prenom"]').type(clientPrenom);
    cy.get('input[formControlName="nationalite"]').type('Marocaine');
    cy.get('input[formControlName="cin"]').type('AB98765');
    cy.get('input[formControlName="dateNaissance"]').type('1990-01-01');
    cy.get('input[formControlName="email"]').type(clientEmail);
    cy.get('input[formControlName="telephone"]').type('0612345678');
    cy.get('input[formControlName="adresse"]').type('123 Boulevard Test');
    cy.get('input[formControlName="pays"]').type('Maroc');
    
    // Select first available sector option (index 1 since 0 is 'Sélectionner')
    cy.get('select[formControlName="secteurActivite"]').select(1);

    // 3. Submit the form to create the client
    cy.get('button[type="submit"]').click();

    // 4. Verify we navigate to the details page and see the client name
    cy.url().should('include', '/home/client-details');
    cy.contains(`${clientNom} ${clientPrenom}`).should('exist');

    // 5. Navigate to the client list to verify they are present and modify them
    cy.visit('http://localhost:8080/home/crm');

    // 6. Search for the created client
    cy.get('input[placeholder*="Rechercher"]').clear().type(clientNom);

    // 7. Click on 'Modifier' button on the client card
    cy.contains('h3', `${clientNom} ${clientPrenom}`)
      .parents('.group')
      .contains('button', 'Modifier')
      .click();

    // Wait for the client data to be loaded into the form
    cy.get('input[formControlName="email"]').should('have.value', clientEmail);

    // 8. Update the email information
    cy.get('input[formControlName="email"]').clear().type(updatedEmail);

    // 9. Submit the update form
    cy.get('button[type="submit"]').click();

    // 10. Confirm the modal (SweetAlert2 dialog)
    cy.get('.swal2-confirm').click();

    // 11. Verify update was successful and redirected to details page
    cy.url().should('include', '/home/client-details');
    cy.contains(updatedEmail).should('exist');
  });
});
