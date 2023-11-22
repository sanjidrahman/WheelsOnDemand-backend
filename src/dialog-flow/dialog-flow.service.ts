import { Injectable, Req, Res } from '@nestjs/common';
// import { CreateDialogFlowDto } from './dto/create-dialog-flow.dto';
// import { UpdateDialogFlowDto } from './dto/update-dialog-flow.dto';
import * as dialogflow from '@google-cloud/dialogflow';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class DialogFlowService {
  private readonly sessionClient: dialogflow.SessionsClient;
  projectId = process.env.GOOGLE_PROJECTID;
  sessionId = process.env.SECRET_KEY;
  credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.split(String.raw`\n`).join(
      '\n',
    ),
  };

  constructor(private _jwtservice: JwtService) {
    this.sessionClient = new dialogflow.SessionsClient({
      projectId: this.projectId,
      credentials: this.credentials,
    });
  }

  async processDialogflowRequest(
    @Res() res: Response,
    @Req() req: Request,
    body: any,
  ): Promise<any> {
    try {
      console.log(req.body.userId, 'cookies');
      const intentName = body.queryResult.intent.displayName;
      const params = body.queryResult.parameters;
      // console.log(req.headers);
      if (intentName === 'Default Welcome Intent') {
        res.send({
          fulfillmentMessages: [
            {
              text: {
                text: ['Hi I am WheelOnDemand ChatBot'],
              },
            },
          ],
        });
      } else if (intentName === 'booking_intent') {
        if (params.date.startDate == params.date.endDate) {
          console.log(
            `${params.date.startDate.toISOString().split('T')[0]} - ${
              params.date.endDate
            }`,
          );
          res.send({
            fulfillmentMessages: [
              {
                text: {
                  text: ['Please provide date ranges'],
                },
              },
            ],
          });
        } else {
          const extractStartDate = new Date(params.date.startDate);
          const extractEndDate = new Date(params.date.endDate);
          const responseText = `${
            extractStartDate.toISOString().split('T')[0]
          } - ${extractEndDate.toISOString().split('T')[0]}`;
          console.log(
            `${extractStartDate.toISOString().split('T')[0]} - ${
              extractEndDate.toISOString().split('T')[0]
            }`,
          );
          res.send({
            fulfillmentMessages: [
              {
                text: {
                  text: [responseText],
                },
              },
            ],
          });
        }
        // res.send({
        //     "fulfillmentMessages": [
        //       {
        //         "card": {
        //           "title": "card title",
        //           "subtitle": "card text",
        //           "imageUri": "https://example.com/images/example.png",
        //           "buttons": [
        //             {
        //               "text": "button text",
        //               "postback": "https://example.com/path/for/end-user/to/follow"
        //             }
        //           ]
        //         }
        //       }
        //     ]
        //   })
      } else {
        res.send({
          fulfillmentMessages: [
            {
              text: {
                text: ["Sorry, I don't have andswer for that"],
              },
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error processing Dialogflow request:', error.message);
      throw error;
    }
  }
}
