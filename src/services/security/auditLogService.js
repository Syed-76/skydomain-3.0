import { EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

class AuditLogService {
  /**
   * Log security event
   * @param {Client} client - Discord client
   * @param {Guild} guild - Guild object
   * @param {Object} event - Event details
   */
  static async logEvent(client, guild, event) {
    try {
      if (!client.db || !guild) return null;

      const key = `guild:${guild.id}:audit:events`;
      const events = (await client.db.get(key)) || [];

      const logEntry = {
        id: Date.now().toString(),
        type: event.type,
        action: event.action,
        targetId: event.targetId,
        targetType: event.targetType, // user, role, channel
        actorId: event.actorId,
        reason: event.reason,
        details: event.details || {},
        timestamp: Date.now(),
        severity: event.severity || 'info' // info, warning, critical
      };

      events.push(logEntry);

      // Keep last 500 events
      const recent = events.slice(-500);
      await client.db.set(key, recent);

      // Send to audit log channel if configured
      await this.sendToAuditChannel(client, guild, logEntry);

      return logEntry;
    } catch (error) {
      logger.error('Error logging audit event:', error);
      return null;
    }
  }

  /**
   * Log security alert
   */
  static async logAlert(client, guild, alert) {
    try {
      if (!client.db || !guild) return null;

      const key = `guild:${guild.id}:audit:alerts`;
      const alerts = (await client.db.get(key)) || [];

      const alertEntry = {
        id: Date.now().toString(),
        type: alert.type,
        severity: alert.severity || 'warning',
        title: alert.title,
        description: alert.description,
        affectedUsers: alert.affectedUsers || [],
        details: alert.details || {},
        timestamp: Date.now(),
        resolved: false
      };

      alerts.push(alertEntry);

      // Keep last 200 alerts
      const recent = alerts.slice(-200);
      await client.db.set(key, recent);

      // Notify administrators
      await this.notifyAdministrators(client, guild, alertEntry);

      return alertEntry;
    } catch (error) {
      logger.error('Error logging alert:', error);
      return null;
    }
  }

  /**
   * Get audit log events
   */
  static async getEvents(client, guildId, filter = {}, limit = 50) {
    try {
      if (!client.db) return [];

      const key = `guild:${guildId}:audit:events`;
      const events = (await client.db.get(key)) || [];

      let filtered = events;

      // Apply filters
      if (filter.type) {
        filtered = filtered.filter(e => e.type === filter.type);
      }
      if (filter.severity) {
        filtered = filtered.filter(e => e.severity === filter.severity);
      }
      if (filter.targetId) {
        filtered = filtered.filter(e => e.targetId === filter.targetId);
      }
      if (filter.actorId) {
        filtered = filtered.filter(e => e.actorId === filter.actorId);
      }
      if (filter.action) {
        filtered = filtered.filter(e => e.action === filter.action);
      }

      return filtered.slice(-limit).reverse();
    } catch (error) {
      logger.error('Error getting audit events:', error);
      return [];
    }
  }

  /**
   * Get security alerts
   */
  static async getAlerts(client, guildId, filter = {}, limit = 30) {
    try {
      if (!client.db) return [];

      const key = `guild:${guildId}:audit:alerts`;
      const alerts = (await client.db.get(key)) || [];

      let filtered = alerts;

      if (filter.severity) {
        filtered = filtered.filter(a => a.severity === filter.severity);
      }
      if (filter.type) {
        filtered = filtered.filter(a => a.type === filter.type);
      }
      if (filter.resolved !== undefined) {
        filtered = filtered.filter(a => a.resolved === filter.resolved);
      }

      return filtered.slice(-limit).reverse();
    } catch (error) {
      logger.error('Error getting alerts:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  static async getStatistics(client, guildId, timeframe = 'day') {
    try {
      if (!client.db) return null;

      const key = `guild:${guildId}:audit:events`;
      const events = (await client.db.get(key)) || [];

      let timeMs = 24 * 60 * 60 * 1000; // 1 day default
      if (timeframe === 'week') timeMs = 7 * 24 * 60 * 60 * 1000;
      if (timeframe === 'month') timeMs = 30 * 24 * 60 * 60 * 1000;

      const cutoff = Date.now() - timeMs;
      const recentEvents = events.filter(e => e.timestamp > cutoff);

      const stats = {
        totalEvents: recentEvents.length,
        eventsByType: {},
        eventsBySeverity: { info: 0, warning: 0, critical: 0 },
        topActors: {},
        topTargets: {}
      };

      recentEvents.forEach(e => {
        // Count by type
        stats.eventsByType[e.type] = (stats.eventsByType[e.type] || 0) + 1;

        // Count by severity
        stats.eventsBySeverity[e.severity]++;

        // Track top actors
        if (e.actorId) {
          stats.topActors[e.actorId] = (stats.topActors[e.actorId] || 0) + 1;
        }

        // Track top targets
        if (e.targetId) {
          stats.topTargets[e.targetId] = (stats.topTargets[e.targetId] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Error getting audit statistics:', error);
      return null;
    }
  }

  /**
   * Generate audit report embed
   */
  static async generateReportEmbed(client, guild, timeframe = 'day') {
    try {
      const stats = await this.getStatistics(client, guild.id, timeframe);
      const alerts = await this.getAlerts(client, guild.id, { resolved: false }, 5);

      if (!stats) return null;

      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📋 Security Audit Report')
        .setDescription(`Report for the last ${timeframe}`)
        .addFields(
          { name: 'Total Events', value: stats.totalEvents.toString(), inline: true },
          { name: 'Critical Events', value: stats.eventsBySeverity.critical.toString(), inline: true },
          { name: 'Warnings', value: stats.eventsBySeverity.warning.toString(), inline: true }
        )
        .setFooter({ text: 'skydomain Audit Log System' })
        .setTimestamp();

      // Add event breakdown
      if (Object.keys(stats.eventsByType).length > 0) {
        const typeBreakdown = Object.entries(stats.eventsByType)
          .map(([type, count]) => `• ${type}: ${count}`)
          .join('\n');
        embed.addFields({ name: 'Events by Type', value: typeBreakdown, inline: false });
      }

      // Add unresolved alerts
      if (alerts.length > 0) {
        const alertList = alerts
          .map(a => `• [${a.severity.toUpperCase()}] ${a.title}`)
          .join('\n');
        embed.addFields({ name: 'Unresolved Alerts', value: alertList, inline: false });
      }

      return embed;
    } catch (error) {
      logger.error('Error generating report embed:', error);
      return null;
    }
  }

  /**
   * Send event to audit log channel
   * @private
   */
  static async sendToAuditChannel(client, guild, logEntry) {
    try {
      // Get audit log channel from config
      if (!client.db) return;

      const configKey = `guild:${guild.id}:audit:config`;
      const config = await client.db.get(configKey);

      if (!config || !config.logChannelId) return;

      const channel = guild.channels.cache.get(config.logChannelId);
      if (!channel || !channel.isTextBased()) return;

      const embed = this.createEventEmbed(logEntry);
      await channel.send({ embeds: [embed] }).catch(() => null);
    } catch (error) {
      logger.error('Error sending to audit channel:', error);
    }
  }

  /**
   * Create event embed
   * @private
   */
  static createEventEmbed(logEntry) {
    const embed = new EmbedBuilder()
      .setColor(this.getSeverityColor(logEntry.severity))
      .setTitle(logEntry.action)
      .addFields(
        { name: 'Type', value: logEntry.type, inline: true },
        { name: 'Severity', value: logEntry.severity.toUpperCase(), inline: true },
        { name: 'Timestamp', value: `<t:${Math.floor(logEntry.timestamp / 1000)}:R>`, inline: false }
      )
      .setFooter({ text: `ID: ${logEntry.id}` });

    if (logEntry.actorId) {
      embed.addFields({ name: 'Actor', value: `<@${logEntry.actorId}>`, inline: true });
    }

    if (logEntry.targetId) {
      embed.addFields({ name: 'Target', value: `${logEntry.targetType}: ${logEntry.targetId}`, inline: true });
    }

    if (logEntry.reason) {
      embed.addFields({ name: 'Reason', value: logEntry.reason, inline: false });
    }

    return embed;
  }

  /**
   * Notify administrators of alert
   * @private
   */
  static async notifyAdministrators(client, guild, alertEntry) {
    try {
      const admins = guild.members.cache.filter(m =>
        m.permissions.has('Administrator') || m.permissions.has('ManageGuild')
      );

      for (const admin of admins.values()) {
        try {
          const embed = new EmbedBuilder()
            .setColor(this.getSeverityColor(alertEntry.severity))
            .setTitle(`🚨 ${alertEntry.title}`)
            .setDescription(alertEntry.description)
            .setFooter({ text: 'skydomain Security Alert' })
            .setTimestamp();

          await admin.user.send({ embeds: [embed] }).catch(() => null);
        } catch (err) {
          logger.warn(`Failed to notify admin ${admin.user.tag}:`, err.message);
        }
      }
    } catch (error) {
      logger.error('Error notifying administrators:', error);
    }
  }

  /**
   * Get severity color
   * @private
   */
  static getSeverityColor(severity) {
    const colors = {
      info: '#0099FF',
      warning: '#FFAA00',
      critical: '#FF0000'
    };
    return colors[severity] || '#0099FF';
  }

  /**
   * Configure audit log channel
   */
  static async setAuditChannel(client, guildId, channelId) {
    try {
      if (!client.db) return false;

      const configKey = `guild:${guildId}:audit:config`;
      const config = (await client.db.get(configKey)) || {};

      config.logChannelId = channelId;
      await client.db.set(configKey, config);

      return true;
    } catch (error) {
      logger.error('Error setting audit channel:', error);
      return false;
    }
  }

  /**
   * Resolve alert
   */
  static async resolveAlert(client, guildId, alertId) {
    try {
      if (!client.db) return false;

      const key = `guild:${guildId}:audit:alerts`;
      const alerts = (await client.db.get(key)) || [];

      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        alert.resolvedAt = Date.now();
        await client.db.set(key, alerts);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error resolving alert:', error);
      return false;
    }
  }

  /**
   * Export audit log to file format
   */
  static async exportLog(client, guildId, format = 'json') {
    try {
      const events = await this.getEvents(client, guildId, {}, 500);

      if (format === 'json') {
        return JSON.stringify(events, null, 2);
      } else if (format === 'csv') {
        const headers = ['ID', 'Type', 'Action', 'Actor', 'Target', 'Reason', 'Severity', 'Timestamp'];
        const rows = events.map(e =>
          `"${e.id}","${e.type}","${e.action}","${e.actorId}","${e.targetId}","${e.reason}","${e.severity}","${new Date(e.timestamp).toISOString()}"`
        );
        return [headers.join(','), ...rows].join('\n');
      }

      return null;
    } catch (error) {
      logger.error('Error exporting log:', error);
      return null;
    }
  }
}

export default AuditLogService;
