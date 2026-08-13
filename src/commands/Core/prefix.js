import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { withErrorHandling, replyUserError, ErrorTypes } from '../../utils/errorHandler.js';
import { updateGuildConfig, getGuildConfig } from '../../services/config/guildConfig.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription("View or change this server's command prefix")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt.setName('new_prefix').setDescription('New command prefix (1-5 characters)').setRequired(false),
    ),

  category: 'core',

  execute: withErrorHandling(async (interaction, config, client) => {
    const deferred = await InteractionHelper.safeDefer(interaction, { flags: 0 });
    if (!deferred) return;

    try {
      const current = await getGuildConfig(client, interaction.guildId);
      const currentPrefix = current?.prefix || '!';
      
      const newPrefix = interaction.options.getString('new_prefix');

      // If no new prefix provided, just show current prefix
      if (!newPrefix) {
        const embed = createEmbed({
          title: '🔤 Current Prefix',
          description: `Your server's command prefix is: \`${currentPrefix}\`\n\n**Example usage:**\n\`${currentPrefix}help\``,
          color: 'primary',
        });
        embed.addFields([
          {
            name: 'Change Prefix',
            value: `Use \`/prefix new_prefix: !\` to change it`,
            inline: false,
          }
        ]);
        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      // Validate permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return await replyUserError(interaction, { 
          type: ErrorTypes.PERMISSION, 
          message: 'You need the **Manage Guild** permission to change the prefix.' 
        });
      }

      // Validate prefix
      const trimmedPrefix = newPrefix.trim();
      if (!trimmedPrefix || trimmedPrefix.length < 1 || trimmedPrefix.length > 5) {
        return await replyUserError(interaction, { 
          type: ErrorTypes.VALIDATION, 
          message: 'Prefix must be **1-5 characters** long.' 
        });
      }

      // Check if trying to set same prefix
      if (trimmedPrefix === currentPrefix) {
        const embed = createEmbed({
          title: '✓ Prefix Already Set',
          description: `Your prefix is already set to \`${trimmedPrefix}\``,
          color: 'info',
        });
        return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      }

      // Update prefix
      await updateGuildConfig(client, interaction.guildId, { prefix: trimmedPrefix });

      logger.info('Guild prefix updated', { 
        guildId: interaction.guildId, 
        oldPrefix: currentPrefix,
        newPrefix: trimmedPrefix, 
        userId: interaction.user.id 
      });

      const embed = createEmbed({
        title: '✅ Prefix Updated',
        description: `Server command prefix changed from \`${currentPrefix}\` to \`${trimmedPrefix}\``,
        color: 'success',
      });
      embed.addFields([
        {
          name: 'New Usage Example',
          value: `\`${trimmedPrefix}help\``,
          inline: false,
        }
      ]);

      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      throw error;
    }
  }, { command: 'prefix' })
};
