import { SlashCommandBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('emojiinfo')
    .setDescription('Get information about a server emoji')
    .addStringOption((option) =>
      option.setName('emoji').setDescription('Emoji name, ID, or mention').setRequired(true),
    ),

  category: 'Utility',

  async execute(interaction) {
    const deferSuccess = await InteractionHelper.safeDefer(interaction);
    if (!deferSuccess) {
      logger.warn('EmojiInfo defer failed', { userId: interaction.user.id, guildId: interaction.guildId });
      return;
    }

    const input = interaction.options.getString('emoji', true);
    const guildEmoji = interaction.guild.emojis.cache.find((emoji) => {
      return emoji.name === input || emoji.id === input || `<:${emoji.name}:${emoji.id}>` === input || `<a:${emoji.name}:${emoji.id}>` === input;
    });

    if (!guildEmoji) {
      await InteractionHelper.safeEditReply(interaction, {
        content: 'No matching emoji was found in this server.',
      });
      return;
    }

    const createdTimestamp = Math.floor(guildEmoji.createdAt.getTime() / 1000);
    const embed = createEmbed({
      title: `Emoji Info: ${guildEmoji.name}`,
      description: `Emoji ID: ${guildEmoji.id}`,
      fields: [
        { name: 'Animated', value: guildEmoji.animated ? 'Yes' : 'No', inline: true },
        { name: 'Managed', value: guildEmoji.managed ? 'Yes' : 'No', inline: true },
        { name: 'Available', value: guildEmoji.available ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: `<t:${createdTimestamp}:R>`, inline: false },
      ],
    }).setImage(guildEmoji.url);

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
  },
};
