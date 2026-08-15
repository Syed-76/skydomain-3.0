import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import AntiNukeService from '../../services/security/antiNukeService.js';
import { successEmbed, infoEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('Manage anti-nuke protection for this server')
    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('Check anti-nuke protection status')
    )
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Enable or disable anti-nuke')
        .addBooleanOption((option) =>
          option.setName('enabled').setDescription('Whether the anti-nuke guard is enabled').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('alertchannel')
        .setDescription('Set the channel that receives anti-nuke alerts')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The security alert channel').setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: 'security',

  async execute(interaction, config, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'status') {
      const guard = await AntiNukeService.getConfig(client, interaction.guildId);
      await InteractionHelper.universalReply(interaction, {
        embeds: [
          infoEmbed(
            '🛡️ Anti-Nuke Status',
            `Status: **${guard.enabled ? 'Enabled' : 'Disabled'}**\nAlert channel: **${guard.alertChannelId ? `<#${guard.alertChannelId}>` : 'Not configured'}**`
          ),
        ],
      });
      return;
    }

    if (subcommand === 'toggle') {
      const enabled = interaction.options.getBoolean('enabled');
      await AntiNukeService.setGuildProtection(client, interaction.guildId, enabled);
      await InteractionHelper.universalReply(interaction, {
        embeds: [
          successEmbed(
            '🔒 Anti-Nuke Updated',
            `Protection is now **${enabled ? 'enabled' : 'disabled'}**.`
          ),
        ],
      });
      return;
    }

    if (subcommand === 'alertchannel') {
      const channel = interaction.options.getChannel('channel');
      await AntiNukeService.setAlertChannel(client, interaction.guildId, channel.id);
      await InteractionHelper.universalReply(interaction, {
        embeds: [
          successEmbed(
            '📣 Alert Channel Set',
            `Security alerts will now be sent to **${channel}**.`
          ),
        ],
      });
    }
  },
};
