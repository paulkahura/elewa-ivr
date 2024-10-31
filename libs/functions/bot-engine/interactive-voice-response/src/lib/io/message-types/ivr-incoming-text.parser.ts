import { IncomingTextMessageParser } from "@app/functions/bot-engine";
import { TextMessage } from "@app/model/convs-mgr/conversations/messages";
import { IncomingMessengerMessage, IncomingMessengerTextMessage, MessageTypes } from "@app/model/convs-mgr/functions";

export class IvrIncomingTextParser extends IncomingTextMessageParser {

  constructor() 
  {
    super();
  }

  parse(incomingMessage: any): TextMessage {

    const textMessagePayload = incomingMessage.message;
    // Create the base message object
    const newMessage: TextMessage = {
      id: Date.now().toString(),
      type: MessageTypes.TEXT,
      text: textMessagePayload.text,
      payload: incomingMessage.payload,
    };

    return newMessage;
  }
}