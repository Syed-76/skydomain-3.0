/**
 * AI Service Configuration
 * 
 * Set these environment variables to enable AI features:
 * 
 * AI_PROVIDER=google-ai|groq|huggingface|tavily
 * AI_API_KEY=your_api_key_here
 * AI_MODEL=specific_model_name
 * AI_MAX_TOKENS=2000 (optional)
 * AI_TEMPERATURE=0.7 (optional)
 */

export const AI_CONFIG_TEMPLATE = {
  providers: {
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
