import { SlashCommandBuilder, version } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('View Sky bot status, uptime, and live stats'),

  category: 'Utility',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction);
    if (!deferSuccess) {
      logger.warn('BotInfo defer failed', { userId: interaction.user.id, guildId: interaction.guildId });
      return;
    }

    const client = interaction.client;
    const guildCount = client.guilds.cache.size;
    const memberCount = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
    const uptimeSeconds = Math.floor((Date.now() - (client.readyTimestamp || Date.now())) / 1000);
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const uptimeText = `${Math.floor(uptimeSeconds / 86400)}d ${Math.floor((uptimeSeconds % 86400) / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;

    const embed = createEmbed({
      title: 'Sky Bot Information',
      description: 'Live system information for the current bot instance.',
      fields: [
        { name: 'Servers', value: `${guildCount}`, inline: true },
        { name: 'Users', value: `${memberCount}`, inline: true },
        { name: 'Latency', value: `${client.ws.ping} ms`, inline: true },
        { name: 'Node.js', value: `${process.version}`, inline: true },
        { name: 'Discord.js', value: `v${version}`, inline: true },
        { name: 'Memory', value: `${memoryUsage} MB`, inline: true },
        { name: 'Uptime', value: uptimeText, inline: false },
        { name: 'Status', value: 'Online and ready', inline: false },
      ],
    }).setThumbnail(client.user.displayAvatarURL({ size: 256 }));

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
  },
};
