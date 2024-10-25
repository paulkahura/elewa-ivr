import { twiml } from "twilio/lib";
import TwiML from "twilio/lib/twiml/TwiML";

import { IvrGatherService } from "./ivr-gather-service.interface";

/**
 * The GatherService is responsible for gathering user input (DTMF tones) 
 * during a Twilio call, and optionally playing audio during the gather.
 */
export class GatherService implements IvrGatherService {
  private twiml: twiml.VoiceResponse;
  
  /**
   * The action URL where Twilio sends gathered digits after the user input.
   * @type {string}
   */
  protected actionUrl: string = 'https://europe-west1-elewa-clm-test.cloudfunctions.net/twilioIncomingCall';

  /**
   * Constructor for GatherService.
   * Initializes a new instance of Twilio's VoiceResponse to build TwiML.
   */
  constructor() {
    this.twiml = new twiml.VoiceResponse();
  }

  /**
   * Gathers digits from the user while playing an audio file or a fallback message.
   * 
   * @param {string} audioUrl - The URL of the audio file to play.
   * @param {number} numDigits - The number of digits to gather from the user.
   * @returns {TwiML} - The generated TwiML response that includes the gather and play logic.
   * 
   * @example
   * const gatherService = new GatherService();
   * const response = gatherService.gatherWithPlay('https://example.com/audio.mp3', 4);
   */
  gatherWithPlay(audioUrl: string, numDigits?: number): TwiML {
    const gather = this.twiml.gather({
      numDigits: numDigits,
      action: this.actionUrl,
      method: 'POST',
      timeout: 10,
    });

    if (audioUrl) 
    {
      gather.play(audioUrl);
    } 
    else 
    {
      gather.say('Sorry, no audio available for this option.');
    }

    return this.getTwiml();
  }

  /**
   * Returns the accumulated TwiML response built so far.
   * 
   * @returns {TwiML} - The current TwiML response.
   */
  getTwiml(): TwiML {
    return this.twiml;
  }
}
