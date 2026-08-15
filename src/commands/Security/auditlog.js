import { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import AuditLogService from '../../services/security/auditLogService.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('auditlog')
    .setDescription('View and manage security audit logs')
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View recent audit events')
        .addIntegerOption(opt =>
          opt.setName('limit')
            .setDescription('Number of events to show')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(50)
        )
    )
    .addSubcommand(sub =>
      sub.setName('alerts')
        .setDescription('View security alerts')
        .addBooleanOption(opt =>
          opt.setName('unresolved')
            .setDescription('Show only unresolved alerts')
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('search')
        .setDescription('Search audit logs')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Event type to search for')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('report')
        .setDescription('Generate security report')
        .addStringOption(opt =>
          opt.setName('timeframe')
            .setDescription('Report timeframe')
            .setRequired(false)
            .addChoices(
              { name: '24 Hours', value: 'day' },
              { name: '7 Days', value: 'week' },
              { name: '30 Days', value: 'month' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('setchannel')
        .setDescription('Set audit log channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for audit logs')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('export')
        .setDescription('Export audit logs')
        .addStringOption(opt =>
          opt.setName('format')
            .setDescription('Export format')
            .setRequired(false)
            .addChoices(
              { name: 'JSON', value: 'json' },
              { name: 'CSV', value: 'csv' }
            )
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: 'security',

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const { client, guild } = interaction;

    try {
      if (subcommand === 'view') {
        const limit = interaction.options.getInteger('limit') || 20;
        const events = await AuditLogService.getEvents(client, guild.id, {}, limit);

        if (events.length === 0) {
          const embed = errorEmbed('No Events', 'No audit events found.');
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const eventList = events
          .map(e => {
            const icon = { info: 'ℹ️', warning: '⚠️', critical: '🚨' }[e.severity] || 'ℹ️';
            return `${icon} **${e.action}** - <t:${Math.floor(e.timestamp / 1000)}:R>`;
          })
          .join('\n');

        const embed = {
          color: 0x0099FF,
          title: '📋 Recent Audit Events',
          description: eventList,
          footer: { text: `Showing ${events.length} events` }
        };

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'alerts') {
        const unresolved = interaction.options.getBoolean('unresolved');
        const filter = unresolved ? { resolved: false } : {};
        const alerts = await AuditLogService.getAlerts(client, guild.id, filter, 15);

        if (alerts.length === 0) {
          const embed = {
            color: 0x00FF00,
            title: '✅ No Alerts',
            description: unresolved ? 'All alerts have been resolved.' : 'No security alerts found.'
          };
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const alertList = alerts
          .map(a => {
            const icon = { info: 'ℹ️', warning: '⚠️', critical: '🚨' }[a.severity] || 'ℹ️';
            const status = a.resolved ? '✅' : '⚠️';
            return `${icon} ${status} **${a.title}** - <t:${Math.floor(a.timestamp / 1000)}:R>`;
          })
          .join('\n');

        const embed = {
          color: 0xFF8800,
          title: '🚨 Security Alerts',
          description: alertList,
          footer: { text: `Showing ${alerts.length} alerts` }
        };

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'search') {
        const type = interaction.options.getString('type');
        const events = await AuditLogService.getEvents(client, guild.id, { type }, 30);

        if (events.length === 0) {
          const embed = errorEmbed('No Results', `No events found for type: **${type}**`);
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const eventList = events
          .slice(-10)
          .map(e => {
            const icon = { info: 'ℹ️', warning: '⚠️', critical: '🚨' }[e.severity] || 'ℹ️';
            return `${icon} **${e.action}** - <t:${Math.floor(e.timestamp / 1000)}:R>`;
          })
          .join('\n');

        const embed = {
          color: 0x0099FF,
          title: `📋 Events: ${type}`,
          description: eventList || 'No events found.',
          footer: { text: `Found ${events.length} total events` }
        };

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'report') {
        const timeframe = interaction.options.getString('timeframe') || 'day';
        const embed = await AuditLogService.generateReportEmbed(client, guild, timeframe);

        if (!embed) {
          const errorResult = errorEmbed('Error', 'Failed to generate report.');
          return await InteractionHelper.universalReply(interaction, { embeds: [errorResult] });
        }

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'setchannel') {
        const channel = interaction.options.getChannel('channel');
        const success = await AuditLogService.setAuditChannel(client, guild.id, channel.id);

        if (!success) {
          const embed = errorEmbed('Error', 'Failed to set audit channel.');
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const embed = successEmbed(
          '✅ Audit Channel Set',
          `Audit events will now be logged to ${channel.toString()}`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'export') {
        const format = interaction.options.getString('format') || 'json';

        await interaction.deferReply();

        const exported = await AuditLogService.exportLog(client, guild.id, format);

        if (!exported) {
          const embed = errorEmbed('Error', 'Failed to export logs.');
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const ext = format === 'json' ? '.json' : '.csv';
        const filename = `auditlog-${guild.id}-${Date.now()}${ext}`;
        const buffer = Buffer.from(exported, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: filename });

        const embed = successEmbed(
          '✅ Export Complete',
          `Audit logs exported in ${format.toUpperCase()} format`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed], files: [attachment] });
      }
    } catch (error) {
      const embed = errorEmbed('Error', error.message);
      return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
    }
  }
};
