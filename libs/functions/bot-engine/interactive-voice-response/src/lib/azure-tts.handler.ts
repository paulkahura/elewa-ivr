import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { FunctionHandler, RestResult, HttpsContext } from '@ngfi/functions';
import { HandlerTools } from '@iote/cqrs';
import { TextToSpeechService } from "./services/azure-text-to-speech.service";
import { TextToSpeechPayload } from './models/text-to-speech-payload.interface';
import 'dotenv/config';
export class ConvertTextToSpeechHandler extends FunctionHandler<any, RestResult> {
  /**
   * Converts text to speech using Azure's Text-to-Speech service and returns the audio data.
   * 
   * @param payload<TextToSpeechPayload> - The request payload, which should contain `text` and `voiceGender`.
   * @param context - The HTTPS context, which contains information about the request.
   * @param tools - The handler tools for logging and other utilities.
   * 
   * @returns A REST result with the generated audio data or an error message.
   */
  public async execute(payload: TextToSpeechPayload, context: HttpsContext, tools: HandlerTools): Promise<any> {
    tools.Logger.log(() => `Text-to-speech conversion started for : "${JSON.stringify(payload)}"`);
    // Initialize the test to speech service
    const ttsService = new TextToSpeechService();

    // Extract the voice gender and the text from the payload
    const { text, voiceGender } = payload;

    // Validate payload
    if (!text || !voiceGender) {
      return { status: 400, message: "Invalid input. Text and voiceGender are required." } as RestResult;
    }

    // Create SpeechConfig using Azure Speech SDK
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      // process.env['AZURE_SPEECH_KEY']!,  // Azure Speech Service API Key from environment
      // process.env['AZURE_SPEECH_REGION']! // Azure region for the speech service
      "7e5f8eb3b12d4e8c87e13f65e7acfc3f",  // Azure Speech Service API Key from environment
      "eastus" // Azure region for the speech service
    );

    try {
      const audioData = await ttsService.convertTextToSpeech(speechConfig, text, voiceGender);

      // Convert ArrayBuffer to Base64 string
      const base64Audio = Buffer.from(audioData).toString('base64');

      tools.Logger.log(() => `Text-to-speech conversion successful. Audio data encoded as base64.`);

      // Return the Base64 encoded string
      return { status: 200, data: base64Audio } as RestResult;

    } catch (error: any) {
      tools.Logger.error(() => `Text-to-speech conversion failed: ${error.message}`);
      return { status: 500, message: `Failed to convert text to speech: ${error.message}` } as RestResult;
    }
  }
}