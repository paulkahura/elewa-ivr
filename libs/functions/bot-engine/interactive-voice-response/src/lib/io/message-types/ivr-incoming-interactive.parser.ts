import { IncomingInteractiveMessageParser } from "@app/functions/bot-engine";
import { QuestionMessage, QuestionMessageOptions } from "@app/model/convs-mgr/conversations/messages";
import { IncomingMessengerMessage, IncomingMessengerPostBackMessage, MessageTypes } from "@app/model/convs-mgr/functions";

export class IvrIncomingInteractiveParser extends IncomingInteractiveMessageParser
{

  constructor() 
  {
    super();
  }

  parse(incomingMessage: any): QuestionMessage {
    const { message: postbackPayload, payload: { options: optionsList } } = incomingMessage;
    console.log("The incoming message is:", incomingMessage);

    // Determine if `postbackPayload` is an integer to use as an index
    const isValidIndex = Number.isInteger(incomingMessage.digits) &&
                        incomingMessage.digits >= 0 &&
                        incomingMessage.digits < optionsList.length;

    // Select option based on index if valid, otherwise default to the first option
    const selectedOption: QuestionMessageOptions = isValidIndex
      ? {
          optionId: optionsList[incomingMessage.digits].id,
          optionText: optionsList[incomingMessage.digits].message,
          optionValue: optionsList[incomingMessage.digits].message
        }
      : {
          optionId: optionsList[0].id,
          optionText: optionsList[0].message,
          optionValue: optionsList[0].message
        };

    return {
      id: Date.now().toString(),
      type: MessageTypes.QUESTION,
      options: [selectedOption]
    };
  }
}