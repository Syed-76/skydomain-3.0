import { SlashCommandBuilder } from 'discord.js';
import { withErrorHandling } from '../../utils/errorHandler.js';
import EconomyService from '../../services/economyService.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { successEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim your daily reward'),

  category: 'Economy',

  execute: withErrorHandling(async (interaction, config, client) => {
    const deferred = await InteractionHelper.safeDefer(interaction);
    if (!deferred) return;

    const result = await EconomyService.claimDaily(client, interaction.guildId, interaction.user.id);

    const embed = successEmbed('Daily Claimed', `You received **$${result.earned.toLocaleString()}**. Next claim: <t:${Math.floor(result.nextClaimTime.getTime() / 1000)}:R>`);
    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
  }, { command: 'claim' })
};
