import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('permissions')
    .setDescription('View a member’s Discord permissions')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to inspect').setRequired(false),
    ),

  category: 'Utility',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction);
    if (!deferSuccess) {
      logger.warn('Permissions defer failed', { userId: interaction.user.id, guildId: interaction.guildId });
      return;
    }

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(targetUser.id);

    if (!member) {
      await InteractionHelper.safeEditReply(interaction, { content: 'That user is not in this server.' });
      return;
    }

    const permissions = member.permissions.toArray();
    const embed = createEmbed({
      title: `Permissions: ${targetUser.tag}`,
      description: `Total: ${permissions.length}`,
      fields: [
        {
          name: 'Permission List',
          value: permissions.length ? permissions.join(', ') : 'No explicit permissions',
          inline: false,
        },
      ],
    });

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
  },
};
