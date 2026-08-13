import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set the slowmode for the current channel')
    .addIntegerOption((option) =>
      option.setName('seconds').setDescription('Slowmode time in seconds (0 to 21600)').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  category: 'Moderation',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction);
    if (!deferSuccess) {
      logger.warn('Slowmode defer failed', { guildId: interaction.guildId, userId: interaction.user.id });
      return;
    }

    const seconds = interaction.options.getInteger('seconds');
    if (seconds < 0 || seconds > 21600) {
      await InteractionHelper.safeEditReply(interaction, {
        embeds: [successEmbed('Invalid Slowmode', 'Slowmode must be between 0 and 21600 seconds.')],
      });
      return;
    }

    await interaction.channel.setRateLimitPerUser(seconds, `Set by ${interaction.user.tag}`);

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [successEmbed('Slowmode Updated', `Slowmode for ${interaction.channel} is now **${seconds} seconds**.`)],
    });
  },
};
