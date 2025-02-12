export default interface IOAuth2Credentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;

  accessToken: string;
  refreshToken: string;
}
