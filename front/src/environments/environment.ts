export const environment = {
  production: true,
  apiUrl: 'https://si-legal2.duckdns.org/api/',
  keycloak: {
    enabled: true,
    url: 'https://si-legal-auth.duckdns.org/',
    realm: 'avo-app-test',
    clientId: 'avo-test-client'
  }
};