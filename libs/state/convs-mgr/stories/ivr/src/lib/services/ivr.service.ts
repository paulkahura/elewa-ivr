import { Injectable } from '@angular/core';
import { Repository, DataService } from '@ngfi/angular';
import { DataStore } from '@ngfi/state';
import { of, Observable, forkJoin, throwError, from, EMPTY } from 'rxjs';
import { tap, switchMap, catchError, map } from 'rxjs/operators';
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import { Logger } from '@iote/bricks-angular';
import { IVRStoryBlock, StoryBlock, StoryBlockTypes } from '@app/model/convs-mgr/stories/blocks/main';

import { StoryEditorState } from '@app/state/convs-mgr/story-editor';
import { QuestionMessageBlock } from '@app/model/convs-mgr/stories/blocks/messaging';
import { StoryBlocksStore } from '@app/state/convs-mgr/stories/blocks';
// import { environment } from '@env/environment';
import { AzureStorageConfig } from 'libs/functions/bot-engine/interactive-voice-response/src/lib/models/azure-storage-config.interface';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { ActiveOrgStore } from '@app/private/state/organisation/main';

@Injectable()
export class IvrService {
  protected _activeRepo: Repository<StoryBlock>;
  private speechConfig: sdk.SpeechConfig;
  private containerClient: ContainerClient;
  private orgId = '';

  constructor
    (
      private _blocksStore: StoryBlocksStore,
      private _logger: Logger,
      private _aff: AngularFireFunctions,
      private _activeOrg$: ActiveOrgStore,
    ) {
    // this.speechConfig = sdk.SpeechConfig.fromSubscription(
    //     process.env['AZURE_SPEECH_KEY']!, 
    //     process.env['AZURE_SPEECH_REGION']!
    // );
    /**
     * Creates an instance of AzureAudioUploadService.
     * @param {AzureStorageConfig} config - The configuration object for Azure Storage
     */
    // const config: AzureStorageConfig = {
    //   "connectionString" : process.env['AZURE_BLOB_CONNECTION_STRING']!,
    //   "containerName" : process.env['AZURE_BLOB_CONTAINER_NAME']!
    // };
    // const blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
    // this.containerClient = blobServiceClient.getContainerClient(config.containerName);
    this._activeOrg$.get().pipe(
      switchMap(
        (org) => {
          if (org) {
            this.orgId = org.id!;
            console.log("organisation is ", this.orgId)
            return of(org);
          }
          return EMPTY;
        }
      )
    ).subscribe();
  }

  /**
   * Save a story block, generate audio, and upload it to Azure Blob storage.
   * @param storyBlock - The story block to process (either a textMessage or questionBlock)
   * @returns Observable that emits the saved story block with the audio URL appended
   */
  save(storyBlock: StoryEditorState): any {
    const blockObservables = storyBlock.blocks
      .filter((block: IVRStoryBlock) => block.type !== StoryBlockTypes.EndStoryAnchorBlock) // Filter out EndBlock type
      .map((block: IVRStoryBlock) =>
        this._generateAudioForBlock(block, storyBlock.story.id!).pipe(
          switchMap(audioBlob =>
            this._scheduleAudioUpload(audioBlob, this.orgId, storyBlock.story.id!, block.id!, VoiceGender.Male)
          ),
          switchMap((audioUrl: any) => {
            console.log("the audio url generated is ", audioUrl);
            block.audioUrl = audioUrl;
            console.log(block.audioUrl)
            return this._blocksStore.update(block);
          }),
          tap(() => this._logger.log(() => `Block with audio saved: ${block}`))
        )
      );
    return forkJoin(blockObservables).pipe(
      tap(() => this._logger.log(() => 'All blocks for the story processed.')),
      switchMap(() => of(storyBlock.blocks))
    ).subscribe();
  }

  /**
   * Calls the cloud function 'azureTts' to convert text to speech.
   * @param data - The data containing the text and options.
   * @returns Observable<ArrayBuffer> - The generated audio data.
   */
  private _scheduleTtsCall(data: any): Observable<ArrayBuffer> {
    this._logger.log(() => `Attempting to call azureTts with data: ${JSON.stringify(data)}`);

    return this._aff.httpsCallable('azureTts')(data).pipe(
      map(result => {
        this._logger.log(() => `azureTts call successful. Result: ${JSON.stringify(result)}`);

        // Decode base64 string back into ArrayBuffer
        const binaryString = atob(result.data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBuffer = bytes.buffer;

        return audioBuffer;  // Return the ArrayBuffer
      }),
      catchError(error => {
        this._logger.error(() => `Error calling azureTts: ${error.message}`);
        this._logger.error(() => `Error details: ${JSON.stringify(error)}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generates the audio for the provided block.
   * @param block - The Story block to be converted to audio.
   * @returns  Observable<Blob> - the url of the generated audio.
   */
  private _generateAudioForBlock(block: StoryBlock, storyId: string): Observable<ArrayBuffer> {
    const textToConvert = this._prepareTextForSpeech(block);

    if (!textToConvert) {
      console.log(block)
    }
    console.log("hit with", textToConvert)
    const ttsCall = this._scheduleTtsCall({
      text: textToConvert,
      voiceGender: VoiceGender.Male,
    });
    ttsCall.subscribe(console.log)
    return ttsCall;
  }

  /**
   * Prepares the text to be converted into speech based on the block type.
   * @param block - The story block containing the message or question.
   * @returns {string} The combined text of the message and options, or an empty string if invalid.
   */
  private _prepareTextForSpeech(block: StoryBlock): string {
    // Skip processing if the block type is EndBlock
    if (block.type === StoryBlockTypes.EndStoryAnchorBlock) {
      return ''; // or any other appropriate default value
    }
    switch (block.type) {
      case StoryBlockTypes.TextMessage:
        return block.message || '';

      case StoryBlockTypes.QuestionBlock:
        return this._prepareQuestionBlockText(block);

      default:
        return '';
    }
  }

  /**
   * Prepares the text for a question block by combining the message and options.
   * @param block - The question block containing the message and options.
   * @returns {string} The concatenated message and options as a single string.
   */
  private _prepareQuestionBlockText(block: QuestionMessageBlock): string {
    if (!block.message) return '';

    // Concatenate the question message with its options (if available)
    const optionsText = block.options?.map(opt => opt.message).join(' ') || '';
    return `${block.message} ${optionsText}`.trim();
  }

  /**
 * Calls the cloud function 'azureAudioUpload' to upload audio to Azure Blob Storage.
 * @param audioBlob - The audio data to upload.
 * @param storyId - The ID of the story.
 * @param blockId - The ID of the block.
 * @param voice - The voice used (e.g., 'male').
 * @returns Observable<string> - The URL of the uploaded audio.
 */
  private async _scheduleAudioUpload(audioBlob: ArrayBuffer, orgId: string, storyId: string, blockId: string, voice: VoiceGender): Promise<void> {
    // Convert the ArrayBuffer to Base64
    this._logger.log(() => "Converting ArrayBuffer to Base64...");
    const audioBase64 = this._arrayBufferToBase64(audioBlob);

    this._logger.log(() => `Base64 audio generated: ${audioBase64.slice(0, 100)}...`); // Log a portion for verification

    // Log details about the upload
    this._logger.log(() => `Scheduling audio upload with orgId: ${orgId}, storyId: ${storyId}, blockId: ${blockId}, voice: ${voice}`);

    // Call the cloud function and handle the observable correctly
    const uploadObservable = this._aff.httpsCallable('azureAudioUpload')({
      audioBuffer: audioBase64,  // Pass base64 encoded audio
      orgId,
      storyId,
      blockId,
      voice
    });

    return new Promise<void>((resolve, reject) => {
      uploadObservable.subscribe({
        next: (result: any) => {
          // Log and resolve with the audio URL
          this._logger.log(() => `Audio upload successful. URL: ${JSON.stringify(result)}`);
          const audioUrl = result.data;
          if (audioUrl) {
            resolve(audioUrl);
          } else {
            this._logger.error(() => 'Audio URL is missing from the upload result.');
            reject('Audio URL missing');
          }
        },
        error: (error: any) => {
          // Log the error
          this._logger.error(() => `Error uploading audio: ${error.message}`);
          reject(error);
        }
      });
    });
  }


  /**
 * Converts an ArrayBuffer to a Base64 string.
 * @param buffer - The ArrayBuffer to convert.
 * @returns A base64 string.
 */
  private _arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

enum VoiceGender {
  Male = 'male',
  Female = 'female'
}
