import axios from 'axios';
import * as FormData from 'form-data';

export class PinataService {
  private apiKey: string;
  private apiSecret: string;
  private jwt: string;
  private apiUrl = 'https://api.pinata.cloud';

  constructor() {
    this.apiKey = process.env.PINATA_API_KEY || '';
    this.apiSecret = process.env.PINATA_API_SECRET || '';
    this.jwt = process.env.PINATA_JWT || '';

    if (!this.jwt && (!this.apiKey || !this.apiSecret)) {
      throw new Error('Pinata API credentials not found in environment variables. Please provide either PINATA_JWT or both PINATA_API_KEY and PINATA_API_SECRET.');
    }
  }

  private getHeaders() {
    if (this.jwt) {
      return {
        'Authorization': `Bearer ${this.jwt}`
      };
    }
    return {
      'pinata_api_key': this.apiKey,
      'pinata_secret_api_key': this.apiSecret,
    };
  }

  /**
   * Pins a JSON object to IPFS.
   * @param jsonContent The JSON object to pin.
   * @param name A name for the pin.
   * @returns The IPFS hash (CID) of the pinned content.
   */
  async pinJsonToIpfs(jsonContent: object, name?: string): Promise<string> {
    try {
      const data = {
        pinataContent: jsonContent,
        pinataMetadata: {
          name: name || `CType Schema - ${new Date().toISOString()}`,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      };

      const response = await axios.post(`${this.apiUrl}/pinning/pinJSONToIPFS`, data, {
        headers: this.getHeaders(),
      });

      console.log(`[PinataService] JSON pinned successfully. CID: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error: any) {
      console.error('[PinataService] Error pinning JSON to IPFS:', error.response?.data || error.message);
      throw new Error(`Failed to pin JSON to IPFS: ${error.response?.data || error.message}`);
    }
  }

  /**
   * Tests the authentication with Pinata.
   * @returns True if authentication is successful, false otherwise.
   */
  async testAuthentication(): Promise<boolean> {
    try {
      const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        }
      });
      return response.status === 200;
    } catch (error: any) {
      console.error('[PinataService] Pinata authentication failed:', error.response?.data || error.message);
      return false;
    }
  }
} 