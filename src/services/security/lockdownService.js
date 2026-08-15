import { PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { logger } from '../../utils/logger.js';

class LockdownService {
  /**
   * Enable lockdown mode for guild
   * @param {Client} client - Discord client
   * @param {Guild} guild - Guild object
   * @param {User} moderator - Moderator enabling lockdown
   * @param {string} reason - Reason for lockdown
   */
  static async enableLockdown(client, guild, moderator, reason = 'Emergency lockdown') {
    try {
      if (!guild) return false;

      const config = await this.getLockdownConfig(client, guild.id);
      if (config.enabled) return false; // Already locked down

      // Store original permissions
      const originalPerms = new Map();

      // Lock all text channels
      for (const channel of guild.channels.cache.values()) {
        if (channel.type === ChannelType.GuildText) {
          // Store original permissions
          originalPerms.set(channel.id, {
            name: channel.name,
            perms: Array.from(channel.permissionOverwrites.cache.values())
          });

          // Remove send message permission from @everyone
          const everyone = guild.roles.everyone;
          await channel.permissionOverwrites.set([
            {
              id: everyone.id,
              deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
            },
            ...channel.permissionOverwrites.cache.values()
          ]).catch(err => logger.warn(`Failed to lock channel ${channel.name}:`, err.message));
        }
      }

      // Save lockdown config
      config.enabled = true;
      config.enabledAt = Date.now();
      config.enabledBy = moderator?.id;
      config.reason = reason;
      config.originalPermissions = Object.fromEntries(originalPerms);

      await this.saveLockdownConfig(client, guild.id, config);

      // Send lockdown announcement
      await this.sendLockdownEmbed(guild, 'enabled', reason, moderator);

      // Log action
      await this.logLockdownAction(client, guild, 'lockdown_enabled', moderator, reason);

      logger.info(`Guild ${guild.name} locked down by ${moderator?.user.tag}`);
      return true;
    } catch (error) {
      logger.error('Error enabling lockdown:', error);
      return false;
    }
  }

  /**
   * Disable lockdown mode for guild
   * @param {Client} client - Discord client
   * @param {Guild} guild - Guild object
   * @param {User} moderator - Moderator disabling lockdown
   */
  static async disableLockdown(client, guild, moderator) {
    try {
      if (!guild) return false;

      const config = await this.getLockdownConfig(client, guild.id);
      if (!config.enabled) return false; // Not locked down

      // Restore original permissions
      for (const [channelId, permData] of Object.entries(config.originalPermissions || {})) {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
          try {
            await channel.permissionOverwrites.set(permData.perms || [])
              .catch(() => null);
          } catch (err) {
            logger.warn(`Failed to restore permissions for ${permData.name}:`, err.message);
          }
        }
      }

      // Update config
      config.enabled = false;
      config.disabledAt = Date.now();
      config.disabledBy = moderator?.id;
      config.originalPermissions = {};

      await this.saveLockdownConfig(client, guild.id, config);

      // Send lockdown end announcement
      await this.sendLockdownEmbed(guild, 'disabled', '', moderator);

      // Log action
      await this.logLockdownAction(client, guild, 'lockdown_disabled', moderator);

      logger.info(`Guild ${guild.name} unlocked by ${moderator?.user.tag}`);
      return true;
    } catch (error) {
      logger.error('Error disabling lockdown:', error);
      return false;
    }
  }

  /**
   * Check if guild is in lockdown
   */
  static async isLockedDown(client, guildId) {
    try {
      const config = await this.getLockdownConfig(client, guildId);
      return config.enabled;
    } catch (error) {
      logger.error('Error checking lockdown status:', error);
      return false;
    }
  }

  /**
   * Get lockdown configuration
   */
  static async getLockdownConfig(client, guildId) {
    try {
      if (!client.db) return this.getDefaultLockdownConfig();

      const key = `guild:${guildId}:lockdown:config`;
      const config = await client.db.get(key);
      return config || this.getDefaultLockdownConfig();
    } catch (error) {
      logger.error('Error getting lockdown config:', error);
      return this.getDefaultLockdownConfig();
    }
  }

  /**
   * Save lockdown configuration
   */
  static async saveLockdownConfig(client, guildId, config) {
    try {
      if (!client.db) return false;

      const key = `guild:${guildId}:lockdown:config`;
      await client.db.set(key, config);
      return true;
    } catch (error) {
      logger.error('Error saving lockdown config:', error);
      return false;
    }
  }

  /**
   * Get default lockdown configuration
   */
  static getDefaultLockdownConfig() {
    return {
      enabled: false,
      enabledAt: null,
      enabledBy: null,
      disabledAt: null,
      disabledBy: null,
      reason: null,
      originalPermissions: {}
    };
  }

  /**
   * Send lockdown embed to all channels
   * @private
   */
  static async sendLockdownEmbed(guild, action, reason, moderator) {
    try {
      const embed = new EmbedBuilder();

      if (action === 'enabled') {
        embed
          .setColor('#FF0000')
          .setTitle('🔒 SERVER LOCKDOWN ENABLED')
          .setDescription('The server is now in emergency lockdown mode.')
          .addFields(
            { name: 'Reason', value: reason || 'No reason provided', inline: false },
            { name: 'Initiated By', value: moderator?.toString() || 'System', inline: true },
            { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
            { name: '⚠️ Important', value: 'Members cannot send messages. Only moderators can interact.', inline: false }
          )
          .setThumbnail(guild.iconURL({ dynamic: true }));
      } else {
        embed
          .setColor('#00FF00')
          .setTitle('🔓 SERVER LOCKDOWN DISABLED')
          .setDescription('The server lockdown has been lifted. Normal operations resumed.')
          .addFields(
            { name: 'Lifted By', value: moderator?.toString() || 'System', inline: true },
            { name: 'Time', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
          )
          .setThumbnail(guild.iconURL({ dynamic: true }));
      }

      // Send to first available channel
      const announceChannel = guild.channels.cache.find(ch =>
        ch.type === ChannelType.GuildText && ch.permissionsFor(guild.client.user).has('SendMessages')
      );

      if (announceChannel) {
        await announceChannel.send({ embeds: [embed] }).catch(() => null);
      }
    } catch (error) {
      logger.error('Error sending lockdown embed:', error);
    }
  }

  /**
   * Log lockdown action
   * @private
   */
  static async logLockdownAction(client, guild, action, moderator, reason = '') {
    try {
      if (!client.db) return;

      const key = `guild:${guild.id}:lockdown:audit`;
      const log = (await client.db.get(key)) || [];

      log.push({
        action,
        moderatorId: moderator?.id,
        moderatorTag: moderator?.user.tag,
        reason,
        timestamp: Date.now()
      });

      // Keep last 100 entries
      const recent = log.slice(-100);
      await client.db.set(key, recent);
    } catch (error) {
      logger.error('Error logging lockdown action:', error);
    }
  }

  /**
   * Get lockdown history
   */
  static async getLockdownHistory(client, guildId, limit = 20) {
    try {
      if (!client.db) return [];

      const key = `guild:${guildId}:lockdown:audit`;
      const log = (await client.db.get(key)) || [];
      return log.slice(-limit).reverse();
    } catch (error) {
      logger.error('Error getting lockdown history:', error);
      return [];
    }
  }

  /**
   * Get lockdown status embed
   */
  static async getStatusEmbed(client, guild) {
    try {
      const config = await this.getLockdownConfig(client, guild.id);
      const history = await this.getLockdownHistory(client, guild.id, 5);

      const embed = new EmbedBuilder()
        .setColor(config.enabled ? '#FF0000' : '#00FF00')
        .setTitle('🔐 Lockdown Status')
        .addFields(
          { name: 'Status', value: config.enabled ? '🔴 LOCKDOWN ACTIVE' : '🟢 NORMAL OPERATIONS', inline: false },
          { name: 'Enabled At', value: config.enabledAt ? `<t:${Math.floor(config.enabledAt / 1000)}:R>` : 'Never', inline: true },
          { name: 'Enabled By', value: config.enabledBy ? `<@${config.enabledBy}>` : 'N/A', inline: true }
        )
        .setFooter({ text: 'skydomain Security - Lockdown System' });

      if (config.reason) {
        embed.addFields({ name: 'Current Reason', value: config.reason, inline: false });
      }

      if (history.length > 0) {
        const historyText = history
          .map(h => `• ${h.action === 'lockdown_enabled' ? '🔒 Locked' : '🔓 Unlocked'} - ${h.moderatorTag || 'System'} - <t:${Math.floor(h.timestamp / 1000)}:R>`)
          .join('\n');

        embed.addFields({ name: 'Recent History', value: historyText, inline: false });
      }

      return embed;
    } catch (error) {
      logger.error('Error generating status embed:', error);
      return null;
    }
  }
}

export default LockdownService;
