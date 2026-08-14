import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('channelinfo')
    .setDescription('Get detailed information about a channel')
    .addChannelOption((option) =>
      option.setName('channel').setDescription('The channel to inspect').setRequired(false),
    ),

  category: 'Utility',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction);
    if (!deferSuccess) {
      logger.warn('ChannelInfo defer failed', { userId: interaction.user.id, guildId: interaction.guildId });
      return;
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    if (!channel) {
      await InteractionHelper.safeEditReply(interaction, { content: 'No channel found for this request.' });
      return;
    }

    const createdTimestamp = Math.floor(channel.createdAt.getTime() / 1000);
    const channelType = channel.type?.toString() || 'Unknown';

    const embed = createEmbed({
      title: `Channel Info: #${channel.name}`,
      description: `Channel ID: ${channel.id}`,
      fields: [
        { name: 'Type', value: channelType, inline: true },
        { name: 'Category', value: channel.parent?.name || 'None', inline: true },
        { name: 'Position', value: `${channel.position ?? 0}`, inline: true },
        { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
        { name: 'Slowmode', value: `${channel.rateLimitPerUser ?? 0}s`, inline: true },
        { name: 'Created', value: `<t:${createdTimestamp}:R>`, inline: false },
      ],
    });

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
  },
};
