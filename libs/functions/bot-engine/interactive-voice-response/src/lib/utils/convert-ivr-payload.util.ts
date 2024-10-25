import { MessageTypes } from "@app/model/convs-mgr/functions";

/** Converts the incoming IVR Twilio payload to a readable POJO */
export function __ConvertIvrApiPayload(message: any): any {
    // Format the message payload if needed
    message = _FormatIvrPayLoad(message);

    // Check for required fields similar to the WhatsApp checks
    if (!message || !message.To || !message.From) {
        return null;
    }

    // Determine the message type based on whether digits were received or not
    const messageType = message.digits
        ? MessageTypes.QUESTION // DTMF digits indicate an interactive message
        : MessageTypes.TEXT; // Otherwise, it's a standard text message

    return {
        platformId: message.To, // The platformId corresponds to the 'To' number in IVR
        endUserName: null, // IVR typically doesn't provide an explicit username
        endUserNumber: message.From, // The 'From' number is the end user's phone number
        type: messageType, // Derived message type (text or interactive)
        channel: null, 
        payload: null, // Return the raw payload for debugging or processing
        message: {}
    };
}

/** Function which converts the incoming Twilio IVR request to a readable POJO */
function _FormatIvrPayLoad(message: any): any {
    return message;
}