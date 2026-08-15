import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import AntiNukeService from '../../services/security/antiNukeService.js';
import { successEmbed, infoEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('antimod')
    .setDescription('Manage anti-moderation protections for this server')
    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('Check anti-moderation protection status')
    )
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Enable or disable anti-moderation protection')
        .addBooleanOption((option) =>
          option.setName('enabled').setDescription('Whether anti-moderation is enabled').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('trusted')
        .setDescription('Add a trusted user that should be ignored by the anti-moderation guard')
        .addUserOption((option) =>
          option.setName('user').setDescription('Trusted user').setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: 'security',

  async execute(interaction, config, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === 'status') {
      const guard = await AntiNukeService.getConfig(client, guildId);
      await InteractionHelper.universalReply(interaction, {
        embeds: [
          infoEmbed(
            '🛡️ Anti-Moderation Status',
            `Guard status: **${guard.enabled ? 'Enabled' : 'Disabled'}**\nTrusted members: **${(guard.trustedUsers || []).length}**`
          ),
        ],
      });
      return;
    }

    if (subcommand === 'toggle') {
      const enabled = interaction.options.getBoolean('enabled');
      await AntiNukeService.setGuildProtection(client, guildId, enabled);
      await InteractionHelper.universalReply(interaction, {
        embeds: [
          successEmbed(
            '🛡️ Anti-Moderation Updated',
            `Security guard is now **${enabled ? 'enabled' : 'disabled'}**.`
          ),
        ],
      });
      return;
    }

    if (subcommand === 'trusted') {
      const user = interaction.options.getUser('user');
      const guard = await AntiNukeService.getConfig(client, guildId);
      const users = new Set(guard.trustedUsers || []);
      users.add(user.id);
      guard.trustedUsers = [...users];
      await AntiNukeService.saveConfig(client, guildId, guard);
      await InteractionHelper.universalReply(interaction, {
        embeds: [
          successEmbed(
            '✅ Trusted User Added',
            `${user.tag} has been marked as trusted for security checks.`
          ),
        ],
      });
    }
  },
};
