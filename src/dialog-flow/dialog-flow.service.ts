import { Injectable } from '@nestjs/common';
// import { CreateDialogFlowDto } from './dto/create-dialog-flow.dto';
// import { UpdateDialogFlowDto } from './dto/update-dialog-flow.dto';
import * as dialogflow from '@google-cloud/dialogflow';

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

  constructor() {
    this.sessionClient = new dialogflow.SessionsClient({
      projectId: this.projectId,
      credentials: this.credentials,
    });
  }

  async processDialogflowRequest(requestBody: any): Promise<any> {
    // Extract relevant information from the request body
    const userQuery = requestBody.query;

    // Construct a request to Dialogflow
    const sessionPath = this.sessionClient.projectAgentSessionPath(
      this.projectId,
      this.sessionId,
    );
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: userQuery,
          languageCode: 'en-US',
        },
      },
    };

    try {
      // Invoke Dialogflow API to detect the intent
      const [response] = await this.sessionClient.detectIntent(request);

      // Process the Dialogflow response
      const detectedIntent = response.queryResult.intent.displayName;
      const fulfillmentText = response.queryResult.fulfillmentText;

      // Determine application logic based on the detected intent

      // Optionally, send a response back to Dialogflow
      // ...

      // Return the response or relevant information
      return { detectedIntent, fulfillmentText };
      // return { response };
    } catch (error) {
      console.error('Error processing Dialogflow request:', error);
      // Handle errors gracefully
      throw error;
    }
  }

  async processDialogVehicleData() {
    try {
    } catch (err) {
      console.log(err.message);
      throw err;
    }
  }
}
