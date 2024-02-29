import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import {
  AuthenticationResponseJSON,
  AuthenticatorAttachment,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { post } from "@toruslabs/http-helpers";
import log from "loglevel";


const AUTH_SERVER_URL = "http://localhost:3021"

export interface ILoginData {
  authenticationResponse: AuthenticationResponseJSON;
  data: {
    challenge_timestamp: string;
    transports: AuthenticatorTransportFuture[];
    credential_public_key: string;
  };
  username: string;
  rpID: string;
}

export default class PasskeyService {
  readonly authBaseApiUrl = `${AUTH_SERVER_URL}/api/v1`;

  trackingId: string = "";
  web3authClientId: string;
  oAuthVerifier: string;
  oAuthVerifierId: string;

  constructor(params: { web3authClientId: string; oAuthVerifier?: string; oAuthVerifierId?: string; }) {
    this.web3authClientId = params.web3authClientId;
    this.oAuthVerifierId = params.oAuthVerifierId || "";
    this.oAuthVerifier = params.oAuthVerifier || "";
  }

  get username(): string {
    return `Passskey Web3auth Demo - created at ${new Date(Date.now()).toUTCString()}`;
  }

  get rpName(): string {
    if (window.location.hostname === "localhost") return "localhost";
    if (window.location.hostname.includes("web3auth.io")) return "web3auth.io";
    return window.location.hostname;
  }

  get rpID(): string {
    if (window.location.hostname === "localhost") return "localhost";
    if (window.location.hostname.includes("web3auth.io")) return "web3auth.io";
    return window.location.hostname;
  }

  async registerUser(authenticatorAttachment?: AuthenticatorAttachment): Promise<boolean> {
    try {
      const data = await this._getRegistrationOptions(authenticatorAttachment);
      const { options, trackingId } = data;
      this.trackingId = trackingId;
      const verificationResponse = await startRegistration(options);
      return this._verifyRegistration(verificationResponse);
    } catch (error: unknown) {
      log.error("error registering user", error);
      throw error;
    }
  }

  async loginUser(): Promise<ILoginData | null> {
    try {
      const data = await this._getAuthenticationOptions();
      const { options, trackingId } = data;
      this.trackingId = trackingId;
      const verificationResponse = await startAuthentication(options);
      const result = await this._verifyAuthentication(verificationResponse);
      if (result && result.verified && result.data) {
        log.info("authentication response", verificationResponse);
        return { authenticationResponse: verificationResponse, data: result.data, username: this.username, rpID: this.rpID };
      }
      return null;
    } catch (error: unknown) {
      log.error("error registering user", error);
      throw error;
    }
  }

  private async _getRegistrationOptions(authenticatorAttachment?: AuthenticatorAttachment) {
    const response = await post<{ success: boolean; data: { options: PublicKeyCredentialCreationOptionsJSON; trackingId: string } }>(
      `${this.authBaseApiUrl}/passkey/generate-registration-options`,
      {
        web3auth_client_id: this.web3authClientId,
        verifier_id: this.oAuthVerifierId,
        verifier: this.oAuthVerifier,
        authenticator_attachment: authenticatorAttachment,
        rp: {
          name: this.rpName,
          id: this.rpID,
        },
        username: this.username,
      }
    );
    if (response.success) {
      return response.data;
    }
    throw new Error("Error getting registration options");
  }

  private async _verifyRegistration(verificationResponse: RegistrationResponseJSON) {
    if (!this.trackingId) throw new Error("trackingId is required, please restart the process again.");

    const response = await post<{ verified: boolean; error?: string }>(
      `${this.authBaseApiUrl}/passkey/verify-registration`,
      {
        web3auth_client_id: this.web3authClientId,
        tracking_id: this.trackingId,
        verification_data: verificationResponse,
      },
    );
    if (response.verified) {
      return true;
    }
    throw new Error(`Error verifying registration, error: ${response.error}`);
  }

  private async _getAuthenticationOptions() {
    const response = await post<{ success: boolean; data: { options: PublicKeyCredentialCreationOptionsJSON; trackingId: string } }>(
      `${this.authBaseApiUrl}/passkey/generate-authentication-options`,
      {
        web3auth_client_id: this.web3authClientId,
        rpID: this.rpID,
      }
    );
    if (response.success) {
      return response.data;
    }
    throw new Error("Error getting authentication options");
  }

  private async _verifyAuthentication(verificationResponse: AuthenticationResponseJSON) {
    if (!verificationResponse) throw new Error("verificationResponse is required.");

    const response = await post<{
      verified: boolean;
      data?: { challenge_timestamp: string; transports: AuthenticatorTransportFuture[]; credential_public_key: string; rpID: string; };
      error?: string;
    }>(`${this.authBaseApiUrl}/passkey/verify-authentication`, {
      web3auth_client_id: this.web3authClientId,
      tracking_id: this.trackingId,
      verification_data: verificationResponse,
    });
    if (response.verified) {
      return { data: response.data, verified: response.verified };
    }
    throw new Error(`Error verifying authentication, error: ${response.error}`);
  }
}
