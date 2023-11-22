// custom.d.ts

import 'express-session';

interface CustomSessionData {
  userId?: string;
  // Add other custom properties if needed
}

interface CustomSession extends Express.Session {
  data: CustomSessionData;
}

declare module 'express-session' {
  interface SessionData {
    [key: string]: any;
  }

  interface Session {
    data: CustomSessionData;
  }
}
