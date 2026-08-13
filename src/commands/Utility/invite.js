import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Create a public invite link for this server')
    .addChannelOption((option) =>
      option.setName('channel').setDescription('Channel for the invite').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),

  category: 'Utility',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction);
    if (!deferSuccess) {
      logger.warn('Invite defer failed', { guildId: interaction.guildId, userId: interaction.user.id });
      return;
    }

    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const invite = await interaction.guild.invites.create(targetChannel, {
      maxAge: 0,
      maxUses: 0,
      unique: true,
      reason: `Created by ${interaction.user.tag}`,
    });

    await InteractionHelper.safeEditReply(interaction, {
      embeds: [successEmbed('Server Invite', `**Invite link:** https://discord.gg/${invite.code}\n**Channel:** ${targetChannel}`)],
    });
  },
};
