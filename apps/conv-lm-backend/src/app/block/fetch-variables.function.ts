import { RestRegistrar } from "@ngfi/functions";
import { ConvLearnFunction } from "../../conv-learn-func.class";
// import { CheckInactivityHandler } from "@app/private/functions/convs-mgr/conversations/message-templates/scheduler";

import { FetchBlockVariables } from "@app/functions/convs-mgr/variables/block-variables";

const handler = new FetchBlockVariables();

/**
 * @Description : When an end user sends a message to the chatbot from a thirdparty application, this function is triggered, 
 *      handles the message and forwards it to whatsapp
 * 
 * This function listens to the 'messages' collection and forwards the message if the direction is '"toEndUser"'
 * 
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
 * 
 */
export const moveChat = new ConvLearnFunction('fetch-block-variables', 
                                                  new RestRegistrar(),  
                                                  [], 
                                                  handler)
                               .build();