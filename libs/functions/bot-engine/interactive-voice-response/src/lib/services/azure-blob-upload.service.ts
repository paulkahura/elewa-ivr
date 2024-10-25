import { BlobServiceClient, BlockBlobClient, ContainerClient } from "@azure/storage-blob";
import { VoiceGender } from "../models/voice-gender.enum";

/**
 * Service for uploading audio files to Azure Blob Storage
 */
export class AzureAudioUploadService {

  private containerClient: ContainerClient;

  /**
   * Constructor to initialize the AzureAudioUploadService with a ContainerClient.
   * @param {ContainerClient} containerClient - The Azure Blob Storage container client.
   */
  constructor(containerClient: ContainerClient) {
    this.containerClient = containerClient;
  }

  /**
   * Uploads an audio buffer to Azure Blob Storage with a structured path.
   * @param {ArrayBuffer} audioBuffer - The audio data as an ArrayBuffer
   * @param {string} orgId - The ID of the tenant
   * @param {string} storyId - The ID of the story
   * @param {string} blockId - The ID of the block
   * @param {'male' | 'female'} voiceGender - The gender of the voice (used to create folder structure)
   * @returns {Promise<string>} The URL of the uploaded blob
   * @throws {Error} If there's an issue with the upload process
   */
  async uploadAudio(base64Audio: string, orgId?: string, storyId?: string, blockId?: string, voiceGender?: VoiceGender): Promise<string> {
    try {
      console.log("The base64 audio being received is: ", base64Audio);

      // Convert the base64 string to an ArrayBuffer
      const audioBuffer = this._base64ToArrayBuffer(base64Audio);

      console.log("The audio buffer being received is: ", audioBuffer);
      console.log("Type of audioBuffer:", typeof audioBuffer);

      if (!audioBuffer || !(audioBuffer instanceof ArrayBuffer)) {
        throw new Error("Invalid audio buffer provided");
      }

      if (!orgId || !storyId || !blockId) {
        throw new Error("Missing required parameters: orgId, storyId, or blockId");
      }

      const blobName = `orgs/${orgId}/ivr-audio/${storyId}/${voiceGender}_${blockId}.mp3`;
      await this.initializeContainer();
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(audioBuffer, {
        blobHTTPHeaders: { blobContentType: "audio/mpeg" }
      });

      return blockBlobClient.url;
    } catch (error) {
      console.error("Error uploading audio to Azure Blob Storage:", error);
      throw error;
    }
  }

  /**
   * Converts a base64 string back into an ArrayBuffer.
   * @param base64 - The base64 string to convert.
   * @returns {ArrayBuffer} The resulting ArrayBuffer.
   */
  private _base64ToArrayBuffer(base64: string): ArrayBuffer {
    // Remove data URL prefix if it exists
    const base64Data = base64.replace(/^data:.*,/, '');

    // Create a buffer from the base64 string
    const buffer = Buffer.from(base64Data, 'base64');

    // Convert Buffer to ArrayBuffer
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
    }

    return arrayBuffer;
  }

  /**
   * Initializes the container if it doesn't exist.
   * This method should be called before using the service to ensure the container exists.
   */
  private async initializeContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists();
    } catch (error) {
      console.error("Error initializing container:", error);
      throw new Error("Failed to initialize Azure Blob Storage container");
    }
  }

  /**
   * Deletes an audio file from Azure Blob Storage.
   * @param {string} blobName - The name of the blob to delete
   * @returns {Promise<void>}
   * @throws {Error} If there's an issue with the deletion process
   */
  async deleteAudio(blobName: string): Promise<void> {
    try {
      const blockBlobClient: BlockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      console.log(`Blob "${blobName}" deleted successfully.`);
    } catch (error) {
      console.error("Error deleting audio from Azure Blob Storage:", error);
      throw error;  // Return the original error
    }
  }
}
