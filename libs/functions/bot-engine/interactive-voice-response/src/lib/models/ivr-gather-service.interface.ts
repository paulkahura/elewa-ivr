import TwiML from "twilio/lib/twiml/TwiML";

/**
 * Base interface for gathering input from the user in ivr and playing the provided audio
 */
export interface IvrGatherService {
  /**
   * Gathers DTMF input from the user after playing an audio file.
   * 
   * @param {string} audioUrl - The URL of the audio file to play before gathering input.
   * @param {number} numDigits - The number of digits to gather from the user input.
   * @param {string} actionUrl - The URL to send the gathered input to.
   * @returns {TwiML} - The generated TwiML response with the gather command and play action.
   */
  gatherWithPlay(audioUrl: string, numDigits: number, actionUrl: string): TwiML;
}