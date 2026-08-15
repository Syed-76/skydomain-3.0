import { Events } from 'discord.js';
import { logEvent, EVENT_TYPES } from '../services/loggingService.js';
import { logger } from '../utils/logger.js';
import { buildRoleAuditLines } from '../utils/logging/logEmbeds.js';
import AntiNukeService from '../services/security/antiNukeService.js';

export default {
  name: Events.GuildRoleCreate,
  once: false,

  async execute(role) {
    try {
      if (!role.guild) return;

      // Trigger anti-nuke monitoring for role creation
      await AntiNukeService.handleRoleMutation(
        role.client,
        role.guild,
        role.createdBy?.id || null,
        role.id,
        'role_create'
      );

      const lines = buildRoleAuditLines(role);

      await logEvent({
        client: role.client,
        guildId: role.guild.id,
        eventType: EVENT_TYPES.ROLE_CREATE,
        data: {
          title: 'Role Created',
          headline: `${role.toString()} was created`,
          lines,
        },
      });

    } catch (error) {
      logger.error('Error in roleCreate event:', error);
    }
  }
};