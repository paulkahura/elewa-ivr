import { FunctionContext, FunctionHandler } from '@ngfi/functions';
import { HandlerTools } from '@iote/cqrs';
import { ContainerClient } from '@azure/storage-blob';
import { AzureAudioUploadService } from './services/azure-blob-upload.service';
import { AudioData } from './models/audio-data.interface';
import 'dotenv/config';

/**
 * Handler class for uploading audio to Azure Blob Storage.
 * This handler is designed to be executed as part of a serverless function
 * and interacts with Azure Blob Storage using the AzureAudioUploadService.
 */
export class UploadAudioHandler extends FunctionHandler<any, { success: boolean; status: number; message: string }> {
  
  private containerClient: ContainerClient;
  private audioUploadService: AzureAudioUploadService;

  /**
   * Constructor initializes the container client and the upload service.
   */
  constructor() {
    super();
    
    // Initialize the ContainerClient and pass it to the AzureAudioUploadService
    // const azureStorageConnectionString = process.env['AZURE_BLOB_CONNECTION_STRING']!;
    const azureStorageConnectionString = "DefaultEndpointsProtocol=https;AccountName=ivrmedia;AccountKey=VKl2MPvHhv/zvuiMOtvvzCS69vrTl5TRXbdePCl1F8rjGDv4aLKwB5hktWZBbjEwsG+gvFN7TIFP+AStBkOVzw==;EndpointSuffix=core.windows.net";
    // const containerName = process.env['AZURE_BLOB_CONTAINER_NAME']!;
    const containerName = "ivrmedia";
    
    this.containerClient = new ContainerClient(azureStorageConnectionString, containerName);
    this.audioUploadService = new AzureAudioUploadService(this.containerClient);
  }

  /**
   * Executes the handler to upload audio to Azure Blob Storage.
   * @param {AudioData} audioData - The audio data to upload.
   * @param {FunctionContext} context - The function execution context, including authentication and metadata.
   * @param {HandlerTools} tools - Utility tools including logging and repositories for additional actions.
   * @returns {Promise<{ success: boolean; status: number; message: string }>} - A structured response indicating the result of the upload operation.
   */
  public async execute(audioData: AudioData, context: FunctionContext, tools: HandlerTools): Promise<{ success: boolean; status: number; message: string }> {
    tools.Logger.debug(() => `Beginning Execution, Uploading Audio ${JSON.stringify(audioData)}`);

    return await this.uploadAudioToAzure(audioData, tools);
  }

  /**
   * Uploads the audio to Azure Blob Storage using the provided AzureAudioUploadService.
   * @param {AudioData} audioData - The audio data and metadata for upload.
   * @param {HandlerTools} tools - Utility tools including logging and repositories for additional actions.
   * @returns {Promise<{ success: boolean; status: number; message: string }>} - A structured response indicating success or failure.
   */
  private async uploadAudioToAzure(audioData: AudioData, tools: HandlerTools): Promise<{ success: boolean; status: number; message: string, data?: string }> {
    const { audioBuffer, orgId, storyId, blockId, voiceGender } = audioData;
    
    try {
      tools.Logger.debug(() => `Uploading audio file for storyId: ${storyId}, blockId: ${blockId}, voice: ${voiceGender}`);

      // Use the initialized AzureAudioUploadService to upload the audio
      const audioUrl = await this.audioUploadService.uploadAudio(audioBuffer, orgId, storyId, blockId, voiceGender);

      tools.Logger.log(() => `Audio file uploaded successfully: ${audioUrl}`);

      return {
        success: true,
        status: 200,
        message: `Media uploaded successfully: ${audioUrl}`,
        data: audioUrl
      };
    } catch (error) {
      tools.Logger.error(() => `Failed to upload audio file: ${error}`);
      
      return {
        success: false,
        status: 500,
        message: `Could not upload audio file: ${error.message || error}`
      };
    }
  }
}
