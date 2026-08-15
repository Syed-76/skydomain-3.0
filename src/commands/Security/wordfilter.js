import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import WordFilterService from '../../services/security/wordFilterService.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('wordfilter')
    .setDescription('Configure content word filtering')
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('View filter status and list')
    )
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Enable or disable content filtering')
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a word filter')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Filter name')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('pattern')
            .setDescription('Word or pattern to filter')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('severity')
            .setDescription('Violation severity')
            .setRequired(false)
            .addChoices(
              { name: 'Low', value: 'low' },
              { name: 'Medium', value: 'medium' },
              { name: 'High', value: 'high' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a word filter')
        .addStringOption(opt =>
          opt.setName('filtername')
            .setDescription('Name of filter to remove')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('alertchannel')
        .setDescription('Set violations alert channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel for alerts')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('action')
        .setDescription('Set auto-action for violations')
        .addStringOption(opt =>
          opt.setName('action')
            .setDescription('Action to take')
            .setRequired(true)
            .addChoices(
              { name: 'Warn', value: 'warn' },
              { name: 'Mute', value: 'mute' }
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
        const config = await WordFilterService.getConfig(guildId);
        const filters = await WordFilterService.getFilters(guildId);

        const embed = {
          color: config.enabled ? 0x00FF00 : 0xFF0000,
          title: '🚫 Content Filter Status',
          fields: [
            {
              name: 'Status',
              value: config.enabled ? '✅ Enabled' : '❌ Disabled',
              inline: true
            },
            {
              name: 'Auto Delete',
              value: config.autoDelete ? '✅ Yes' : '❌ No',
              inline: true
            },
            {
              name: 'Active Filters',
              value: filters.length.toString(),
              inline: true
            },
            {
              name: 'Auto Action',
              value: config.autoAction.toUpperCase(),
              inline: true
            }
          ],
          footer: { text: 'skydomain Content Filter' }
        };

        if (filters.length > 0) {
          const filterList = filters
            .map(f => `• **${f.name}** - \`${f.pattern}\``)
            .join('\n');
          embed.fields.push({
            name: 'Current Filters',
            value: filterList,
            inline: false
          });
        }

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'toggle') {
        const config = await WordFilterService.getConfig(guildId);
        config.enabled = !config.enabled;
        await WordFilterService.saveConfig(guildId, config);

        const embed = successEmbed(
          `${config.enabled ? '✅' : '❌'} Content Filter ${config.enabled ? 'Enabled' : 'Disabled'}`,
          `Word filtering is now ${config.enabled ? 'active' : 'inactive'}.`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'add') {
        const name = interaction.options.getString('name');
        const pattern = interaction.options.getString('pattern');
        const severity = interaction.options.getString('severity') || 'medium';

        const success = await WordFilterService.addFilter(guildId, name, pattern, severity);

        if (!success) {
          const embed = errorEmbed('Filter Exists', `A filter named **${name}** already exists.`);
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        const embed = successEmbed(
          '✅ Filter Added',
          `**${name}** filter created\n\n**Pattern:** \`${pattern}\`\n**Severity:** ${severity.toUpperCase()}`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'remove') {
        const filterName = interaction.options.getString('filtername');
        const filters = await WordFilterService.getFilters(guildId);
        const filter = filters.find(f => f.name.toLowerCase() === filterName.toLowerCase());

        if (!filter) {
          const embed = errorEmbed('Filter Not Found', `No filter named **${filterName}** exists.`);
          return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
        }

        await WordFilterService.removeFilter(guildId, filter.id);

        const embed = successEmbed(
          '✅ Filter Removed',
          `**${filter.name}** filter has been deleted.`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'alertchannel') {
        const channel = interaction.options.getChannel('channel');
        const config = await WordFilterService.getConfig(guildId);

        config.alertChannelId = channel.id;
        await WordFilterService.saveConfig(guildId, config);

        const embed = successEmbed(
          '📢 Alert Channel Updated',
          `Filter violations will be sent to ${channel.toString()}`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }

      if (subcommand === 'action') {
        const action = interaction.options.getString('action');
        const config = await WordFilterService.getConfig(guildId);

        config.autoAction = action;
        await WordFilterService.saveConfig(guildId, config);

        const embed = successEmbed(
          '⚙️ Auto-Action Updated',
          `Auto-action set to **${action.toUpperCase()}** for filter violations`
        );

        return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
      }
    } catch (error) {
      const embed = errorEmbed('Error', error.message);
      return await InteractionHelper.universalReply(interaction, { embeds: [embed] });
    }
  }
};
