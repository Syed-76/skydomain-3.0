import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { logger } from '../../utils/logger.js';

const SECURITY_STATE = new Map();

const DEFAULT_CONFIG = {
  enabled: true,
  alertChannelId: null,
  managerRoles: [],
  trustedUsers: [],
  thresholds: {
    roleCreates: 3,
    roleDeletes: 2,
    channelDeletes: 2,
    bans: 3,
    windowMs: 30000,
  },
};

function getGuildState(guildId) {
  if (!SECURITY_STATE.has(guildId)) {
    SECURITY_STATE.set(guildId, {
      events: [],
      roleCreates: [],
      roleDeletes: [],
      channelDeletes: [],
      bans: [],
    });
  }
  return SECURITY_STATE.get(guildId);
}

function pruneOldEvents(events, windowMs) {
  const cutoff = Date.now() - windowMs;
  return events.filter((time) => time > cutoff);
}

function buildAlertEmbed({ guild, title, description, details = [] }) {
  const embed = new EmbedBuilder()
    .setTitle(`🚨 ${title}`)
    .setColor('#ED4245')
    .setDescription(description)
    .setTimestamp();

  if (guild) {
    embed.addFields({ name: 'Guild', value: `${guild.name} (${guild.id})`, inline: false });
  }

  if (details.length > 0) {
    const lines = details.slice(0, 6).map((item) => `• ${item}`);
    embed.addFields({ name: 'Details', value: lines.join('\n'), inline: false });
  }

  return embed;
}

export class AntiNukeService {
  static async getConfig(client, guildId) {
    const base = { ...DEFAULT_CONFIG };
    if (!guildId || !client?.db) {
      return base;
    }

    try {
      const saved = await client.db.get(`guild:${guildId}:security`);
      return { ...base, ...(saved || {}) };
    } catch (error) {
      logger.warn(`Unable to load anti-nuke config for guild ${guildId}:`, error);
      return base;
    }
  }

  static async saveConfig(client, guildId, config) {
    if (!guildId || !client?.db) {
      return false;
    }

    try {
      await client.db.set(`guild:${guildId}:security`, config);
      return true;
    } catch (error) {
      logger.error(`Unable to save anti-nuke config for guild ${guildId}:`, error);
      return false;
    }
  }

  static async setGuildProtection(client, guildId, enabled) {
    const config = await this.getConfig(client, guildId);
    config.enabled = enabled;
    await this.saveConfig(client, guildId, config);
    return enabled;
  }

  static async setAlertChannel(client, guildId, channelId) {
    const config = await this.getConfig(client, guildId);
    config.alertChannelId = channelId || null;
    await this.saveConfig(client, guildId, config);
    return config;
  }

  static async notify(client, guild, { title, description, details = [] }) {
    const config = await this.getConfig(client, guild?.id);
    if (!guild || !config.enabled) {
      return false;
    }

    const channelId = config.alertChannelId;
    if (!channelId) {
      return false;
    }

    try {
      const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        return false;
      }
      await channel.send({ embeds: [buildAlertEmbed({ guild, title, description, details })] });
      return true;
    } catch (error) {
      logger.error(`Failed to send anti-nuke alert for guild ${guild?.id}:`, error);
      return false;
    }
  }

  static async handleRoleMutation(client, guild, actorUserId, targetRoleId, actionLabel) {
    if (!guild) {
      return false;
    }

    const config = await this.getConfig(client, guild.id);
    if (!config.enabled) {
      return false;
    }

    const state = getGuildState(guild.id);
    const now = Date.now();
    const thresholds = config.thresholds || DEFAULT_CONFIG.thresholds;
    const windowMs = thresholds.windowMs || DEFAULT_CONFIG.thresholds.windowMs;

    if (actionLabel === 'role_create') {
      state.roleCreates = pruneOldEvents(state.roleCreates, windowMs);
      state.roleCreates.push(now);
      if (state.roleCreates.length >= thresholds.roleCreates) {
        await this.notify(client, guild, {
          title: 'Possible Role Nuke Detected',
          description: 'Multiple roles were created in a very short time window.',
          details: [
            `Actor: ${actorUserId || 'unknown'}`,
            `Detected role creations: ${state.roleCreates.length}`,
            'Action: automatic review required',
          ],
        });
        state.roleCreates = [];
        return true;
      }
    }

    if (actionLabel === 'role_delete') {
      state.roleDeletes = pruneOldEvents(state.roleDeletes, windowMs);
      state.roleDeletes.push(now);
      if (state.roleDeletes.length >= thresholds.roleDeletes) {
        await this.notify(client, guild, {
          title: 'Possible Role Removal Attack',
          description: 'Several roles were deleted in a short burst.',
          details: [
            `Actor: ${actorUserId || 'unknown'}`,
            `Detected role deletions: ${state.roleDeletes.length}`,
            `Target role: ${targetRoleId || 'unknown'}`,
          ],
        });
        state.roleDeletes = [];
        return true;
      }
    }

    return false;
  }

  static async handleChannelMutation(client, guild, targetChannelId, actionLabel) {
    if (!guild) {
      return false;
    }

    const config = await this.getConfig(client, guild.id);
    if (!config.enabled) {
      return false;
    }

    const state = getGuildState(guild.id);
    const now = Date.now();
    const thresholds = config.thresholds || DEFAULT_CONFIG.thresholds;
    const windowMs = thresholds.windowMs || DEFAULT_CONFIG.thresholds.windowMs;

    state.channelDeletes = pruneOldEvents(state.channelDeletes, windowMs);
    state.channelDeletes.push(now);

    if (state.channelDeletes.length >= thresholds.channelDeletes) {
      await this.notify(client, guild, {
        title: 'Possible Channel Nuke Detected',
        description: 'Too many channels were deleted in a short period.',
        details: [
          `Target channel: ${targetChannelId || 'unknown'}`,
          `Deletion count: ${state.channelDeletes.length}`,
          'Critical event: check permissions and recent admin actions',
        ],
      });
      state.channelDeletes = [];
      return true;
    }

    return false;
  }

  static async handleMassBan(client, guild, actorUserId, userId, reason) {
    if (!guild) {
      return false;
    }

    const config = await this.getConfig(client, guild.id);
    if (!config.enabled) {
      return false;
    }

    const state = getGuildState(guild.id);
    const now = Date.now();
    const thresholds = config.thresholds || DEFAULT_CONFIG.thresholds;
    const windowMs = thresholds.windowMs || DEFAULT_CONFIG.thresholds.windowMs;

    state.bans = pruneOldEvents(state.bans, windowMs);
    state.bans.push(now);

    if (state.bans.length >= thresholds.bans) {
      await this.notify(client, guild, {
        title: 'Possible Ban Nuke Detected',
        description: 'A suspicious burst of bans was recorded in a short time window.',
        details: [
          `Actor: ${actorUserId || 'unknown'}`,
          `Target: ${userId || 'unknown'}`,
          `Ban count: ${state.bans.length}`,
          `Reason: ${reason || 'Not provided'}`,
        ],
      });
      state.bans = [];
      return true;
    }

    return false;
  }
}

export default AntiNukeService;
