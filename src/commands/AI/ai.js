import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { getAIService } from '../../services/aiService.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('🤖 AI Chat and Features')
    .addSubcommand((sub) =>
      sub
        .setName('chat')
        .setDescription('Chat with AI')
        .addStringOption((opt) =>
          opt
            .setName('message')
            .setDescription('Your message for AI')
            .setRequired(true)
            .setMaxLength(2000),
        )
        .addStringOption((opt) =>
          opt
            .setName('personality')
            .setDescription('AI personality type')
            .setRequired(false)
            .addChoices(
              { name: 'Assistant', value: 'assistant' },
              { name: 'Creative', value: 'creative' },
              { name: 'Support', value: 'support' },
              { name: 'Moderation', value: 'moderation' },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('moderate')
        .setDescription('AI-powered message moderation')
        .addStringOption((opt) =>
          opt
            .setName('message')
            .setDescription('Message to analyze')
            .setRequired(true)
            .setMaxLength(2000),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('summarize')
        .setDescription('Summarize recent messages in channel')
        .addNumberOption((opt) =>
          opt
            .setName('count')
            .setDescription('Number of messages to summarize (1-50)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(50),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('Check AI service status'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('history')
        .setDescription('Manage AI conversation history')
        .addStringOption((opt) =>
          opt
            .setName('action')
            .setDescription('Action to perform')
            .setRequired(true)
            .addChoices(
              { name: 'View', value: 'view' },
              { name: 'Clear', value: 'clear' },
            ),
        ),
    ),

  category: 'AI',
  premiumOnly: false,

  async execute(interaction, guildConfig, client) {
    const aiService = getAIService();
    const subcommand = interaction.options.getSubcommand();

    if (!aiService.isEnabled()) {
      const embed = createEmbed({
        title: '🤖 AI Service Disabled',
        description: 'The AI service is not configured on this bot. Please contact the bot owner to set up an AI provider.',
        color: 'warning',
      });
      embed.addFields([
        {
          name: 'Supported Providers',
          value: 'OpenAI (GPT-4, GPT-3.5)\nClaude (Anthropic)\nGoogle Gemini',
          inline: false,
        },
        {
          name: 'Setup Required',
          value: 'Set environment variables:\n`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`',
          inline: false,
        },
      ]);
      return await interaction.reply({ embeds: [embed], flags: 64 });
    }

    try {
      if (subcommand === 'chat') {
        await handleChatCommand(interaction, aiService);
      } else if (subcommand === 'moderate') {
        await handleModerateCommand(interaction, aiService);
      } else if (subcommand === 'summarize') {
        await handleSummarizeCommand(interaction, aiService);
      } else if (subcommand === 'status') {
        await handleStatusCommand(interaction, aiService);
      } else if (subcommand === 'history') {
        await handleHistoryCommand(interaction, aiService);
      }
    } catch (error) {
      logger.error('Error in AI command:', error);
      const embed = createEmbed({
        title: '❌ Error',
        description: `An error occurred: ${error.message}`,
        color: 'error',
      });
      await interaction.reply({ embeds: [embed], flags: 64 }).catch(() => {});
    }
  },
};

async function handleChatCommand(interaction, aiService) {
  await interaction.deferReply();

  const message = interaction.options.getString('message');
  const personality = interaction.options.getString('personality') || 'assistant';

  try {
    const thinkingEmbed = createEmbed({
      title: '🤖 Thinking...',
      description: 'Processing your message...',
      color: 'primary',
    });

    await interaction.editReply({ embeds: [thinkingEmbed] });

    const response = await aiService.generateResponse(message, personality, interaction.channelId);

    // Split response if too long
    const chunks = chunkMessage(response, 2000);

    const embeds = [];
    chunks.forEach((chunk, index) => {
      const embed = createEmbed({
        title: index === 0 ? `🤖 AI Response` : undefined,
        description: chunk,
        color: 'success',
      });
      if (index === chunks.length - 1) {
        embed.setFooter({ text: `Personality: ${personality}` });
        embed.setTimestamp();
      }
      embeds.push(embed);
    });

    await interaction.editReply({ embeds });
  } catch (error) {
    const errorEmbed = createEmbed({
      title: '❌ AI Error',
      description: error.message,
      color: 'error',
    });
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleModerateCommand(interaction, aiService) {
  await interaction.deferReply({ flags: 64 });

  const message = interaction.options.getString('message');

  try {
    const result = await aiService.moderateMessage(message);

    const embed = createEmbed({
      title: '🛡️ Moderation Analysis',
      description: result.flagged ? '⚠️ Message flagged' : '✅ No violations detected',
      color: result.flagged ? 'warning' : 'success',
    });

    embed.addFields([
      { name: 'Severity', value: result.severity || 'N/A', inline: true },
      { name: 'Reason', value: result.reason || 'No issues', inline: false },
      { name: 'Recommended Action', value: result.action || 'None', inline: true },
    ]);

    embed.setFooter({ text: 'AI-powered moderation analysis' });
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    const errorEmbed = createEmbed({
      title: '❌ Moderation Error',
      description: error.message,
      color: 'error',
    });
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleSummarizeCommand(interaction, aiService) {
  await interaction.deferReply();

  const count = interaction.options.getNumber('count') || 20;

  try {
    const messages = await interaction.channel.messages.fetch({ limit: count });
    const textMessages = messages
      .reverse()
      .map((m) => `${m.author.username}: ${m.content}`)
      .filter((m) => m.length > 0);

    if (textMessages.length === 0) {
      const embed = createEmbed({
        title: 'No Messages',
        description: 'No messages found to summarize',
        color: 'info',
      });
      return await interaction.editReply({ embeds: [embed] });
    }

    const summary = await aiService.summarizeMessages(textMessages);

    const embed = createEmbed({
      title: '📝 Channel Summary',
      description: summary,
      color: 'primary',
    });
    embed.addFields([
      { name: 'Messages Analyzed', value: textMessages.length.toString(), inline: true },
      { name: 'Channel', value: interaction.channel.name, inline: true },
    ]);
    embed.setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    const errorEmbed = createEmbed({
      title: '❌ Summarization Error',
      description: error.message,
      color: 'error',
    });
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleStatusCommand(interaction, aiService) {
  const embed = createEmbed({
    title: '🤖 AI Service Status',
    description: aiService.isEnabled() ? '✅ Online' : '❌ Offline',
    color: aiService.isEnabled() ? 'success' : 'error',
  });

  embed.addFields([
    { name: 'Provider', value: aiService.config.provider || 'Not configured', inline: true },
    { name: 'Model', value: aiService.config.model || 'Not set', inline: true },
    { name: 'Temperature', value: aiService.config.temperature.toString(), inline: true },
    { name: 'Max Tokens', value: aiService.config.maxTokens.toString(), inline: true },
  ]);

  const personalities = aiService.getPersonalities();
  embed.addFields([
    {
      name: 'Available Personalities',
      value: personalities.map((p) => `• ${p.name}`).join('\n'),
      inline: false,
    },
  ]);

  embed.setTimestamp();
  await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleHistoryCommand(interaction, aiService) {
  const action = interaction.options.getString('action');

  if (action === 'view') {
    const history = aiService.getHistory(interaction.channelId);

    if (history.length === 0) {
      const embed = createEmbed({
        title: '📜 Conversation History',
        description: 'No conversation history for this channel',
        color: 'info',
      });
      return await interaction.reply({ embeds: [embed], flags: 64 });
    }

    const historyText = history
      .map((h) => `**${h.role}:** ${h.content.substring(0, 100)}...`)
      .join('\n');

    const embed = createEmbed({
      title: '📜 Conversation History',
      description: historyText.substring(0, 4096),
      color: 'primary',
    });
    embed.setFooter({ text: `${history.length} messages in history` });

    await interaction.reply({ embeds: [embed], flags: 64 });
  } else if (action === 'clear') {
    aiService.clearHistory(interaction.channelId);

    const embed = createEmbed({
      title: '✅ History Cleared',
      description: 'Conversation history for this channel has been cleared',
      color: 'success',
    });

    await interaction.reply({ embeds: [embed], flags: 64 });
  }
}

function chunkMessage(text, maxLength) {
  const chunks = [];
  let currentChunk = '';

  const lines = text.split('\n');
  for (const line of lines) {
    if ((currentChunk + line).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
