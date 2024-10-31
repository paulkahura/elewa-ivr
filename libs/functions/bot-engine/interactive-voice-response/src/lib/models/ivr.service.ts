import TwiML from "twilio/lib/twiml/TwiML";
import { GatherService } from "./ivr-gather.service";
import { PlayService } from "./ivr-play.service";

/**
 * Service to handle IVR actions such as playing audio and gathering input.
 * This service utilizes PlayService for audio playback and GatherService for handling input.
 */
export class IvrService 
{
  private playService: PlayService;
  private gatherService: GatherService;

  /**
   * Creates an instance of IvrService.
   * @param {PlayService} playService - Service responsible for audio playback.
   * @param {GatherService} gatherService - Service responsible for gathering user input.
   */
  constructor(playService: PlayService, gatherService: GatherService) 
  {
    this.playService = playService;
    this.gatherService = gatherService;
  }

  /**
   * Plays the provided audio URL.
   * @param {string} audioUrl - The URL of the audio file to be played.
   * @returns {TwiML} The generated TwiML response for playback.
   */
  playAudio(audioUrl: string): TwiML 
  {
    return this.playService.playAudio(audioUrl);
  }

  /**
   * Plays the provided audio URL and then gathers input from the user.
   * @param {string} audioUrl - The URL of the audio file to be played.
   * @param {number} numDigits - The number of digits expected from the user input.
   * @returns {TwiML} The generated TwiML response for playback and gathering input.
   */
  gatherWithPlay(audioUrl: string, numDigits: number): TwiML 
  {
    return this.gatherService.gatherWithPlay(audioUrl);
  }
}
