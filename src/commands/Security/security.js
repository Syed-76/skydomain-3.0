import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import AntiNukeService from '../../services/security/antiNukeService.js';
import { infoEmbed, successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('security')
    .setDescription('Manage server security features')
    .addSubcommand((sub) =>
      sub
        .setName('dashboard')
        .setDescription('View the security dashboard')
    )
    .addSubcommand((sub) =>
      sub
        .setName('config')
        .setDescription('Configure security features')
        .addBooleanOption((option) =>
          option.setName('antinuke').setDescription('Enable anti-nuke').setRequired(false)
        )
        .addBooleanOption((option) =>
          option.setName('antimod').setDescription('Enable anti-mod').setRequired(false)
        )
        .addChannelOption((option) =>
          option.setName('alertchannel').setDescription('Alert channel for security events').setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: 'security',

  async execute(interaction, config, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'dashboard') {
      const guard = await AntiNukeService.getConfig(client, interaction.guildId);
      await InteractionHelper.universalReply(interaction, {
        embeds: [
          infoEmbed(
            '🔐 Security Dashboard',
            `**Anti-Nuke**: ${guard.enabled ? '✅ Active' : '❌ Inactive'}\n` +
            `**Anti-Mod**: ${guard.enabled ? '✅ Active' : '❌ Inactive'}\n` +
            `**Alert Channel**: ${guard.alertChannelId ? `<#${guard.alertChannelId}>` : '❌ Not Set'}\n` +
            `**Trusted Users**: ${(guard.trustedUsers || []).length}`
          ),
        ],
      });
      return;
    }

    if (subcommand === 'config') {
      const guard = await AntiNukeService.getConfig(client, interaction.guildId);
      const antiNuke = interaction.options.getBoolean('antinuke');
      const antiMod = interaction.options.getBoolean('antimod');
      const alertChannel = interaction.options.getChannel('alertchannel');

      if (antiNuke !== null) guard.enabled = antiNuke;
      if (alertChannel) guard.alertChannelId = alertChannel.id;

      await AntiNukeService.saveConfig(client, interaction.guildId, guard);

      await InteractionHelper.universalReply(interaction, {
        embeds: [
          successEmbed(
            '⚙️ Security Config Updated',
            `Settings have been saved for ${interaction.guild.name}.`
          ),
        ],
      });
    }
  },
};
