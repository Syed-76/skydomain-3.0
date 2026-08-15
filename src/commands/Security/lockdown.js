import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import LockdownService from '../../services/security/lockdownService.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Emergency server lockdown management')
    .addSubcommand(sub =>
      sub.setName('enable')
        .setDescription('Enable emergency lockdown')
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('Reason for lockdown')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('disable')
        .setDescription('Disable lockdown and restore operations')
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Check current lockdown status')
    )
    .addSubcommand(sub =>
      sub.setName('history')
        .setDescription('View lockdown history')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: 'security',

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const { client, guild } = interaction;

    try {
      if (subcommand === 'enable') {
        const isLocked = await LockdownService.isLockedDown(client, guild.id);

        if (isLocked) {
          const embed = errorEmbed(
            'Already Locked Down',
            'This server is already in lockdown mode. Use `/lockdown disable` to lift it.'
          );
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const reason = interaction.options.getString('reason') || 'Emergency lockdown';

        await interaction.deferReply();

        const success = await LockdownService.enableLockdown(client, guild, interaction.member, reason);

        if (!success) {
          const embed = errorEmbed('Failed', 'Failed to enable lockdown.');
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const embed = {
          color: 0xFF0000,
          title: '🔒 LOCKDOWN ENABLED',
          description: 'Emergency lockdown has been activated.',
          fields: [
            { name: 'Reason', value: reason, inline: false },
            { name: 'Enabled By', value: interaction.member.toString(), inline: true },
            { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
            { name: '⚠️ Alert', value: 'All members have been restricted from sending messages.', inline: false }
          ],
          thumbnail: { url: guild.iconURL({ dynamic: true }) },
          footer: { text: 'skydomain Security - Lockdown System' }
        };

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'disable') {
        const isLocked = await LockdownService.isLockedDown(client, guild.id);

        if (!isLocked) {
          const embed = errorEmbed(
            'Not Locked Down',
            'This server is not currently in lockdown mode.'
          );
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        await interaction.deferReply();

        const success = await LockdownService.disableLockdown(client, guild, interaction.member);

        if (!success) {
          const embed = errorEmbed('Failed', 'Failed to disable lockdown.');
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const embed = {
          color: 0x00FF00,
          title: '🔓 LOCKDOWN DISABLED',
          description: 'Emergency lockdown has been lifted. Normal operations resumed.',
          fields: [
            { name: 'Lifted By', value: interaction.member.toString(), inline: true },
            { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
          ],
          thumbnail: { url: guild.iconURL({ dynamic: true }) },
          footer: { text: 'skydomain Security - Lockdown System' }
        };

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'status') {
        const embed = await LockdownService.getStatusEmbed(client, guild);

        if (!embed) {
          const errorEmbedResult = errorEmbed('Error', 'Failed to retrieve lockdown status.');
          return await InteractionHelper.universalReply(interaction, { embeds: [errorEmbedResult] });
        }

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'history') {
        const history = await LockdownService.getLockdownHistory(client, guild.id, 10);

        if (history.length === 0) {
          const embed = {
            color: 0x0099FF,
            title: '📜 Lockdown History',
            description: 'No lockdown history found.'
          };
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const historyText = history
          .map(h => {
            const action = h.action === 'lockdown_enabled' ? '🔒 **Enabled**' : '🔓 **Disabled**';
            const by = h.moderatorTag || 'System';
            const time = `<t:${Math.floor(h.timestamp / 1000)}:R>`;
            const reason = h.reason ? ` - ${h.reason}` : '';
            return `${action} by ${by} ${time}${reason}`;
          })
          .join('\n');

        const embed = {
          color: 0x0099FF,
          title: '📜 Lockdown History',
          description: historyText,
          footer: { text: 'skydomain Security - Lockdown System' }
        };

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }
    } catch (error) {
      const embed = errorEmbed('Error', error.message);
      return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
    }
  }
};
