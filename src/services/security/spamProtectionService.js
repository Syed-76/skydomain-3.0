import { EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

class SpamProtectionService {
  constructor() {
    this.userMessages = new Map(); // Track user message patterns
    this.joinPatterns = new Map(); // Track join patterns
    this.mentionPatterns = new Map(); // Track mention patterns
  }

  static instance = new SpamProtectionService();

  /**
   * Handle message spam detection
   * @param {Client} client - Discord client
   * @param {Guild} guild - Guild object
   * @param {User} user - User who sent message
   * @param {Message} message - Message object
   */
  async handleMessageSpam(client, guild, user, message) {
    try {
      if (!guild || !user || !message) return;

      const config = await this.getConfig(guild.id);
      if (!config.enabled) return;

      const userId = user.id;
      const now = Date.now();

      // Initialize user pattern if not exists
      if (!this.userMessages.has(userId)) {
        this.userMessages.set(userId, []);
      }

      const userMsgs = this.userMessages.get(userId);
      userMsgs.push({ timestamp: now, messageId: message.id });

      // Clean old messages outside window
      const filtered = userMsgs.filter(m => now - m.timestamp < config.messageTimeWindowMs);
      this.userMessages.set(userId, filtered);

      // Check if spam threshold exceeded
      if (filtered.length > config.messageThreshold) {
        await this.triggerSpamAction(client, guild, user, 'message_spam', config);
      }

      // Check for mention spam
      if (message.mentions.size > config.mentionThreshold) {
        await this.triggerSpamAction(client, guild, user, 'mention_spam', config);
      }

    } catch (error) {
      logger.error('Error in handleMessageSpam:', error);
    }
  }

  /**
   * Handle member join spam detection
   * @param {Client} client - Discord client
   * @param {Guild} guild - Guild object
   * @param {GuildMember} member - Member who joined
   */
  async handleJoinSpam(client, guild, member) {
    try {
      if (!guild) return;

      const config = await this.getConfig(guild.id);
      if (!config.enabled) return;

      const guildId = guild.id;
      const now = Date.now();

      if (!this.joinPatterns.has(guildId)) {
        this.joinPatterns.set(guildId, []);
      }

      const joins = this.joinPatterns.get(guildId);
      joins.push({ timestamp: now, userId: member.id, username: member.user.username });

      // Clean old joins outside window
      const filtered = joins.filter(j => now - j.timestamp < config.joinTimeWindowMs);
      this.joinPatterns.set(guildId, filtered);

      // Check if join spam threshold exceeded
      if (filtered.length > config.joinThreshold) {
        await this.triggerSpamAction(client, guild, member.user, 'join_spam', config);
      }

    } catch (error) {
      logger.error('Error in handleJoinSpam:', error);
    }
  }

  /**
   * Trigger spam action (warn, mute, or kick)
   * @private
   */
  async triggerSpamAction(client, guild, user, spamType, config) {
    try {
      // Log the spam incident
      await this.logSpamIncident(client, guild, user, spamType);

      // Get member object
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member) return;

      // Apply action based on config
      if (config.autoAction === 'kick') {
        await member.kick(`[SPAM PROTECTION] ${spamType}`).catch(() => null);
      } else if (config.autoAction === 'mute') {
        const muteRole = guild.roles.cache.find(r => r.name === 'Muted');
        if (muteRole) {
          await member.roles.add(muteRole).catch(() => null);
        }
      }

      // Send alert to security channel
      if (config.alertChannelId) {
        const channel = guild.channels.cache.get(config.alertChannelId);
        if (channel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⚠️ Spam Detected')
            .addFields(
              { name: 'User', value: `${user.toString()} (${user.id})`, inline: false },
              { name: 'Spam Type', value: spamType.replace('_', ' ').toUpperCase(), inline: true },
              { name: 'Action', value: config.autoAction.toUpperCase(), inline: true },
              { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'skydomain Security Framework' });

          await channel.send({ embeds: [embed] }).catch(() => null);
        }
      }

    } catch (error) {
      logger.error('Error triggering spam action:', error);
    }
  }

  /**
   * Log spam incident to database
   * @private
   */
  async logSpamIncident(client, guild, user, spamType) {
    try {
      if (!client.db) return;

      const key = `guild:${guild.id}:spam:incidents`;
      const incidents = (await client.db.get(key)) || [];

      incidents.push({
        userId: user.id,
        username: user.username,
        spamType,
        timestamp: Date.now()
      });

      // Keep only last 100 incidents
      const recent = incidents.slice(-100);
      await client.db.set(key, recent);
    } catch (error) {
      logger.error('Error logging spam incident:', error);
    }
  }

  /**
   * Get spam protection configuration
   */
  async getConfig(guildId) {
    try {
      const key = `guild:${guildId}:spam:config`;
      
      if (typeof window !== 'undefined') {
        // Browser environment
        return window.db?.get(key) || this.getDefaultConfig();
      }

      // Get from database if available, otherwise return defaults
      if (global.client?.db) {
        const config = await global.client.db.get(key);
        return config || this.getDefaultConfig();
      }

      return this.getDefaultConfig();
    } catch (error) {
      logger.error('Error getting spam config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Save spam protection configuration
   */
  async saveConfig(guildId, config) {
    try {
      if (!global.client?.db) return false;
      
      const key = `guild:${guildId}:spam:config`;
      await global.client.db.set(key, config);
      return true;
    } catch (error) {
      logger.error('Error saving spam config:', error);
      return false;
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      enabled: false,
      alertChannelId: null,
      messageThreshold: 5,      // Messages in time window
      messageTimeWindowMs: 5000, // 5 seconds
      mentionThreshold: 5,       // Mentions per message
      joinThreshold: 10,         // Joins in time window
      joinTimeWindowMs: 30000,   // 30 seconds
      autoAction: 'warn'         // warn, mute, or kick
    };
  }

  /**
   * Get spam incidents for a guild
   */
  async getIncidents(guildId, limit = 50) {
    try {
      if (!global.client?.db) return [];
      
      const key = `guild:${guildId}:spam:incidents`;
      const incidents = (await global.client.db.get(key)) || [];
      return incidents.slice(-limit);
    } catch (error) {
      logger.error('Error getting spam incidents:', error);
      return [];
    }
  }

  /**
   * Clear spam history for a user
   */
  async clearUserHistory(guildId, userId) {
    try {
      this.userMessages.delete(userId);
      
      if (!global.client?.db) return true;
      
      const key = `guild:${guildId}:spam:incidents`;
      const incidents = (await global.client.db.get(key)) || [];
      const filtered = incidents.filter(i => i.userId !== userId);
      await global.client.db.set(key, filtered);
      return true;
    } catch (error) {
      logger.error('Error clearing user spam history:', error);
      return false;
    }
  }
}

export default SpamProtectionService.instance;
