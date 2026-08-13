import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { withErrorHandling, replyUserError, ErrorTypes } from '../../utils/errorHandler.js';
import { updateGuildConfig, getGuildConfig } from '../../services/config/guildConfig.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { successEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setprefix')
    .setDescription("Set this server's command prefix")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt.setName('prefix').setDescription('New command prefix (1-5 characters)').setRequired(true),
    ),

  category: 'core',

  execute: withErrorHandling(async (interaction, config, client) => {
    const deferred = await InteractionHelper.safeDefer(interaction, { flags: 0 });
    if (!deferred) return;

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await replyUserError(interaction, { type: ErrorTypes.PERMISSION, message: 'You need the Manage Guild permission to change the prefix.' });
    }

    const newPrefix = interaction.options.getString('prefix', true).trim();
    if (!newPrefix || newPrefix.length < 1 || newPrefix.length > 5) {
      return await replyUserError(interaction, { type: ErrorTypes.VALIDATION, message: 'Prefix must be 1-5 characters.' });
    }

    try {
      const current = await getGuildConfig(client, interaction.guildId);
      await updateGuildConfig(client, interaction.guildId, { prefix: newPrefix });

      logger.info('Guild prefix updated', { guildId: interaction.guildId, prefix: newPrefix, userId: interaction.user.id });

      await InteractionHelper.safeEditReply(interaction, { embeds: [successEmbed('Prefix Updated', `Server command prefix set to **${newPrefix}**`)] });
    } catch (error) {
      throw error;
    }
  }, { command: 'setprefix' })
};
