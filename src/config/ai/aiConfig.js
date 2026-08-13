/**
 * AI Service Configuration
 * 
 * Set these environment variables to enable AI features:
 * 
 * AI_PROVIDER=openai|claude|gemini
 * AI_API_KEY=your_api_key_here
 * AI_MODEL=specific_model_name
 * AI_MAX_TOKENS=2000 (optional)
 * AI_TEMPERATURE=0.7 (optional)
 * 
 * Example configurations:
 * 
 * OpenAI (ChatGPT):
 * - AI_PROVIDER=openai
 * - AI_API_KEY=sk-...
 * - AI_MODEL=gpt-4 or gpt-3.5-turbo
 * - Get key: https://platform.openai.com/api-keys
 * 
 * Anthropic (Claude):
 * - AI_PROVIDER=claude
 * - AI_API_KEY=sk-ant-...
 * - AI_MODEL=claude-3-opus-20240229
 * - Get key: https://console.anthropic.com/
 * 
 * Google (Gemini):
 * - AI_PROVIDER=gemini
 * - AI_API_KEY=AIza...
 * - AI_MODEL=gemini-pro
 * - Get key: https://makersuite.google.com/app/apikey
 */

export const AI_CONFIG_TEMPLATE = {
  providers: {
    openai: {
      name: 'OpenAI',
      url: 'https://platform.openai.com/api-keys',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
      documentation: 'https://platform.openai.com/docs/api-reference',
    },
    claude: {
      name: 'Anthropic (Claude)',
      url: 'https://console.anthropic.com/',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      documentation: 'https://docs.anthropic.com/',
    },
    gemini: {
      name: 'Google (Gemini)',
      url: 'https://makersuite.google.com/app/apikey',
      models: ['gemini-pro', 'gemini-pro-vision'],
      documentation: 'https://ai.google.dev/docs',
    },
  },

  personalities: {
    assistant: {
      description: 'Helpful Discord bot assistant',
      bestFor: 'General chat and questions',
    },
    creative: {
      description: 'Creative and fun bot',
      bestFor: 'Stories, ideas, entertainment',
    },
    support: {
      description: 'Support-focused bot',
      bestFor: 'Server support tickets and FAQs',
    },
    moderation: {
      description: 'Moderation assistant',
      bestFor: 'Message analysis and enforcement',
    },
  },

  features: {
    chat: {
      description: 'AI chat with multiple personalities',
      command: '/ai chat',
      requires: 'AI Service enabled',
    },
    moderation: {
      description: 'AI-powered message moderation',
      command: '/ai moderate',
      requires: 'AI Service enabled',
    },
    summarize: {
      description: 'Summarize channel conversations',
      command: '/ai summarize',
      requires: 'AI Service enabled',
    },
    history: {
      description: 'Manage conversation history',
      command: '/ai history',
      requires: 'AI Service enabled',
    },
  },
};

/**
 * Setup instructions for AI features
 */
export const AI_SETUP_INSTRUCTIONS = {
  openai: `
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key
5. Set in .env: AI_API_KEY=sk-...
6. Set: AI_PROVIDER=openai
7. Set: AI_MODEL=gpt-4 (or gpt-3.5-turbo)
`,

  claude: `
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to API keys section
4. Create new API key
5. Copy the key
6. Set in .env: AI_API_KEY=sk-ant-...
7. Set: AI_PROVIDER=claude
8. Set: AI_MODEL=claude-3-opus-20240229
`,

  gemini: `
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key
5. Set in .env: AI_API_KEY=AIza...
6. Set: AI_PROVIDER=gemini
7. Set: AI_MODEL=gemini-pro
`,
};
