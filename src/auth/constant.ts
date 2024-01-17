import * as dotenv from 'dotenv';
dotenv.config();
export const SECRET = { secret: process.env.JWT_SECRET };
