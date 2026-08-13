import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement message to a channel')
    .addStringOption((option) =>
      option.setName('title').setDescription('Announcement title').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('message').setDescription('Announcement text').setRequired(true),
    )
    .addChannelOption((option) =>
      option.setName('channel').setDescription('Channel to send the announcement to').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone | PermissionFlagsBits.ManageGuild),

  category: 'Moderation',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction);
    if (!deferSuccess) {
      logger.warn('Announce defer failed', { guildId: interaction.guildId, userId: interaction.user.id });
      return;
    }

    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = createEmbed({
      title: `📢 ${title}`,
      description: message,
      color: 'info',
    });

    await channel.send({ embeds: [embed] });

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [createEmbed({ title: '✅ Announcement Sent', description: `The announcement was sent to ${channel}.`, color: 'success' })],
    });
  },
};
