import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Get detailed information about a role')
    .addRoleOption((option) =>
      option.setName('role').setDescription('The role to inspect').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  category: 'Utility',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction);
    if (!deferSuccess) {
      logger.warn('RoleInfo defer failed', { guildId: interaction.guildId, userId: interaction.user.id });
      return;
    }

    const role = interaction.options.getRole('role');
    const members = role.members.size;
    const createdAt = Math.floor(role.createdAt.getTime() / 1000);

    const embed = createEmbed({
      title: `Role Info: ${role.name}`,
      description: `Role ID: ${role.id}`,
      fields: [
        { name: 'Color', value: role.hexColor || '#000000', inline: true },
        { name: 'Members', value: `${members}`, inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Managed', value: role.managed ? 'Yes' : 'No', inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Created', value: `<t:${createdAt}:R>`, inline: false },
      ],
    });

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
  },
};
