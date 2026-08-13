/**
 * AI Service - Handles all AI-related operations
 * Supports multiple AI providers and personalities
 */

import { logger } from '../../utils/logger.js';

const AI_CONFIG = {
  enabled: false,
  provider: null, // 'openai' | 'claude' | 'gemini' | etc
  apiKey: null,
  model: null,
  maxTokens: 2000,
  temperature: 0.7,
};

const AI_PERSONALITIES = {
  assistant: {
    name: 'Assistant',
    systemPrompt: 'You are a helpful Discord bot assistant. Keep responses concise (under 2000 characters). Be friendly and professional.',
  },
  moderation: {
    name: 'Moderation AI',
    systemPrompt: 'You are a Discord server moderation assistant. Analyze messages and user behavior for violations. Be fair and objective.',
  },
  creative: {
    name: 'Creative Assistant',
    systemPrompt: 'You are a creative and fun Discord bot. Generate engaging content, stories, and ideas. Be imaginative and entertaining.',
  },
  support: {
    name: 'Support Bot',
    systemPrompt: 'You are a helpful support bot for Discord servers. Answer questions clearly and provide solutions.',
  },
};

export class AIService {
  constructor() {
    this.config = { ...AI_CONFIG };
    this.personalities = { ...AI_PERSONALITIES };
    this.conversationHistory = new Map(); // channelId -> [messages]
    this.maxHistoryLength = 10; // Keep last 10 messages per channel
  }

  /**
   * Initialize AI service with provider and API key
   */
  initialize(provider, apiKey, model, options = {}) {
    if (!provider || !apiKey) {
      logger.warn('AI Service initialization failed: Missing provider or API key');
      return false;
    }

    this.config.enabled = true;
    this.config.provider = provider;
    this.config.apiKey = apiKey;
    this.config.model = model;
    
    if (options.maxTokens) this.config.maxTokens = options.maxTokens;
    if (options.temperature !== undefined) this.config.temperature = options.temperature;

    logger.info(`AI Service initialized with provider: ${provider}`);
    return true;
  }

  /**
   * Check if AI is enabled
   */
  isEnabled() {
    return this.config.enabled && this.config.apiKey !== null;
  }

  /**
   * Get available personalities
   */
  getPersonalities() {
    return Object.entries(this.personalities).map(([key, value]) => ({
      id: key,
      name: value.name,
      systemPrompt: value.systemPrompt,
    }));
  }

  /**
   * Generate AI response for a user message
   * @param {string} userMessage - The user's message
   * @param {string} personality - The personality to use (default: 'assistant')
   * @param {string} channelId - Discord channel ID for conversation history
   * @returns {Promise<string>} - AI generated response
   */
  async generateResponse(userMessage, personality = 'assistant', channelId = null) {
    if (!this.isEnabled()) {
      throw new Error('AI Service is not enabled. Please configure API key first.');
    }

    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (userMessage.length > 2000) {
      throw new Error('Message is too long (max 2000 characters)');
    }

    const selectedPersonality = this.personalities[personality] || this.personalities.assistant;

    try {
      // Build conversation context
      const conversationContext = this._buildConversationContext(channelId, userMessage);

      // Call appropriate provider
      const response = await this._callAIProvider(
        conversationContext,
        selectedPersonality.systemPrompt,
        userMessage
      );

      // Store in conversation history
      if (channelId) {
        this._storeConversation(channelId, userMessage, response);
      }

      return response;
    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw error;
    }
  }

  /**
   * Moderate a message using AI
   * @param {string} message - Message to moderate
   * @param {Array<string>} rules - Moderation rules to check against
   * @returns {Promise<Object>} - Moderation result
   */
  async moderateMessage(message, rules = []) {
    if (!this.isEnabled()) {
      throw new Error('AI Service is not enabled');
    }

    const moderationPrompt = `
You are a Discord moderator. Analyze this message for violations.
Rules: ${rules.join(', ') || 'Standard community guidelines'}
Message: "${message}"

Respond with JSON: {
  "flagged": boolean,
  "severity": "low" | "medium" | "high",
  "reason": "explanation",
  "action": "none" | "warn" | "mute" | "kick"
}`;

    try {
      const response = await this._callAIProvider([], moderationPrompt, message);
      return JSON.parse(response);
    } catch (error) {
      logger.error('Error moderating message:', error);
      throw error;
    }
  }

  /**
   * Generate a summary of messages
   * @param {Array<string>} messages - Messages to summarize
   * @returns {Promise<string>} - Summary
   */
  async summarizeMessages(messages) {
    if (!this.isEnabled()) {
      throw new Error('AI Service is not enabled');
    }

    if (messages.length === 0) {
      throw new Error('No messages to summarize');
    }

    const summaryPrompt = `Summarize these Discord messages in 2-3 sentences:\n\n${messages.join('\n')}`;

    try {
      return await this._callAIProvider([], summaryPrompt, '');
    } catch (error) {
      logger.error('Error summarizing messages:', error);
      throw error;
    }
  }

  /**
   * Clear conversation history for a channel
   */
  clearHistory(channelId) {
    this.conversationHistory.delete(channelId);
    logger.info(`Conversation history cleared for channel: ${channelId}`);
  }

  /**
   * Get conversation history
   */
  getHistory(channelId) {
    return this.conversationHistory.get(channelId) || [];
  }

  // Private methods

  _buildConversationContext(channelId, userMessage) {
    if (!channelId) return [];
    
    const history = this.conversationHistory.get(channelId) || [];
    return history.map(h => ({
      role: h.role,
      content: h.content,
    }));
  }

  _storeConversation(channelId, userMessage, aiResponse) {
    if (!this.conversationHistory.has(channelId)) {
      this.conversationHistory.set(channelId, []);
    }

    const history = this.conversationHistory.get(channelId);
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    );

    // Keep only recent messages
    if (history.length > this.maxHistoryLength * 2) {
      history.splice(0, 2);
    }
  }

  async _callAIProvider(context, systemPrompt, userMessage) {
    const { provider } = this.config;

    if (provider === 'openai') {
      return await this._callOpenAI(context, systemPrompt, userMessage);
    } else if (provider === 'claude') {
      return await this._callClaude(context, systemPrompt, userMessage);
    } else if (provider === 'gemini' || provider === 'google-ai') {
      return await this._callGemini(context, systemPrompt, userMessage);
    } else if (provider === 'groq') {
      return await this._callGroq(context, systemPrompt, userMessage);
    } else if (provider === 'huggingface') {
      return await this._callHuggingFace(context, systemPrompt, userMessage);
    } else if (provider === 'tavily') {
      return await this._callTavily(context, systemPrompt, userMessage);
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  async _callOpenAI(context, systemPrompt, userMessage) {
    // Placeholder - will be implemented when user provides OpenAI API key
    const messages = [
      { role: 'system', content: systemPrompt },
      ...context,
      { role: 'user', content: userMessage },
    ];

    logger.debug('OpenAI call with messages:', messages.length);
    // TODO: Implement actual OpenAI API call
    throw new Error('OpenAI integration not yet implemented. Please set up your API key in config.');
  }

  async _callClaude(context, systemPrompt, userMessage) {
    // Placeholder - will be implemented when user provides Claude API key
    logger.debug('Claude call with context:', context.length);
    // TODO: Implement actual Claude API call
    throw new Error('Claude integration not yet implemented. Please set up your API key in config.');
  }

  async _callGemini(context, systemPrompt, userMessage) {
    // Placeholder - will be implemented when user provides Gemini API key
    logger.debug('Gemini call with context:', context.length);
    // TODO: Implement actual Gemini API call
    throw new Error('Gemini integration not yet implemented. Please set up your API key in config.');
  }

  async _callGroq(context, systemPrompt, userMessage) {
    // Groq - Fast inference engine
    // https://console.groq.com/keys
    logger.debug('Groq call with context:', context.length);
    // TODO: Implement actual Groq API call via groq-sdk
    throw new Error('Groq integration not yet implemented. Please set up your API key in config.');
  }

  async _callHuggingFace(context, systemPrompt, userMessage) {
    // HuggingFace - Inference API
    // https://huggingface.co/settings/tokens
    logger.debug('HuggingFace call with context:', context.length);
    // TODO: Implement actual HuggingFace API call
    throw new Error('HuggingFace integration not yet implemented. Please set up your API key in config.');
  }

  async _callTavily(context, systemPrompt, userMessage) {
    // Tavily - AI search and research engine
    // https://app.tavily.com/home
    logger.debug('Tavily call with context:', context.length);
    // TODO: Implement actual Tavily API call for search-augmented responses
    throw new Error('Tavily integration not yet implemented. Please set up your API key in config.');
  }
}

// Export singleton instance
export const aiService = new AIService();

/**
 * Get AI service instance
 */
export function getAIService() {
  return aiService;
}

/**
 * Initialize AI from environment variables or config
 */
export function initializeAIFromConfig(client) {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (provider && apiKey) {
    return aiService.initialize(provider, apiKey, model, {
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    });
  }

  logger.info('AI Service not configured. Set AI_PROVIDER and AI_API_KEY environment variables.');
  return false;
}
