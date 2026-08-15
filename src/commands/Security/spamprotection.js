import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import SpamProtectionService from '../../services/security/spamProtectionService.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('spamprotection')
    .setDescription('Configure spam and raid protection')
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('View spam protection status')
    )
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Enable or disable spam protection')
    )
    .addSubcommand(sub =>
      sub.setName('alertchannel')
        .setDescription('Set the alert channel for spam incidents')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for alerts')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('threshold')
        .setDescription('Configure spam thresholds')
        .addStringOption(opt =>
          opt.setName('type')
            .setDescription('Type of threshold to adjust')
            .setRequired(true)
            .addChoices(
              { name: 'Message Spam', value: 'message' },
              { name: 'Join Spam', value: 'join' },
              { name: 'Mention Spam', value: 'mention' }
            )
        )
        .addIntegerOption(opt =>
          opt.setName('limit')
            .setDescription('New threshold value')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(50)
        )
    )
    .addSubcommand(sub =>
      sub.setName('action')
        .setDescription('Set auto-action for spam violations')
        .addStringOption(opt =>
          opt.setName('action')
            .setDescription('Action to take')
            .setRequired(true)
            .addChoices(
              { name: 'Warn (DM)', value: 'warn' },
              { name: 'Mute', value: 'mute' },
              { name: 'Kick', value: 'kick' }
            )
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: 'security',

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    try {
      if (subcommand === 'status') {
        const config = await SpamProtectionService.getConfig(guildId);
        const incidents = await SpamProtectionService.getIncidents(guildId, 10);

        const embed = {
          color: config.enabled ? 0x00FF00 : 0xFF0000,
          title: '📊 Spam Protection Status',
          fields: [
            {
              name: 'Status',
              value: config.enabled ? '✅ Enabled' : '❌ Disabled',
              inline: true
            },
            {
              name: 'Alert Channel',
              value: config.alertChannelId ? `<#${config.alertChannelId}>` : 'Not configured',
              inline: true
            },
            {
              name: 'Message Threshold',
              value: `${config.messageThreshold} messages in ${config.messageTimeWindowMs / 1000}s`,
              inline: false
            },
            {
              name: 'Join Threshold',
              value: `${config.joinThreshold} joins in ${config.joinTimeWindowMs / 1000}s`,
              inline: false
            },
            {
              name: 'Mention Threshold',
              value: `${config.mentionThreshold} mentions per message`,
              inline: false
            },
            {
              name: 'Auto Action',
              value: config.autoAction.toUpperCase(),
              inline: true
            }
          ],
          footer: { text: 'skydomain Spam Protection' }
        };

        if (incidents.length > 0) {
          const recentIncidents = incidents
            .slice(-5)
            .map(i => `• ${i.spamType}: ${i.username}`)
            .join('\n');
          embed.fields.push({
            name: 'Recent Incidents',
            value: recentIncidents,
            inline: false
          });
        }

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'toggle') {
        const config = await SpamProtectionService.getConfig(guildId);
        config.enabled = !config.enabled;
        await SpamProtectionService.saveConfig(guildId, config);

        const embed = successEmbed(
          `${config.enabled ? '✅' : '❌'} Spam Protection ${config.enabled ? 'Enabled' : 'Disabled'}`,
          `Spam protection is now ${config.enabled ? 'active' : 'inactive'} for this server.`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'alertchannel') {
        const channel = interaction.options.getChannel('channel');
        const config = await SpamProtectionService.getConfig(guildId);

        config.alertChannelId = channel.id;
        await SpamProtectionService.saveConfig(guildId, config);

        const embed = successEmbed(
          '📢 Alert Channel Updated',
          `Spam alerts will now be sent to ${channel.toString()}`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'threshold') {
        const type = interaction.options.getString('type');
        const limit = interaction.options.getInteger('limit');
        const config = await SpamProtectionService.getConfig(guildId);

        if (type === 'message') {
          config.messageThreshold = limit;
        } else if (type === 'join') {
          config.joinThreshold = limit;
        } else if (type === 'mention') {
          config.mentionThreshold = limit;
        }

        await SpamProtectionService.saveConfig(guildId, config);

        const embed = successEmbed(
          '⚙️ Threshold Updated',
          `${type.charAt(0).toUpperCase() + type.slice(1)} spam threshold set to **${limit}**`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'action') {
        const action = interaction.options.getString('action');
        const config = await SpamProtectionService.getConfig(guildId);

        config.autoAction = action;
        await SpamProtectionService.saveConfig(guildId, config);

        const embed = successEmbed(
          '⚙️ Auto-Action Updated',
          `Auto-action set to **${action.toUpperCase()}** for spam violations`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }
    } catch (error) {
      const embed = errorEmbed('Error', error.message);
      return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
    }
  }
};
