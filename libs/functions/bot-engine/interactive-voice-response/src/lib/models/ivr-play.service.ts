// import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import TwiML from "twilio/lib/twiml/TwiML";
import { IvrPlayService } from "./ivr-play-service.interface";
import { twiml } from "twilio/lib";
import { HandlerTools } from "@iote/cqrs";

/**
 * Service to handle playing audio via Twilio's VoiceResponse.
 * This service is responsible for generating the appropriate TwiML responses for audio playback in an IVR system.
 */
export class PlayService implements IvrPlayService 
{
  private twiml: twiml.VoiceResponse;
  private tools: HandlerTools;

  /**
   * Initializes a new instance of the PlayService.
   * Creates a new TwiML VoiceResponse object to handle the IVR responses.
   */
  constructor() 
  {
    this.twiml = new twiml.VoiceResponse();
  }

  /**
   * Plays an audio file using the provided URL, or a fallback message if no URL is provided.
   * 
   * @param {string} audioUrl - The URL of the audio file to be played. If null or undefined, a fallback message will be played.
   * @returns {TwiML} - The generated TwiML response that includes the play action or fallback message.
   */
  playAudio(audioUrl: string): TwiML 
  {
    if (audioUrl) 
      {
      this.twiml.play(audioUrl);
    } 
    else 
    {
      // Play a fallback message if the audio URL is not available.
      this.twiml.say('Sorry, no audio available for this course.');
    }

    // Return the generated TwiML response.
    return this.getTwiml();
  }

  /**
   * Retrieves the current TwiML response.
   * 
   * @returns {TwiML} - The generated TwiML object.
   */
  getTwiml(): TwiML 
  {
    this.tools.Logger.log( () => (`[PlayService] The generated twiml is: ${this.twiml.toString()}`));
    return this.twiml;
  }
}
