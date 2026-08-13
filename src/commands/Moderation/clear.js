import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete up to 100 messages from a channel')
    .addIntegerOption((option) =>
      option.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  category: 'Moderation',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction, { flags: MessageFlags.Ephemeral });
    if (!deferSuccess) {
      logger.warn('Clear defer failed', { guildId: interaction.guildId, userId: interaction.user.id });
      return;
    }

    const amount = interaction.options.getInteger('amount');
    if (!amount || amount < 1 || amount > 100) {
      await InteractionHelper.safeEditReply(interaction, {
        embeds: [successEmbed('Invalid Amount', 'Please choose a value between 1 and 100.')],
      });
      return;
    }

    const messages = await interaction.channel.messages.fetch({ limit: amount });
    const deleted = await interaction.channel.bulkDelete(messages, true);

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [successEmbed('Messages Cleared', `Deleted **${deleted.size}** message(s) from ${interaction.channel}.`)],
    });
  },
};
