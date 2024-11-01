import { twiml } from "twilio/lib";
import { Twilio, validateRequest } from "twilio/lib";

import { HandlerTools } from '@iote/cqrs';
import { FunctionContext, FunctionHandler, HttpsContext, RestResult } from '@ngfi/functions';
import { ActiveChannel, BlockDataService, ChannelDataService, ConnectionsDataService, CursorDataService, EngineBotManager, generateEndUserId, IParseInMessage, MessagesDataService, StoriesDataService } from '@app/functions/bot-engine';


import { TwilioIVRRequest } from './models/twilio-ivr-request.interface';
import { __ConvertIvrApiPayload } from "./utils/convert-ivr-payload.util";
import { IVRActiveChannel } from "./models/ivr-active-channel.class";
import { EndUser } from "@app/model/convs-mgr/conversations/chats";
import { Cursor, PlatformType } from "@app/model/convs-mgr/conversations/admin/system";
import { Message, MessageDirection } from "@app/model/convs-mgr/conversations/messages";
import { MessageTypes } from "@app/model/convs-mgr/functions";
import { PlayService } from "./models/ivr-play.service";
import { IVRStoryBlock } from "@app/model/convs-mgr/stories/blocks/main";
import { BotEnginePlay } from "libs/functions/bot-engine/main/src/lib/services/bot-engine-play.service";
import { ProcessMessageService } from "libs/functions/bot-engine/main/src/lib/services/process-message/process-message.service";
import { BotMediaProcessService } from "libs/functions/bot-engine/main/src/lib/services/media/process-media-service";
import { IvrMessageParser } from "./utils/ivr-message-parser";
import { MessageType } from "microsoft-cognitiveservices-speech-sdk/distrib/lib/src/common/ConnectionMessage";


export class TwilioIncomingCallHandler extends FunctionHandler<any, any> {

  public async execute(data: TwilioIVRRequest | null , context: HttpsContext, tools: HandlerTools): Promise<any> {
    // Todo: Validate the incoming request is from Twilio
    tools.Logger.debug(() => `Twilio handler hit with dat ${JSON.stringify(context.eventContext.request.query)}`);
    let payload;
    // if (!this.validateRequest(data, context)) {
    //   return {
    //     status: 400,
    //     message: 'Invalid Twilio signature'
    //   };
    // }

    if(Object.keys(context.eventContext.request.query).length > 0) {
      payload = context.eventContext.request.query;
    } else {
      payload = data;
    }
    return await this.handleCall(data, payload, tools, context);
  }

  private validateRequest(data: any, context: any): boolean {
    const twilioSignature = context.eventContext.request.headers['x-twilio-signature'];
    const url = context.url;

    return validateRequest(
      '1ed46f8ab05875419fe28ac3b09cbfa1',
      twilioSignature,
      url,
      data
    );
  }

  async handleCall(req: any, payload: any, tools: HandlerTools, context: any): Promise<any> {
    const sanitizedResponse = __ConvertIvrApiPayload(payload);
    const dtmfDigits = context.eventContext.request.query.digits;

    if (!sanitizedResponse || !sanitizedResponse.type) return { status: 500, message: `Unexpected Payload :: ${JSON.stringify(payload)}` } as RestResult;
    const _channelService$ = new ChannelDataService(tools, sanitizedResponse);

    const communicationChannel = await _channelService$.getChannelInfo(sanitizedResponse.platformId);
    if (!communicationChannel) {
      tools.Logger.error(() => `[ChannelInfo].getChannelInfo - This phone number has not been registered to a channel :: ${sanitizedResponse.platformId}`);

      return { status: 500 } as RestResult;
    }

    tools.Logger.log(() => `[ChannelInfo].getChannelInfo - Channel Information acquired successfully: ${JSON.stringify(communicationChannel)}`);

    const ivrActiveChannel = new IVRActiveChannel(tools, communicationChannel);

    // STEP 5: Create the bot engine and process the message.
    //        Since we receive different types of messages e.g. text message, location,
    const engine = new EngineBotManager(tools, tools.Logger, ivrActiveChannel);
    const storyService = new StoriesDataService(tools, communicationChannel.orgId);
    const connectionDataService = new ConnectionsDataService(communicationChannel, tools);
    const blockService = new BlockDataService(communicationChannel, connectionDataService, tools);
    const cursorService = new CursorDataService(tools);
    const processMediaService = new BotMediaProcessService(tools);
    const messageService = new MessagesDataService(tools);
    const processMessageService = new ProcessMessageService(cursorService, connectionDataService, blockService, tools, ivrActiveChannel, processMediaService);


    // const bot = new BotEnginePlay(processMessageService, cursorService, messageService,processMediaService, ivrActiveChannel, tools);
    
    const story = await storyService.getStory(communicationChannel.defaultStory);

    const ivrEndUser: EndUser = {
      id: generateEndUserId(sanitizedResponse.endUserNumber, PlatformType.IVR, communicationChannel.n),
      phoneNumber: sanitizedResponse.endUserNumber,
    }
    let block: IVRStoryBlock;
    let ivrMessageParser: IParseInMessage;

    if(!dtmfDigits)
    {
      block = await blockService.getFirstBlock(communicationChannel.orgId, story.id) as IVRStoryBlock;
      ivrMessageParser = new IvrMessageParser().resolve(MessageTypes.TEXT);
      if (!ivrMessageParser) return { status: 500, message: `Incoming message format unknown: ${block.message}` } as RestResult;

      sanitizedResponse.message.text = block.message;
      sanitizedResponse.payload = block;
      sanitizedResponse.type = ivrMessageParser;
      
  
    }
    else 
    {
      const cursor = await cursorService.getLatestCursor(ivrEndUser.id, communicationChannel.orgId) as Cursor;
      // const blockMessage = await bot.__getNextBlock(ivrEndUser, cursor);
      block = await blockService.getBlockById(cursor.position.blockId, communicationChannel.orgId, cursor.position.storyId);
      ivrMessageParser = new IvrMessageParser().resolve(MessageTypes.QUESTION);
      if (!ivrMessageParser) return { status: 500, message: `Incoming message format unknown: ${block.message}` } as RestResult;

      sanitizedResponse.message.text = block.message;
      sanitizedResponse.payload = block;
      sanitizedResponse.type = ivrMessageParser;
      sanitizedResponse.digits = dtmfDigits;


    }
    const message = ivrMessageParser.parse(sanitizedResponse);


    console.log("The parsed message is", JSON.stringify(message));
    const result = await engine.run(message, ivrEndUser);
    // const result = await engine.run({"type": sanitizedResponse.type}, ivrEndUser);
  
    // console.log("===================>: ", result.data.toString());

    // return (result.data && result.data?.success) ?  result.data.toString() : this.systemErrorTwiml();
    return result.data ?  result.data.toString() : this.systemErrorTwiml() ;
  }
  private systemErrorTwiml()
  {
    return new twiml.VoiceResponse().say("Leaving Goomza, 420 Error").toString();
  }
}