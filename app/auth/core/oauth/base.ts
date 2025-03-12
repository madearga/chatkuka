import { cookies } from 'next/headers';
import { z } from 'zod';
import { OAuthProvider } from '@/lib/db/schema';

// Base OAuth client class
export class OAuthClient<T> {
  clientId: string;
  clientSecret: string;
  scopes: string[];
  urls: {
    auth: string;
    token: string;
    user: string;
  };
  userInfo: {
    schema: z.ZodType<T>;
    parse: (data: T) => {
      id: string;
      email: string;
      name: string;
    };
  };

  constructor({
    clientId,
    clientSecret,
    scopes,
    urls,
    userInfo,
  }: {
    clientId: string;
    clientSecret: string;
    scopes: string[];
    urls: {
      auth: string;
      token: string;
      user: string;
    };
    userInfo: {
      schema: z.ZodType<T>;
      parse: (data: T) => {
        id: string;
        email: string;
        name: string;
      };
    };
  }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.urls = urls;
    this.userInfo = userInfo;
  }

  // Generate authorization URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${process.env.OAUTH_REDIRECT_URL_BASE}/api/oauth/callback`,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state,
    });

    return `${this.urls.auth}?${params.toString()}`;
  }

  // Exchange code for token
  async getToken(code: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.OAUTH_REDIRECT_URL_BASE}/api/oauth/callback`,
    });

    const response = await fetch(this.urls.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to get token');
    }

    const data = await response.json();
    return data.access_token;
  }

  // Fetch user data
  async fetchUserData(token: string): Promise<T> {
    const response = await fetch(this.urls.user, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    return this.userInfo.schema.parse(data);
  }

  // Fetch user with code and state
  async fetchUser(
    code: string,
    state: string,
    cookieStore: ReturnType<typeof cookies>
  ): Promise<{
    id: string;
    email: string;
    name: string;
  }> {
    // Verify state
    const cookieList = await cookieStore;
    const storedState = cookieList.get('oauth_state')?.value;
    if (storedState !== state) {
      throw new Error('Invalid state');
    }

    // Get token
    const token = await this.getToken(code);

    // Get user data
    const userData = await this.fetchUserData(token);

    // Parse user data
    return this.userInfo.parse(userData);
  }
}

// Get OAuth client based on provider
export async function getOAuthClient(provider: OAuthProvider): Promise<OAuthClient<any>> {
  switch (provider) {
    case 'google':
      // Dynamically import the google module to avoid circular dependency
      const { createGoogleOAuthClient } = await import('./google');
      return createGoogleOAuthClient();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
