describe('CRM Other Clients Lifecycle', () => {
  const uniqueId = Date.now();

  it('should create and update a Société client successfully', () => {
    const societeNom = `Societe_${uniqueId}`;
    const societeRC = `RC_${uniqueId}`;
    const societeEmail = `societe_${uniqueId}@example.com`;
    const updatedEmail = `societe_up_${uniqueId}@example.com`;

    // 1. Visit Société form
    cy.visit('http://localhost:8080/home/crm/societe/new');

    // 2. Fill the form
    cy.get('input[formControlName="nomCommercial"]').type(societeNom);
    cy.get('input[formControlName="numeroRegistreCommerce"]').type(societeRC);
    cy.get('input[formControlName="email"]').type(societeEmail);
    cy.get('input[formControlName="telephone"]').type('0622222222');
    cy.get('input[formControlName="pays"]').type('Maroc');
    cy.get('select[formControlName="secteurActivite"]').select(1);

    // 3. Submit
    cy.get('button[type="submit"]').click();

    // 4. Verify details redirection
    cy.url().should('include', '/home/client-details');
    cy.contains(societeNom).should('exist');

    // 5. Navigate to list and modify
    cy.visit('http://localhost:8080/home/crm');
    cy.get('input[placeholder*="Rechercher"]').clear().type(societeNom);
    cy.contains('h3', societeNom)
      .parents('.group')
      .contains('button', 'Modifier')
      .click();

    // Wait for data to load
    cy.get('input[formControlName="email"]').should('have.value', societeEmail);

    // 6. Update email
    cy.get('input[formControlName="email"]').clear().type(updatedEmail);
    cy.get('button[type="submit"]').click();
    cy.get('.swal2-confirm').click();

    // 7. Verify update
    cy.url().should('include', '/home/client-details');
    cy.contains(updatedEmail).should('exist');
  });

  it('should create and update an Association client successfully', () => {
    const assoNom = `Association_${uniqueId}`;
    const assoRN = `RN_${uniqueId}`;
    const assoEmail = `asso_${uniqueId}@example.com`;
    const updatedEmail = `asso_up_${uniqueId}@example.com`;

    // 1. Visit Association form
    cy.visit('http://localhost:8080/home/crm/association/new');

    // 2. Fill the form
    cy.get('input[formControlName="nom"]').type(assoNom);
    cy.get('input[formControlName="numeroRegistreNational"]').type(assoRN);
    cy.get('input[formControlName="email"]').type(assoEmail);
    cy.get('input[formControlName="telephone"]').type('0633333333');
    cy.get('input[formControlName="pays"]').type('Maroc');
    cy.get('select[formControlName="secteurActivite"]').select(1);

    // 3. Submit
    cy.get('button[type="submit"]').click();

    // 4. Verify details redirection
    cy.url().should('include', '/home/client-details');
    cy.contains(assoNom).should('exist');

    // 5. Navigate to list and modify
    cy.visit('http://localhost:8080/home/crm');
    cy.get('input[placeholder*="Rechercher"]').clear().type(assoNom);
    cy.contains('h3', assoNom)
      .parents('.group')
      .contains('button', 'Modifier')
      .click();

    // Wait for data to load
    cy.get('input[formControlName="email"]').should('have.value', assoEmail);

    // 6. Update email
    cy.get('input[formControlName="email"]').clear().type(updatedEmail);
    cy.get('button[type="submit"]').click();
    cy.get('.swal2-confirm').click();

    // 7. Verify update
    cy.url().should('include', '/home/client-details');
    cy.contains(updatedEmail).should('exist');
  });

  it('should create and update an Institution client successfully', () => {
    const instNom = `Institution_${uniqueId}`;
    const instRN = `RN_Inst_${uniqueId}`;
    const instEmail = `inst_${uniqueId}@example.com`;
    const updatedEmail = `inst_up_${uniqueId}@example.com`;

    // 1. Visit Institution form
    cy.visit('http://localhost:8080/home/crm/institution/new');

    // 2. Fill the form
    cy.get('input[formControlName="nom"]').type(instNom);
    cy.get('input[formControlName="numeroRegistreNational"]').type(instRN);
    cy.get('input[formControlName="email"]').type(instEmail);
    cy.get('input[formControlName="telephone"]').type('0644444444');
    cy.get('input[formControlName="pays"]').type('Maroc');
    cy.get('select[formControlName="secteurActivite"]').select(1);

    // 3. Submit
    cy.get('button[type="submit"]').click();

    // 4. Verify details redirection
    cy.url().should('include', '/home/client-details');
    cy.contains(instNom).should('exist');

    // 5. Navigate to list and modify
    cy.visit('http://localhost:8080/home/crm');
    cy.get('input[placeholder*="Rechercher"]').clear().type(instNom);
    cy.contains('h3', instNom)
      .parents('.group')
      .contains('button', 'Modifier')
      .click();

    // Wait for data to load
    cy.get('input[formControlName="email"]').should('have.value', instEmail);

    // 6. Update email
    cy.get('input[formControlName="email"]').clear().type(updatedEmail);
    cy.get('button[type="submit"]').click();
    cy.get('.swal2-confirm').click();

    // 7. Verify update
    cy.url().should('include', '/home/client-details');
    cy.contains(updatedEmail).should('exist');
  });
});
