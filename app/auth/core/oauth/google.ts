import { z } from 'zod';
import { OAuthClient } from './base';

// Google user info schema
const GoogleUserSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
});

type GoogleUser = z.infer<typeof GoogleUserSchema>;

// Create Google OAuth client
export function createGoogleOAuthClient(): OAuthClient<GoogleUser> {
  return new OAuthClient<GoogleUser>({
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    scopes: ['openid', 'email', 'profile'],
    urls: {
      auth: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
      user: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    userInfo: {
      schema: GoogleUserSchema,
      parse: (data: GoogleUser) => ({
        id: data.sub,
        email: data.email,
        name: data.name || data.given_name || data.email.split('@')[0],
      }),
    },
  });
} 