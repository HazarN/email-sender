import nodemailer, { SendMailOptions, Transporter } from 'nodemailer';

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { google } from 'googleapis';
import { fileURLToPath } from 'url';

import IOAuth2Credentials from './IOAuth2Credentials';

dotenv.config();

export default class EmailSender {
  private credentials = {} as IOAuth2Credentials;

  private transporter: Transporter;

  private email: string;
  private options: SendMailOptions;

  // Singleton pattern
  private static instance: EmailSender;
  public static getInstance(email: string) {
    if (!this.instance) this.instance = new EmailSender(email);

    return this.instance;
  }
  private constructor(email: string) {
    this.setEmail(email);

    this.credentials.clientId = process.env.CLIENT_ID as string;
    this.credentials.clientSecret = process.env.CLIENT_SECRET as string;
    this.credentials.redirectUri = process.env.REDIRECT_URI as string;
    this.credentials.refreshToken = process.env.REFRESH_TOKEN as string;
    // accessToken will be set after the authorization with the refresh token
  }

  public waitForSeconds = (sec: number) =>
    new Promise((resolve) => setTimeout(resolve, sec * 1000));

  public isValidEmail(): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return regex.test(this.getEmail());
  }

  // IDEA: catch the error
  public setEmail(email: string): void {
    if (!this.isValidEmail) throw new Error('Invalid email given');

    this.email = email;
  }

  public getEmail = (): string => this.email;

  public getCredentials = (): IOAuth2Credentials => this.credentials;

  public getTransporter = (): Transporter => this.transporter;

  public getAccessToken = (): string => this.getCredentials().accessToken;

  // IDEA: catch the error
  public setAccessToken(accessToken: string | null | undefined) {
    if (!accessToken) throw new Error('Access token cannot be set as null or undefined.');

    this.credentials.accessToken = accessToken;
  }

  public setTransporter(transporter: Transporter) {
    this.transporter = transporter;
  }

  // This will be handy when you want to get a new refresh token,
  // run this only if your refreshToken from the .env is expired
  public async getRefreshToken(authCode: string) {
    const { clientId, clientSecret, redirectUri } = this.getCredentials();

    try {
      const res = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        client_secret: clientSecret,
        code: authCode,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      console.log('Access Token:', res.data.access_token);
      console.log('Refresh Token:', res.data.refresh_token);
    } catch (error) {
      console.error('Error getting refresh token:', error.res?.data || error);
    }
  }

  public readDocument(document: string) {
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const documentDir = path.join(dirname, '..', 'docs', document);

    return fs.readFileSync(documentDir).toString('base64');
  }

  public async authorize() {
    const { refreshToken, clientId, clientSecret, redirectUri } = this.getCredentials();

    const oauth2Client = new google.auth.OAuth2({
      clientId,
      clientSecret,
      redirectUri,
    });

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const accessToken = await oauth2Client.getAccessToken();

    this.setAccessToken(accessToken.token);
    return this;
  }

  public initializeNodemailer() {
    const { redirectUri, ...rest } = this.getCredentials();
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.email,
        ...rest,
      },
    });

    this.setTransporter(transporter);

    return this;
  }

  public setMailOptions(options: SendMailOptions) {
    options.from = this.getEmail();

    this.options = options;
    return this;
  }

  public send = async () => await this.getTransporter().sendMail(this.options);
}
