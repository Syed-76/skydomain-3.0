# 🤖 AI Features Guide

## Overview

The Sky AI system provides intelligent chat, moderation, and analysis features powered by leading AI providers. This guide explains how to set up and use AI features.

## Quick Start

### 1. Get an API Key

Choose one of the supported AI providers:

#### **OpenAI (ChatGPT)** - Recommended for most users
- 🌐 Website: https://platform.openai.com/api-keys
- 💰 Pricing: Pay-as-you-go ($0.0005 - $0.03 per 1K tokens)
- ⚡ Speed: Fast
- 🎯 Best for: General chat, most accurate
- Models: `gpt-4`, `gpt-3.5-turbo`

```bash
# Steps:
1. Sign up at https://platform.openai.com
2. Add payment method
3. Go to API keys section
4. Create new secret key
5. Copy and save (you won't see it again!)
```

#### **Anthropic Claude** - Best for safety & reasoning
- 🌐 Website: https://console.anthropic.com/
- 💰 Pricing: Similar to OpenAI
- ⚡ Speed: Medium
- 🎯 Best for: Creative writing, analysis
- Models: `claude-3-opus-20240229`, `claude-3-sonnet-20240229`

```bash
# Steps:
1. Sign up at https://console.anthropic.com
2. Add payment method
3. Go to API keys
4. Create new key
```

#### **Google Gemini** - Good free tier
- 🌐 Website: https://makersuite.google.com/app/apikey
- 💰 Pricing: Free tier available (60 requests/min)
- ⚡ Speed: Medium
- 🎯 Best for: Testing, low-volume usage
- Models: `gemini-pro`

```bash
# Steps:
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy and save
```

#### **Google AI Studio** - NEW & IMPROVED Gemini
- 🌐 Website: https://aistudio.google.com/app/apikey
- 💰 Pricing: Free tier available (1000 requests/day)
- ⚡ Speed: Fast
- 🎯 Best for: Modern Gemini models, better than legacy
- Models: `gemini-1.5-pro`, `gemini-1.5-flash`
- 🆕 **Recommended over legacy Gemini**

```bash
# Steps:
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google (same as other Google services)
3. Click "Create API Key"
4. Copy and save
```

#### **Groq** - FASTEST Inference (⚡⚡⚡)
- 🌐 Website: https://console.groq.com/keys
- 💰 Pricing: Free tier with rate limits
- ⚡ Speed: **100+ tokens/second** (BLAZING FAST!)
- 🎯 Best for: Real-time chat, low latency
- Models: `mixtral-8x7b-32768`, `llama2-70b-4096`

```bash
# Steps:
1. Go to https://console.groq.com/keys
2. Sign up (free)
3. Go to API Keys section
4. Create new key
5. Copy and save
```

**Why Groq?** Fastest inference engine on the market. Perfect for Discord bots that need instant responses!

#### **HuggingFace** - Open Source Models (🤗)
- 🌐 Website: https://huggingface.co/settings/tokens
- 💰 Pricing: Free tier available (PRO available)
- ⚡ Speed: Medium
- 🎯 Best for: Open-source models, customization
- Models: 1000s available (Mistral, Llama, etc.)

```bash
# Steps:
1. Go to https://huggingface.co/settings/tokens
2. Sign up or log in
3. Click "New token"
4. Create with "read" access
5. Copy and save
```

**Why HuggingFace?** Access to thousands of community-created models. Can use Mistral, Llama, Falcon, etc.

#### **Tavily** - Web Search + AI (🔍)
- 🌐 Website: https://app.tavily.com/home
- 💰 Pricing: Free tier (1000 searches/month)
- ⚡ Speed: Medium
- 🎯 Best for: Web search integration, research
- Models: `tavily-search`, `tavily-qna`

```bash
# Steps:
1. Go to https://app.tavily.com/home
2. Sign up (free with Google)
3. Go to API keys
4. Copy your API key
5. Save it
```

**Why Tavily?** Augment AI responses with real-time web search. Your bot can access current information!

## Quick Comparison

| Provider | Best For | Speed | Cost | Free Tier | Setup |
|----------|----------|-------|------|-----------|-------|
| **OpenAI** | Best overall, most accurate | ⚡⚡⚡ | $$ | Limited | Easy |
| **Claude** | Reasoning, creativity | ⚡⚡ | $$ | Limited | Easy |
| **Google AI Studio** | Modern, free tier | ⚡⚡⚡ | Free | 1000/day | Easy |
| **Groq** | ⚡⚡⚡ **FASTEST** | ⚡⚡⚡⚡⚡ | Free | Yes | Easy |
| **HuggingFace** | Open-source models | ⚡⚡ | Free | Yes | Medium |
| **Tavily** | Web search integration | ⚡⚡ | Free | Yes (1000/mo) | Easy |

**Recommendation for Discord Bot:**
- 🏆 **Best Overall**: OpenAI (gpt-3.5-turbo)
- ⚡ **Fastest Response**: Groq (mixtral-8x7b)
- 💰 **Cheapest/Free**: Google AI Studio or Groq
- 🔍 **With Web Search**: Tavily

### 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# For OpenAI
AI_PROVIDER=openai
AI_API_KEY=sk-YOUR_KEY_HERE
AI_MODEL=gpt-4

# For Claude
AI_PROVIDER=claude
AI_API_KEY=sk-ant-YOUR_KEY_HERE
AI_MODEL=claude-3-opus-20240229

# For Gemini (legacy)
AI_PROVIDER=gemini
AI_API_KEY=AIza-YOUR_KEY_HERE
AI_MODEL=gemini-pro

# For Google AI Studio (RECOMMENDED)
AI_PROVIDER=google-ai
AI_API_KEY=AIza-YOUR_KEY_HERE
AI_MODEL=gemini-1.5-pro

# For Groq (FASTEST - ⚡)
AI_PROVIDER=groq
AI_API_KEY=gsk-YOUR_KEY_HERE
AI_MODEL=mixtral-8x7b-32768

# For HuggingFace
AI_PROVIDER=huggingface
AI_API_KEY=hf-YOUR_KEY_HERE
AI_MODEL=mistral/Mistral-7B-Instruct-v0.1

# For Tavily (Web Search)
AI_PROVIDER=tavily
AI_API_KEY=tvly-YOUR_KEY_HERE
AI_MODEL=tavily-search
```

### 3. Restart Your Bot

```bash
# Stop the bot
# Start it again
npm start
```

The AI service will initialize automatically if credentials are provided.

## Commands

### `/ai chat`

Chat with the AI in your Discord server.

**Usage:**
```
/ai chat message: Hello! How are you?
/ai chat message: Tell me a story personality: creative
```

**Options:**
- `message` (required): Your message to the AI (1-2000 characters)
- `personality` (optional): AI personality style
  - `assistant` (default) - Helpful and professional
  - `creative` - Fun and imaginative
  - `support` - Service-focused
  - `moderation` - Analysis-focused

**Example:**
```
/ai chat message: Generate a funny Discord bot error message personality: creative
```

### `/ai moderate`

Use AI to analyze messages for violations.

**Usage:**
```
/ai moderate message: Some message to check
```

**Returns:**
- ✅ **Flagged**: Yes/No
- 📊 **Severity**: Low, Medium, High
- 📝 **Reason**: Explanation of findings
- 🛡️ **Action**: Recommended moderation action

**Example:**
```
/ai moderate message: This message contains hateful content
```

### `/ai summarize`

Summarize recent channel messages.

**Usage:**
```
/ai summarize count: 20
```

**Options:**
- `count` (optional): Number of messages to summarize (1-50, default: 20)

**Example:**
```
/ai summarize count: 50
# Summarizes the last 50 messages in the channel
```

### `/ai status`

Check if AI service is configured and running.

**Returns:**
- ✅ Status: Online/Offline
- 🔧 Provider: Which AI provider is configured
- 🤖 Model: Which model is in use
- ⚙️ Settings: Temperature, max tokens, etc.
- 🎭 Available personalities

**Example:**
```
/ai status
# Shows current AI configuration and status
```

### `/ai history`

Manage conversation history.

**Usage:**
```
/ai history action: view
/ai history action: clear
```

**Options:**
- `action` (required): 
  - `view` - Show conversation history for this channel
  - `clear` - Clear conversation history

**Example:**
```
/ai history action: clear
# Clears all conversation history in this channel
```

## AI Personalities

Each personality has a different system prompt and behavior:

### 🤝 Assistant (Default)
- **Role**: Helpful Discord bot assistant
- **Style**: Professional, friendly, concise
- **Best for**: General questions, help, information
- **Trait**: Keeps responses under 2000 characters

### 🎨 Creative
- **Role**: Creative and fun Discord bot
- **Style**: Imaginative, entertaining, playful
- **Best for**: Stories, ideas, games, entertainment
- **Trait**: Generates engaging and fun content

### 💼 Support
- **Role**: Server support assistant
- **Style**: Patient, helpful, solution-focused
- **Best for**: Support tickets, FAQs, troubleshooting
- **Trait**: Excellent for customer service

### 🛡️ Moderation
- **Role**: Moderation analysis tool
- **Style**: Objective, analytical, fair
- **Best for**: Message analysis, policy enforcement
- **Trait**: Analyzes for violations and provides reasoning

## Features in Detail

### 1. Chat (`/ai chat`)

Have conversations with the AI. Each channel maintains its own conversation history.

**Features:**
- 💬 Multi-turn conversations
- 📚 Conversation history (last 10 messages)
- 🎭 Multiple personalities
- 📏 Smart message splitting (for long responses)
- ⏱️ Fast responses

**Conversation History:**
- Automatically saves last 10 messages per channel
- Helps AI provide context in responses
- Use `/ai history` to view or clear

**Example Conversation:**
```
User: Tell me a joke about Discord
AI: Why did the Discord server go to therapy?
    Because it had too many channels to process! 😄

User: That was funny! Tell me another one
AI: Why did the bot get promoted to admin?
    Because it was already outstanding in its field! 🎖️
```

### 2. Moderation (`/ai moderate`)

Analyze messages for policy violations using AI judgment.

**Returns JSON with:**
```json
{
  "flagged": false,           // Is the message problematic?
  "severity": "low",          // low | medium | high
  "reason": "No issues found",
  "action": "none"            // none | warn | mute | kick
}
```

**Use Cases:**
- 🛡️ Check new member introductions
- 📝 Analyze reported messages
- 🔍 Bulk message scanning
- ⚠️ Automate moderation decisions

### 3. Summarization (`/ai summarize`)

Automatically summarize channel conversations.

**Features:**
- 📊 Customizable message count (1-50)
- ✂️ Condensed summaries
- 📈 Identifies key points
- ⏰ Works on recent messages

**Use Cases:**
- 📋 Catch up on missed discussions
- 📝 Generate meeting minutes
- 🎯 Extract action items
- 📚 Archive channel summaries

## Configuration Reference

### Environment Variables

```bash
# Required
AI_PROVIDER=openai|claude|gemini
AI_API_KEY=your_api_key
AI_MODEL=specific_model

# Optional (with defaults)
AI_MAX_TOKENS=2000          # Max response length
AI_TEMPERATURE=0.7          # 0=deterministic, 1=creative
```

### Temperature Settings

- **0.0** - Deterministic, factual, consistent
  - Best for: Moderation, factual Q&A
- **0.3-0.5** - Balanced, consistent with creativity
  - Best for: Support, general assistance
- **0.7** - Default, creative but coherent
  - Best for: Chat, creative tasks
- **0.9+** - Very creative, unpredictable
  - Best for: Storytelling, brainstorming

### Max Tokens

- **500** - Brief responses
- **2000** - Default, good for most tasks
- **4000+** - Long, detailed responses (may be slower)

## Pricing & Cost Estimation

### OpenAI
- GPT-4: $0.03 per 1K input, $0.06 per 1K output
- GPT-3.5: $0.0005 per 1K input, $0.0015 per 1K output
- 💡 Example: 100 conversations = ~$0.50-$2 (GPT-3.5)

### Anthropic (Claude)
- Claude 3 Opus: $0.015 per 1K input, $0.075 per 1K output
- Claude 3 Sonnet: $0.003 per 1K input, $0.015 per 1K output
- 💡 Similar pricing to OpenAI

### Google Gemini (Legacy)
- Free tier: 60 requests/minute
- Paid: $0.0005 per input, $0.0015 per output
- 💡 Most affordable option

### Google AI Studio ✨ RECOMMENDED
- Free tier: 1000 requests/day
- Paid: $0.0005 per 1K tokens (input), $0.0015 per 1K tokens (output)
- 💡 Same pricing as legacy Gemini, but with better models!

### Groq ⚡ FASTEST & FREE
- Free tier: Unlimited (with rate limits: ~1000/month recommended)
- Paid: Available for higher volumes
- 💡 **Best for Discord bots** - Fast and free!
- 🏆 No per-request costs, just rate limits

### HuggingFace 🤗
- Free tier: Available (inference API)
- PRO: $9/month for higher limits
- 💡 Access to thousands of free open-source models
- Models cost nothing, just pay for compute

### Tavily 🔍
- Free tier: 1000 searches/month
- Paid: $20/month for unlimited
- 💡 Best for adding web search to your bot
- Great for research and real-time information

## Cost Comparison for 1000 AI Interactions

| Provider | 1000 Chats | Free Tier | Best For |
|----------|-----------|-----------|----------|
| OpenAI GPT-4 | ~$30 | ❌ | High quality, most accurate |
| OpenAI GPT-3.5 | ~$2 | ❌ | Good balance |
| Claude 3 Sonnet | ~$5 | ❌ | Creative tasks |
| Google AI Studio | ~$2 | ✅ (1000/day) | **Free option** |
| Groq | **FREE** | ✅ (unlimited*) | **Best for bots** |
| HuggingFace | **FREE** | ✅ (unlimited) | Open-source preference |
| Tavily | $0.20 per search | ✅ (1000/mo) | With web search |

**Best Budget Option: Groq (FREE + FASTEST!)**
**Best Quality: OpenAI GPT-4**
**Best Free: Google AI Studio or Groq**

## Troubleshooting

### AI Commands Show "AI Service Disabled"
- ❌ Problem: Environment variables not set
- ✅ Solution:
  1. Check your `.env` file has `AI_PROVIDER` and `AI_API_KEY`
  2. Restart the bot: `npm start`
  3. Check logs for initialization message

### API Key Invalid or Expired
- ❌ Problem: Wrong or revoked API key
- ✅ Solution:
  1. Go to provider's dashboard
  2. Generate a new API key
  3. Update `.env` file
  4. Restart bot

### Responses Are Slow
- ❌ Problem: AI provider is slow or overloaded
- ✅ Solution:
  1. Try a faster model (e.g., gpt-3.5 instead of gpt-4)
  2. Reduce `AI_MAX_TOKENS` in `.env`
  3. Check API provider's status page
  4. Try a different provider

### Out of API Quota
- ❌ Problem: Exceeded free tier or ran out of credits
- ✅ Solution:
  1. Check provider's usage dashboard
  2. Add payment method or upgrade plan
  3. Set lower `AI_MAX_TOKENS` to reduce costs
  4. Implement rate limiting on bot commands

## Advanced Usage

### Batch Summarization
```
# Summarize multiple channels
/ai summarize count: 100  # in channel 1
/ai summarize count: 100  # in channel 2
```

### Custom Moderation Rules
```
# Analyze with specific rules (coming soon)
/ai moderate message: content rules: offensive language, spam
```

### Conversation Context
```
# First message sets context
/ai chat message: I'm a developer question about discord.js
# Follow-up uses context
/ai chat message: How do I create slash commands?
# AI remembers you're a discord.js developer
```

## Best Practices

### 1. Cost Management
- Use GPT-3.5 for general chat (cheaper)
- Use GPT-4 for complex analysis
- Set reasonable `AI_MAX_TOKENS`
- Monitor API usage regularly

### 2. Safety
- Use moderation AI for sensitive servers
- Clear history periodically
- Don't store sensitive data in prompts
- Review AI outputs before taking action

### 3. Performance
- Keep conversation history reasonable
- Clear old conversations with `/ai history action: clear`
- Use appropriate model for task complexity
- Implement cooldowns on AI commands

### 4. User Experience
- Provide personality context to users
- Explain AI limitations upfront
- Use `/ai status` to show capabilities
- Set expectations for response quality

## Future AI Features

Planned additions to the AI system:

- 🎵 AI-generated music descriptions
- 📸 Image analysis and moderation
- 🌐 Multi-language support
- 🔄 Custom personality creation
- 📊 Server-wide AI analytics
- 🎓 Custom knowledge bases
- 🤖 Automated role assignments based on AI analysis
- 💾 Persistent conversation storage

## Support & Questions

For issues or questions:
1. Check `/ai status` to verify configuration
2. Check bot logs for error messages
3. Review this guide's troubleshooting section
4. Contact bot owner or check GitHub issues

---

**Last Updated**: 2026-08-14
**AI Service Version**: 1.0
