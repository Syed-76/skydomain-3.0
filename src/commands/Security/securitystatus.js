import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import AntiNukeService from '../../services/security/antiNukeService.js';
import { infoEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('securitystatus')
    .setDescription('Display current anti-nuke and anti-mod status')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: 'security',

  async execute(interaction, config, client) {
    const guard = await AntiNukeService.getConfig(client, interaction.guildId);

    await InteractionHelper.universalReply(interaction, {
      embeds: [
        infoEmbed(
          '🛡️ Security Overview',
          `Anti-Nuke: **${guard.enabled ? 'Active' : 'Inactive'}**\n` +
          `Alert channel: **${guard.alertChannelId ? `<#${guard.alertChannelId}>` : 'Not set'}**\n` +
          `Trusted users: **${(guard.trustedUsers || []).length}**`
        ),
      ],
    });
  },
};
