import * as sdk from "microsoft-cognitiveservices-speech-sdk";

/**
 * Service for converting text to speech using Azure's Text-to-Speech service.
 */
export class TextToSpeechService {

  /**
   * Converts text to speech using Azure's Text-to-Speech service.
   *
   * @param {sdk.SpeechConfig} speechConfig - The Azure Speech SDK configuration object.
   * @param {string} text - The text message to be converted into speech.
   * @param {'male' | 'female'} voiceGender - The selected voice type ('male' or 'female').
   * @param {string} [rate="1.0"] - The speed at which the text is spoken. A value of "1.0" is the default rate.
   * @returns {Promise<ArrayBuffer>} A Promise that resolves with the generated audio data as an ArrayBuffer.
   * @throws Will throw an error if speech synthesis fails.
   */
  async convertTextToSpeech(
    speechConfig: sdk.SpeechConfig,
    text: string,
    voiceGender: 'male' | 'female',
    rate: string = "0.8"
  ): Promise<ArrayBuffer> {
    // Set the voice name based on the selected gender
    const voiceName = this._getVoiceNameByGender(voiceGender);
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    // Wrap the text in SSML with the specified rate
    const ssmlText = this._generateSSML(text, voiceName, rate);

    try {
      const result = await this._synthesizeText(synthesizer, ssmlText, true);
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        return result.audioData; // Resolve with the synthesized audio data
      } else {
        throw new Error(`Speech synthesis failed: ${sdk.ResultReason[result.reason]}`);
      }
    } finally {
      synthesizer.close(); // Always close the synthesizer after completion
    }
  }

  /**
   * Helper method to get the voice name by gender.
   * @param {'male' | 'female'} voiceGender - The selected voice type ('male' or 'female').
   * @returns {string} The voice name.
   */
  private _getVoiceNameByGender(voiceGender: 'male' | 'female'): string {
    return voiceGender === 'male' ? 'en-US-GuyNeural' : 'en-US-JennyNeural';
  }

  /**
   * Helper method to generate SSML text with custom rate.
   * @param {string} text - The text to convert to speech.
   * @param {string} voiceName - The voice name.
   * @param {string} rate - The rate (speed) of the speech.
   * @returns {string} The SSML string.
   */
  private _generateSSML(text: string, voiceName: string, rate: string): string {
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voiceName}">
          <prosody rate="${rate}">
            ${text}
          </prosody>
        </voice>
      </speak>`;
  }

  /**
   * Helper method to synthesize text into speech.
   * @param {sdk.SpeechSynthesizer} synthesizer - The SpeechSynthesizer instance.
   * @param {string} text - The text to convert to speech.
   * @param {boolean} isSSML - Whether the input is SSML.
   * @returns {Promise<sdk.SpeechSynthesisResult>} The synthesis result.
   */
  private _synthesizeText(
    synthesizer: sdk.SpeechSynthesizer,
    text: string,
    isSSML: boolean = false
  ): Promise<sdk.SpeechSynthesisResult> {
    return new Promise((resolve, reject) => {
      const speakMethod = isSSML ? synthesizer.speakSsmlAsync : synthesizer.speakTextAsync;
      speakMethod.call(
        synthesizer,
        text,
        (result: sdk.SpeechSynthesisResult) => resolve(result),
        (error: string) => reject(new Error(`Error during speech synthesis: ${error}`))
      );
    });
  }
}
