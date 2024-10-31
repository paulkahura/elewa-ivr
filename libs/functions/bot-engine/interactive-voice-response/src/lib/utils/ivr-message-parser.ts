import { MessageTypes } from "@app/model/convs-mgr/functions";
import { IVROutgoingMessage } from "../models/ivr-incoming-message.interface";
import { IvrIncomingTextParser } from "../io/message-types/ivr-incoming-text.parser";
import { IvrIncomingInteractiveParser } from "../io/message-types/ivr-incoming-interactive.parser";

/**
 * Parses the outgoing payload to ensure it matches the IVR message structure.
* @param {any} payload - The incoming payload to parse.
* @returns {IVROutgoingMessage} Parsed IVR outgoing message.
*/
export function IVROutogingMessageParser(payload: any): IVROutgoingMessage {
    return {
      ...payload,
      voiceGender: payload.voiceGender || 'female',
      ivrOptions: payload.ivrOptions || [],
      phoneNumber: payload.endUserPhoneNumber // Ensure this field exists in your payload
    };
};
//@type {standarxized message object }

export class IvrMessageParser
{
  resolve(messageType:  MessageTypes)
  {
    switch(messageType) {
      case MessageTypes.TEXT:
        return new IvrIncomingTextParser();
      case MessageTypes.QUESTION:
        return new IvrIncomingInteractiveParser();
      default:
        return null;
    }
  }
}