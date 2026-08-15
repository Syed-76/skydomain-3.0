import { Events } from 'discord.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';
import AntiModService from '../services/security/antiModService.js';

export default {
  name: Events.GuildMemberUpdate,
  once: false,

  async execute(oldMember, newMember) {
    try {
      if (!newMember.guild) return;

      if (oldMember.nickname !== newMember.nickname) {
        await logEvent({
          client: newMember.client,
          guildId: newMember.guild.id,
          eventType: EVENT_TYPES.MEMBER_NAME_CHANGE,
          data: {
            title: 'Nickname changed',
            lines: [
              `**User:** ${newMember.user.toString()} (${newMember.user.tag})`,
              `**ID:** \`${newMember.user.id}\``,
              `**Before:** ${oldMember.nickname || '*(no nickname)*'}`,
              `**After:** ${newMember.nickname || '*(no nickname)*'}`,
            ],
            thumbnail: newMember.user.displayAvatarURL({ dynamic: true }),
            userId: newMember.user.id,
          }
        });

        return;
      }

      // Handle privilege escalation attempts (anti-mod logic)
      const rolesChanged = oldMember.roles.cache.size !== newMember.roles.cache.size ||
                          [...oldMember.roles.cache.keys()].some(id => !newMember.roles.cache.has(id)) ||
                          [...newMember.roles.cache.keys()].some(id => !oldMember.roles.cache.has(id));

      if (rolesChanged) {
        await AntiModService.handlePrivilegeEscalation(
          newMember.client,
          oldMember,
          newMember
        );
      }

    } catch (error) {
      logger.error('Error in guildMemberUpdate event:', error);
    }
  }
};