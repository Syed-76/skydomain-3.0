import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import ReputationService from '../../services/security/reputationService.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reputation')
    .setDescription('Manage member reputation and warnings')
    .addSubcommand(sub =>
      sub.setName('check')
        .setDescription('Check member reputation')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to check')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('warn')
        .setDescription('Issue a warning to a member')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to warn')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('reason')
            .setDescription('Reason for warning')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('removewarn')
        .setDescription('Remove a warning from a member')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to remove warning from')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('warningid')
            .setDescription('Warning ID to remove')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('clearwarnings')
        .setDescription('Clear all warnings for a member')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to clear warnings for')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('boost')
        .setDescription('Boost member reputation (positive action)')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to boost')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('amount')
            .setDescription('Points to add (default: 5)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(50)
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List members with warnings')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  category: 'security',

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const { client, guild } = interaction;

    try {
      if (subcommand === 'check') {
        const user = interaction.options.getUser('user');
        const record = await ReputationService.getRecord(client, guild, user);

        if (!record) {
          const embed = errorEmbed('Not Found', 'Could not retrieve reputation data.');
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const embed = await ReputationService.generateReportEmbed(client, guild, user);
        return await InteractionHelper.universalReply(interaction, { embeds: [embed || errorEmbed('Error', 'Failed to generate report')] });
      }

      if (subcommand === 'warn') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        const record = await ReputationService.addWarning(client, guild, user, reason, interaction.member);

        if (!record) {
          const embed = errorEmbed('Error', 'Failed to add warning.');
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const embed = successEmbed(
          '⚠️ Warning Issued',
          `**${user.tag}** has been warned\n\n**Reason:** ${reason}\n**New Reputation:** ${record.reputation}/100\n**New Trust Level:** ${record.trustLevel.toUpperCase()}`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'removewarn') {
        const user = interaction.options.getUser('user');
        const warningId = interaction.options.getString('warningid');

        const success = await ReputationService.removeWarning(client, guild, user, warningId, interaction.member);

        if (!success) {
          const embed = errorEmbed('Not Found', `Warning ID **${warningId}** not found.`);
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const embed = successEmbed(
          '✅ Warning Removed',
          `Warning removed from **${user.tag}**`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'clearwarnings') {
        const user = interaction.options.getUser('user');
        const success = await ReputationService.clearWarnings(client, guild, user, interaction.member);

        if (!success) {
          const embed = errorEmbed('Error', 'Failed to clear warnings.');
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const embed = successEmbed(
          '🗑️ Warnings Cleared',
          `All warnings cleared for **${user.tag}**`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'boost') {
        const user = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount') || 5;

        const success = await ReputationService.boostReputation(client, guild, user, amount);

        if (!success) {
          const embed = errorEmbed('Error', 'Failed to boost reputation.');
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const embed = successEmbed(
          '⬆️ Reputation Boosted',
          `Added **+${amount}** reputation points to **${user.tag}**`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'list') {
        const auditLog = await ReputationService.getAuditLog(client, guild.id, 20);

        if (auditLog.length === 0) {
          const embed = { color: 0x0099FF, title: '📋 Recent Actions', description: 'No recent reputation actions.' };
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const recentActions = auditLog
          .slice(-10)
          .map(log => `• ${log.action.replace('_', ' ').toUpperCase()}: <@${log.targetId}> - <t:${Math.floor(log.timestamp / 1000)}:R>`)
          .join('\n');

        const embed = {
          color: 0x0099FF,
          title: '📋 Recent Reputation Actions',
          description: recentActions || 'No recent actions.',
          footer: { text: 'skydomain Reputation System' }
        };

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }
    } catch (error) {
      const embed = errorEmbed('Error', error.message);
      return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
    }
  }
};
