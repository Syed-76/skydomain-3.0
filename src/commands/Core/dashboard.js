import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { buildCommandRegistry } from '../../services/commandAccessService.js';
import { getCommandPrefix } from '../../config/bot.js';

const CATEGORY_ICONS = {
  Core: 'ℹ️',
  Moderation: '🛡️',
  Economy: '💰',
  Music: '🎵',
  Fun: '🎮',
  Leveling: '📊',
  Utility: '🔧',
  Ticket: '🎫',
  Welcome: '👋',
  Giveaway: '🎉',
  Counter: '🔢',
  Tools: '🛠️',
  Search: '🔍',
  'Reaction Roles': '🎭',
  Community: '👥',
  Birthday: '🎂',
  'Join To Create': '🔌',
  Verification: '✅',
};

function formatCategoryName(rawCategory) {
  return String(rawCategory || '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Open the public dashboard and command guide for this bot'),

  category: 'Core',

  async execute(interaction, _config, client) {
    const deferred = await InteractionHelper.safeDefer(interaction, { flags: 0 });
    if (!deferred) return;

    const publicDashboardUrl = process.env.PUBLIC_DASHBOARD_URL || 'https://github.com/Syed-76/skydomain-3.0';
    const prefix = getCommandPrefix();
    const registry = buildCommandRegistry(client);

    const fields = [];

    for (const category of [...registry.values()].sort((a, b) => a.displayName.localeCompare(b.displayName))) {
      const commandLines = category.commands
        .filter((command) => !command.isSubcommand)
        .slice(0, 12)
        .map((command) => `• /${command.name} — ${command.description}`)
        .join('\n');

      if (!commandLines) continue;

      fields.push({
        name: `${CATEGORY_ICONS[category.folder] || '📌'} ${category.displayName}`,
        value: commandLines.length > 1024 ? `${commandLines.slice(0, 1000)}...` : commandLines,
        inline: false,
      });
    }

    const embed = createEmbed({
      title: '📘 Dashboard & Command Guide',
      description: [
        `Public dashboard: ${publicDashboardUrl}`,
        `Use /commands for server settings and ${prefix} for prefix commands.`,
        'Below is a summary of the commands available in this bot and what they are used for.',
      ].join('\n'),
      color: 'primary',
      fields: fields.slice(0, 12),
    });

    if (fields.length > 12) {
      embed.addFields({
        name: 'ℹ️ More Commands',
        value: 'Use /help to browse the full command menu, or use the public dashboard link above for the complete list.',
        inline: false,
      });
    }

    const dashboardButton = new ButtonBuilder()
      .setLabel('Open Public Dashboard')
      .setURL(publicDashboardUrl)
      .setStyle(ButtonStyle.Link);

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(dashboardButton)],
    });
  },
};
