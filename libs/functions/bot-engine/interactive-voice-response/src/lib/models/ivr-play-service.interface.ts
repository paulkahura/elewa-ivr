import TwiML from "twilio/lib/twiml/TwiML";

/**
 * Base interface for playing an ivr 
 */
export interface IvrPlayService {
  /**
   * Plays an audio file from the provided URL and returns the generated TwiML.
   * 
   * @param {string} audioUrl - The URL of the audio file to play.
   * @returns {TwiML} - The generated TwiML response with the play command.
   */
  playAudio(audioUrl: string): TwiML;
}