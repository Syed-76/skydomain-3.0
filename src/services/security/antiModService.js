import { PermissionFlagsBits } from 'discord.js';
import { logger } from '../../utils/logger.js';
import AntiNukeService from './antiNukeService.js';

const HIGH_RISK_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ManageWebhooks,
  PermissionFlagsBits.ManageEvents,
];

export class AntiModService {
  static async handlePrivilegeEscalation(client, oldMember, newMember) {
    if (!client || !oldMember || !newMember || !newMember.guild) {
      return false;
    }

    const guild = newMember.guild;
    const config = await AntiNukeService.getConfig(client, guild.id);
    if (!config.enabled) {
      return false;
    }

    const addedRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));
    const riskyRoles = addedRoles.filter((role) => {
      if (!role.permissions) {
        return false;
      }
      return HIGH_RISK_PERMISSIONS.some((bit) => role.permissions.has(bit));
    });

    if (riskyRoles.size === 0) {
      return false;
    }

    const isOwner = guild.ownerId === newMember.id;
    const isTrusted = (config.trustedUsers || []).includes(newMember.id);
    if (isOwner || isTrusted) {
      return false;
    }

    try {
      await newMember.roles.remove([...riskyRoles.keys()]);
      await AntiNukeService.notify(client, guild, {
        title: 'Privileged Role Removal Triggered',
        description: 'A high-risk permission role was assigned and automatically stripped before takeover behavior could continue.',
        details: [
          `User: ${newMember.user.tag} (${newMember.id})`,
          `Removed roles: ${[...riskyRoles.values()].map((role) => role.name).join(', ')}`,
          'Action: role rollback and alert sent',
        ],
      });
      return true;
    } catch (error) {
      logger.warn(`Anti-mod guard failed for user ${newMember.id} in guild ${guild.id}:`, error);
      return false;
    }
  }
}

export default AntiModService;
