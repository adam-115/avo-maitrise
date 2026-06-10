export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/',
  keycloak: {
    enabled: true,
    url: 'http://localhost:7070',
    realm: 'avo-app-test',
    clientId: 'avo-test-client'
  }
};
