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
    'google-ai': {
      name: 'Google AI Studio',
      url: 'https://aistudio.google.com/app/apikey',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-pro-vision'],
      documentation: 'https://ai.google.dev/docs/gemini_api_overview',
      notes: 'Modern Google AI Studio with improved models',
    },
    groq: {
      name: 'Groq',
      url: 'https://console.groq.com/keys',
      models: ['mixtral-8x7b-32768', 'llama2-70b-4096', 'gemma-7b-it'],
      documentation: 'https://console.groq.com/docs/speech-text',
      notes: 'Ultra-fast inference engine, great for real-time chat',
      pricing: 'Free tier available with rate limits',
    },
    huggingface: {
      name: 'HuggingFace',
      url: 'https://huggingface.co/settings/tokens',
      models: ['mistral/Mistral-7B-Instruct-v0.1', 'meta-llama/Llama-2-7b-chat', 'gpt2'],
      documentation: 'https://huggingface.co/docs/hub/security-tokens',
      notes: 'Access to thousands of open-source models',
      pricing: 'Free tier with PRO upgrades available',
    },
    tavily: {
      name: 'Tavily',
      url: 'https://app.tavily.com/home',
      models: ['tavily-search', 'tavily-qna'],
      documentation: 'https://docs.tavily.com/',
      notes: 'AI-powered search and research engine, augments responses with web search',
      pricing: 'Free tier: 1000 searches/month',
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

  'google-ai': `
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (new version with improved models)
5. Set in .env: AI_API_KEY=AIza...
6. Set: AI_PROVIDER=google-ai
7. Set: AI_MODEL=gemini-1.5-pro (or gemini-1.5-flash)
`,

  groq: `
1. Go to https://console.groq.com/keys
2. Sign up or log in
3. Go to API Keys section
4. Create API key
5. Copy the key
6. Set in .env: AI_API_KEY=gsk_...
7. Set: AI_PROVIDER=groq
8. Set: AI_MODEL=mixtral-8x7b-32768 (fastest) or llama2-70b-4096 (most accurate)
⚡ Fastest inference engine! 100+ tokens/second
`,

  huggingface: `
1. Go to https://huggingface.co/settings/tokens
2. Sign up or log in
3. Click "New token"
4. Create with "read" access
5. Copy the token
6. Set in .env: AI_API_KEY=hf_...
7. Set: AI_PROVIDER=huggingface
8. Set: AI_MODEL=mistral/Mistral-7B-Instruct-v0.1 (or any HF model)
🤗 Access to thousands of open-source models
`,

  tavily: `
1. Go to https://app.tavily.com/home
2. Sign up with Google or email
3. Go to API keys
4. Copy your API key
5. Set in .env: AI_API_KEY=tvly-...
6. Set: AI_PROVIDER=tavily
7. Set: AI_MODEL=tavily-search (or tavily-qna)
🔍 Adds real-time web search to AI responses
Free tier: 1000 searches/month
`,
};
