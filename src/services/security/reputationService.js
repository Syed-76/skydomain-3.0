import { EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

class ReputationService {
  /**
   * Add warning to member
   * @param {Client} client - Discord client
   * @param {Guild} guild - Guild object
   * @param {User} user - User being warned
   * @param {string} reason - Warning reason
   * @param {User} moderator - Moderator issuing warning
   */
  static async addWarning(client, guild, user, reason, moderator) {
    try {
      if (!client.db || !guild || !user) return null;

      const key = `guild:${guild.id}:reputation:${user.id}`;
      const record = (await client.db.get(key)) || {
        userId: user.id,
        username: user.username,
        warnings: [],
        reputation: 100,
        trustLevel: 'normal',
        createdAt: Date.now()
      };

      record.warnings.push({
        id: Date.now().toString(),
        reason,
        moderatorId: moderator?.id,
        moderatorTag: moderator?.user.tag,
        timestamp: Date.now(),
        active: true
      });

      // Calculate new reputation (each warning = -10 points)
      const activeWarnings = record.warnings.filter(w => w.active).length;
      record.reputation = Math.max(0, 100 - (activeWarnings * 10));

      // Update trust level
      record.trustLevel = this.calculateTrustLevel(record.reputation, activeWarnings);

      await client.db.set(key, record);

      // Log to audit
      await this.logAction(client, guild, {
        action: 'warning_added',
        targetId: user.id,
        moderatorId: moderator?.id,
        reason
      });

      return record;
    } catch (error) {
      logger.error('Error adding warning:', error);
      return null;
    }
  }

  /**
   * Remove warning from member
   * @param {Client} client - Discord client
   * @param {Guild} guild - Guild object
   * @param {User} user - User whose warning is removed
   * @param {string} warningId - Warning ID to remove
   * @param {User} moderator - Moderator removing warning
   */
  static async removeWarning(client, guild, user, warningId, moderator) {
    try {
      if (!client.db || !guild || !user) return false;

      const key = `guild:${guild.id}:reputation:${user.id}`;
      const record = await client.db.get(key);

      if (!record) return false;

      const warning = record.warnings.find(w => w.id === warningId);
      if (!warning) return false;

      warning.active = false;
      warning.removedBy = moderator?.id;
      warning.removedAt = Date.now();

      // Recalculate reputation
      const activeWarnings = record.warnings.filter(w => w.active).length;
      record.reputation = Math.max(0, 100 - (activeWarnings * 10));
      record.trustLevel = this.calculateTrustLevel(record.reputation, activeWarnings);

      await client.db.set(key, record);

      // Log to audit
      await this.logAction(client, guild, {
        action: 'warning_removed',
        targetId: user.id,
        moderatorId: moderator?.id,
        warningId
      });

      return true;
    } catch (error) {
      logger.error('Error removing warning:', error);
      return false;
    }
  }

  /**
   * Get member reputation record
   */
  static async getRecord(client, guild, user) {
    try {
      if (!client.db || !guild || !user) return null;

      const key = `guild:${guild.id}:reputation:${user.id}`;
      const record = await client.db.get(key);

      return record || {
        userId: user.id,
        username: user.username,
        warnings: [],
        reputation: 100,
        trustLevel: 'trusted',
        createdAt: Date.now()
      };
    } catch (error) {
      logger.error('Error getting reputation record:', error);
      return null;
    }
  }

  /**
   * Get member reputation score
   */
  static async getReputation(client, guild, user) {
    try {
      const record = await this.getRecord(client, guild, user);
      return record?.reputation || 100;
    } catch (error) {
      logger.error('Error getting reputation:', error);
      return 100;
    }
  }

  /**
   * Get member trust level
   */
  static async getTrustLevel(client, guild, user) {
    try {
      const record = await this.getRecord(client, guild, user);
      return record?.trustLevel || 'normal';
    } catch (error) {
      logger.error('Error getting trust level:', error);
      return 'normal';
    }
  }

  /**
   * Boost reputation (positive action)
   */
  static async boostReputation(client, guild, user, amount = 5) {
    try {
      if (!client.db || !guild || !user) return false;

      const key = `guild:${guild.id}:reputation:${user.id}`;
      const record = await client.db.get(key);

      if (record) {
        record.reputation = Math.min(100, record.reputation + amount);
        const activeWarnings = record.warnings.filter(w => w.active).length;
        record.trustLevel = this.calculateTrustLevel(record.reputation, activeWarnings);
        await client.db.set(key, record);
      }

      return true;
    } catch (error) {
      logger.error('Error boosting reputation:', error);
      return false;
    }
  }

  /**
   * Get all members with low reputation
   */
  static async getLowReputationMembers(client, guildId, threshold = 50) {
    try {
      if (!client.db) return [];

      const members = [];
      const keyPrefix = `guild:${guildId}:reputation:`;

      // This is a simplified approach - in production, use proper database queries
      // For now, return empty array and let guilds check individual members
      return members;
    } catch (error) {
      logger.error('Error getting low reputation members:', error);
      return [];
    }
  }

  /**
   * Clear all warnings for a member
   */
  static async clearWarnings(client, guild, user, moderator) {
    try {
      if (!client.db || !guild || !user) return false;

      const key = `guild:${guild.id}:reputation:${user.id}`;
      const record = await client.db.get(key);

      if (!record) return false;

      // Mark all warnings as inactive
      record.warnings.forEach(w => {
        w.active = false;
        w.clearedAt = Date.now();
        w.clearedBy = moderator?.id;
      });

      record.reputation = 100;
      record.trustLevel = 'normal';

      await client.db.set(key, record);

      // Log to audit
      await this.logAction(client, guild, {
        action: 'warnings_cleared',
        targetId: user.id,
        moderatorId: moderator?.id
      });

      return true;
    } catch (error) {
      logger.error('Error clearing warnings:', error);
      return false;
    }
  }

  /**
   * Calculate trust level based on reputation
   * @private
   */
  static calculateTrustLevel(reputation, warningCount) {
    if (reputation >= 90 && warningCount === 0) return 'trusted';
    if (reputation >= 70) return 'normal';
    if (reputation >= 40) return 'cautious';
    return 'dangerous';
  }

  /**
   * Log action to audit log
   * @private
   */
  static async logAction(client, guild, data) {
    try {
      if (!client.db) return;

      const key = `guild:${guild.id}:reputation:audit`;
      const log = (await client.db.get(key)) || [];

      log.push({
        ...data,
        timestamp: Date.now()
      });

      // Keep last 500 entries
      const recent = log.slice(-500);
      await client.db.set(key, recent);
    } catch (error) {
      logger.error('Error logging action:', error);
    }
  }

  /**
   * Get audit log
   */
  static async getAuditLog(client, guildId, limit = 50) {
    try {
      if (!client.db) return [];

      const key = `guild:${guildId}:reputation:audit`;
      const log = (await client.db.get(key)) || [];
      return log.slice(-limit).reverse();
    } catch (error) {
      logger.error('Error getting audit log:', error);
      return [];
    }
  }

  /**
   * Generate reputation report embed
   */
  static async generateReportEmbed(client, guild, user) {
    try {
      const record = await this.getRecord(client, guild, user);

      const embed = new EmbedBuilder()
        .setColor(this.getTrustLevelColor(record.trustLevel))
        .setTitle(`📊 Reputation Report: ${user.username}`)
        .addFields(
          { name: 'Reputation Score', value: `${record.reputation}/100`, inline: true },
          { name: 'Trust Level', value: record.trustLevel.toUpperCase(), inline: true },
          { name: 'Total Warnings', value: record.warnings.length.toString(), inline: true },
          { name: 'Active Warnings', value: record.warnings.filter(w => w.active).length.toString(), inline: true },
          { name: 'Member Since', value: `<t:${Math.floor(record.createdAt / 1000)}:R>`, inline: false }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'skydomain Reputation System' });

      // Add warnings if any
      if (record.warnings.length > 0) {
        const activeWarnings = record.warnings.filter(w => w.active);
        if (activeWarnings.length > 0) {
          const warningList = activeWarnings
            .slice(-5)
            .map(w => `• ${w.reason} - <t:${Math.floor(w.timestamp / 1000)}:R>`)
            .join('\n');

          embed.addFields({
            name: 'Recent Warnings',
            value: warningList,
            inline: false
          });
        }
      }

      return embed;
    } catch (error) {
      logger.error('Error generating report embed:', error);
      return null;
    }
  }

  /**
   * Get trust level color
   * @private
   */
  static getTrustLevelColor(level) {
    const colors = {
      trusted: '#00FF00',
      normal: '#0099FF',
      cautious: '#FFAA00',
      dangerous: '#FF0000'
    };
    return colors[level] || '#0099FF';
  }
}

export default ReputationService;
