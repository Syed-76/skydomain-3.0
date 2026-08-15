import { EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

class WordFilterService {
  constructor() {
    this.filters = new Map(); // Per-guild word filters
  }

  static instance = new WordFilterService();

  /**
   * Check message for filtered content
   * @param {Client} client - Discord client
   * @param {Guild} guild - Guild object
   * @param {User} user - User who sent message
   * @param {Message} message - Message object
   */
  async handleMessageFilter(client, guild, user, message) {
    try {
      if (!guild || !user || !message || !message.content) return;

      const config = await this.getConfig(guild.id);
      if (!config.enabled) return;

      const content = message.content.toLowerCase();
      const filterResults = this.checkContent(content, guild.id);

      if (filterResults.blocked) {
        await this.handleFilterViolation(client, guild, user, message, filterResults, config);
      }

    } catch (error) {
      logger.error('Error in handleMessageFilter:', error);
    }
  }

  /**
   * Check content against filters
   * @private
   */
  checkContent(content, guildId) {
    try {
      const filters = this.filters.get(guildId) || [];
      const violations = [];

      for (const filter of filters) {
        const regex = new RegExp(filter.pattern, 'gi');
        const matches = content.match(regex);

        if (matches) {
          violations.push({
            filter: filter.name,
            matches: matches.length,
            severity: filter.severity || 'medium'
          });
        }
      }

      return {
        blocked: violations.length > 0,
        violations
      };
    } catch (error) {
      logger.error('Error checking content:', error);
      return { blocked: false, violations: [] };
    }
  }

  /**
   * Handle filter violation
   * @private
   */
  async handleFilterViolation(client, guild, user, message, results, config) {
    try {
      // Delete message
      if (config.autoDelete) {
        await message.delete().catch(() => null);
      }

      // Log violation
      await this.logViolation(client, guild, user, results);

      // Apply action
      if (config.autoAction === 'mute') {
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (member) {
          const muteRole = guild.roles.cache.find(r => r.name === 'Muted');
          if (muteRole) {
            await member.roles.add(muteRole).catch(() => null);
          }
        }
      } else if (config.autoAction === 'warn') {
        // Send warning DM
        await user.send({
          embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('⚠️ Message Removed')
            .setDescription(`Your message in **${guild.name}** was removed for containing prohibited content.`)
            .addFields({ name: 'Violations', value: results.violations.map(v => `• ${v.filter}`).join('\n'), inline: false })
          ]
        }).catch(() => null);
      }

      // Send alert to moderation channel
      if (config.alertChannelId) {
        const channel = guild.channels.cache.get(config.alertChannelId);
        if (channel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🚫 Content Filter Violation')
            .addFields(
              { name: 'User', value: `${user.toString()} (${user.id})`, inline: false },
              { name: 'Violations', value: results.violations.map(v => `• ${v.filter}`).join('\n') || 'Unknown', inline: false },
              { name: 'Original Message', value: `\`\`\`${message.content.substring(0, 100)}\`\`\`` || 'N/A', inline: false },
              { name: 'Action', value: config.autoAction.toUpperCase(), inline: true }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'skydomain Content Filter' });

          await channel.send({ embeds: [embed] }).catch(() => null);
        }
      }

    } catch (error) {
      logger.error('Error handling filter violation:', error);
    }
  }

  /**
   * Log filter violation
   * @private
   */
  async logViolation(client, guild, user, results) {
    try {
      if (!client.db) return;

      const key = `guild:${guild.id}:filter:violations`;
      const violations = (await client.db.get(key)) || [];

      violations.push({
        userId: user.id,
        username: user.username,
        violations: results.violations,
        timestamp: Date.now()
      });

      // Keep only last 100 violations
      const recent = violations.slice(-100);
      await client.db.set(key, recent);
    } catch (error) {
      logger.error('Error logging filter violation:', error);
    }
  }

  /**
   * Add filter to guild
   */
  async addFilter(guildId, name, pattern, severity = 'medium') {
    try {
      if (!global.client?.db) return false;

      const key = `guild:${guildId}:filter:list`;
      const filters = (await global.client.db.get(key)) || [];

      // Prevent duplicates
      if (filters.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        return false;
      }

      filters.push({
        id: Date.now().toString(),
        name,
        pattern: this.escapeRegex(pattern),
        severity,
        createdAt: Date.now()
      });

      await global.client.db.set(key, filters);
      
      // Update cache
      this.filters.set(guildId, filters);
      return true;
    } catch (error) {
      logger.error('Error adding filter:', error);
      return false;
    }
  }

  /**
   * Remove filter from guild
   */
  async removeFilter(guildId, filterId) {
    try {
      if (!global.client?.db) return false;

      const key = `guild:${guildId}:filter:list`;
      const filters = (await global.client.db.get(key)) || [];
      const filtered = filters.filter(f => f.id !== filterId);

      await global.client.db.set(key, filtered);
      this.filters.set(guildId, filtered);
      return true;
    } catch (error) {
      logger.error('Error removing filter:', error);
      return false;
    }
  }

  /**
   * Get all filters for guild
   */
  async getFilters(guildId) {
    try {
      if (!global.client?.db) return [];

      const key = `guild:${guildId}:filter:list`;
      const filters = (await global.client.db.get(key)) || [];
      this.filters.set(guildId, filters);
      return filters;
    } catch (error) {
      logger.error('Error getting filters:', error);
      return [];
    }
  }

  /**
   * Get configuration
   */
  async getConfig(guildId) {
    try {
      if (!global.client?.db) return this.getDefaultConfig();

      const key = `guild:${guildId}:filter:config`;
      const config = await global.client.db.get(key);
      return config || this.getDefaultConfig();
    } catch (error) {
      logger.error('Error getting filter config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Save configuration
   */
  async saveConfig(guildId, config) {
    try {
      if (!global.client?.db) return false;

      const key = `guild:${guildId}:filter:config`;
      await global.client.db.set(key, config);
      return true;
    } catch (error) {
      logger.error('Error saving filter config:', error);
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
      autoDelete: true,
      autoAction: 'warn' // warn or mute
    };
  }

  /**
   * Escape regex special characters
   * @private
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get filter violations
   */
  async getViolations(guildId, limit = 50) {
    try {
      if (!global.client?.db) return [];

      const key = `guild:${guildId}:filter:violations`;
      const violations = (await global.client.db.get(key)) || [];
      return violations.slice(-limit);
    } catch (error) {
      logger.error('Error getting violations:', error);
      return [];
    }
  }
}

export default WordFilterService.instance;
