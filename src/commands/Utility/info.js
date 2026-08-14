import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Smart information hub for server, user, bot, and channel details')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('server')
        .setDescription('Show server information'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('user')
        .setDescription('Show user information')
        .addUserOption((option) => option.setName('target').setDescription('The user to inspect').setRequired(false)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('bot')
        .setDescription('Show bot information'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('channel')
        .setDescription('Show channel information')
        .addChannelOption((option) => option.setName('target').setDescription('Channel to inspect').setRequired(false)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('role')
        .setDescription('Show role information')
        .addRoleOption((option) => option.setName('target').setDescription('Role to inspect').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('avatar')
        .setDescription('Show a user avatar')
        .addUserOption((option) => option.setName('target').setDescription('The user to inspect').setRequired(false)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('invite')
        .setDescription('Create a server invite'),
    ),

  category: 'Utility',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction);
    if (!deferSuccess) {
      logger.warn('Info defer failed', { userId: interaction.user.id, guildId: interaction.guildId });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'bot') {
      const client = interaction.client;
      const memberCount = client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
      const embed = createEmbed({
        title: 'Sky Bot Info',
        description: 'Bot runtime and server stats.',
        fields: [
          { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
          { name: 'Users', value: `${memberCount}`, inline: true },
          { name: 'Latency', value: `${client.ws.ping} ms`, inline: true },
          { name: 'Node', value: `${process.version}`, inline: true },
          { name: 'Uptime', value: `${Math.floor((Date.now() - (client.readyTimestamp || Date.now())) / 1000)}s`, inline: true },
          { name: 'Status', value: 'Online', inline: true },
        ],
      }).setThumbnail(client.user.displayAvatarURL({ size: 256 }));
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      return;
    }

    if (subcommand === 'avatar') {
      const user = interaction.options.getUser('target') || interaction.user;
      const avatarUrl = user.displayAvatarURL({ size: 2048, dynamic: true });
      const embed = createEmbed({
        title: `${user.username}'s Avatar`,
        description: `[Download](${avatarUrl})`,
      }).setImage(avatarUrl);
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      return;
    }

    if (subcommand === 'invite') {
      const invite = await interaction.guild.invites.create(interaction.channel || interaction.guild.channels.cache.first(), {
        maxAge: 0,
        maxUses: 0,
        unique: true,
        reason: `Invite created by ${interaction.user.tag}`,
      });
      await InteractionHelper.safeEditReply(interaction, {
        content: `https://discord.gg/${invite.code}`,
      });
      return;
    }

    if (subcommand === 'server') {
      const guild = interaction.guild;
      const owner = await guild.fetchOwner();
      const embed = createEmbed({
        title: `Server Info: ${guild.name}`,
        description: `Server ID: ${guild.id}`,
        fields: [
          { name: 'Owner', value: owner.user.tag, inline: true },
          { name: 'Members', value: `${guild.memberCount}`, inline: true },
          { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
          { name: 'Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
          { name: 'Created', value: `<t:${Math.floor(guild.createdAt.getTime() / 1000)}:R>`, inline: false },
        ],
      }).setThumbnail(guild.iconURL({ size: 256 }));
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      return;
    }

    if (subcommand === 'user') {
      const user = interaction.options.getUser('target') || interaction.user;
      const member = interaction.guild.members.cache.get(user.id);
      const createdTimestamp = Math.floor(user.createdAt.getTime() / 1000);
      const joinedTimestamp = member?.joinedAt ? Math.floor(member.joinedAt.getTime() / 1000) : null;
      const embed = createEmbed({
        title: `User Info: ${user.username}`,
        description: `User ID: ${user.id}`,
        fields: [
          { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
          { name: 'Created', value: `<t:${createdTimestamp}:R>`, inline: true },
          { name: 'Joined', value: joinedTimestamp ? `<t:${joinedTimestamp}:R>` : 'Not in server', inline: true },
          { name: 'Roles', value: member?.roles.cache.size ? member.roles.cache.map((r) => r.name).slice(0, 5).join(', ') : 'None', inline: false },
        ],
      }).setThumbnail(user.displayAvatarURL({ size: 256 }));
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      return;
    }

    if (subcommand === 'channel') {
      const channel = interaction.options.getChannel('target') || interaction.channel;
      const createdTimestamp = Math.floor(channel.createdAt.getTime() / 1000);
      const embed = createEmbed({
        title: `Channel Info: #${channel.name}`,
        description: `Channel ID: ${channel.id}`,
        fields: [
          { name: 'Type', value: `${channel.type}`, inline: true },
          { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
          { name: 'Slowmode', value: `${channel.rateLimitPerUser ?? 0}s`, inline: true },
          { name: 'Created', value: `<t:${createdTimestamp}:R>`, inline: false },
        ],
      });
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      return;
    }

    if (subcommand === 'role') {
      const role = interaction.options.getRole('target');
      const createdTimestamp = Math.floor(role.createdAt.getTime() / 1000);
      const embed = createEmbed({
        title: `Role Info: ${role.name}`,
        description: `Role ID: ${role.id}`,
        fields: [
          { name: 'Members', value: `${role.members.size}`, inline: true },
          { name: 'Color', value: role.hexColor, inline: true },
          { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
          { name: 'Managed', value: role.managed ? 'Yes' : 'No', inline: true },
          { name: 'Created', value: `<t:${createdTimestamp}:R>`, inline: false },
        ],
      });
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      return;
    }

    await InteractionHelper.safeEditReply(interaction, {
      content: 'Use one of the supported info subcommands: server, user, bot, channel, role, avatar, invite.',
    });
  },
};
