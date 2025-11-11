// AI-Powered Recommendation Service
import { Channel, Recommendation, WatchHistory, UserStats } from '../types';
import { StorageService } from './storageService';

export class RecommendationService {
  /**
   * Get personalized recommendations based on watch history
   */
  static async getRecommendations(
    allChannels: Channel[],
    limit: number = 10
  ): Promise<Channel[]> {
    try {
      const history = await StorageService.loadWatchHistory();
      const favorites = await StorageService.loadFavorites();
      const stats = await StorageService.loadUserStats();

      const recommendations: Array<{ channel: Channel; score: number }> = [];

      for (const channel of allChannels) {
        // Skip if already in favorites
        if (favorites.includes(channel.id)) {
          continue;
        }

        let score = 0;

        // Score based on category match with favorite categories
        if (channel.group && stats.favoriteCategories.includes(channel.group)) {
          score += 0.5;
        }

        // Score based on similar channels watched
        const similarWatched = history.filter(
          h => h.channelUrl.includes(channel.group || '') && h.progress > 0.8
        ).length;
        score += similarWatched * 0.2;

        // Score based on channel view count (if available)
        if (channel.viewCount) {
          score += Math.min(channel.viewCount / 1000, 0.3);
        }

        // Score based on rating (if available)
        if (channel.rating) {
          score += (channel.rating / 5) * 0.4;
        }

        // Bonus for recently added channels
        score += 0.1;

        if (score > 0) {
          recommendations.push({ channel, score });
        }
      }

      // Sort by score and return top N
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(r => r.channel);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Get similar channels based on a channel
   */
  static getSimilarChannels(
    channel: Channel,
    allChannels: Channel[],
    limit: number = 5
  ): Channel[] {
    const similar: Array<{ channel: Channel; score: number }> = [];

    for (const other of allChannels) {
      if (other.id === channel.id) continue;

      let score = 0;

      // Same category
      if (other.group === channel.group) {
        score += 0.6;
      }

      // Similar name
      const nameSimilarity = this.calculateStringSimilarity(
        channel.name.toLowerCase(),
        other.name.toLowerCase()
      );
      score += nameSimilarity * 0.4;

      if (score > 0.3) {
        similar.push({ channel: other, score });
      }
    }

    return similar
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.channel);
  }

  /**
   * Update favorite categories based on watch history
   */
  static async updateFavoriteCategories(): Promise<void> {
    try {
      const history = await StorageService.loadWatchHistory();
      const stats = await StorageService.loadUserStats();

      // Count category views with weight on progress
      const categoryScores: Record<string, number> = {};

      for (const item of history) {
        // Extract category from channel name or URL if available
        const category = item.channelName.split(' - ')[0] || 'General';
        const weight = item.progress * (item.duration / 60); // minutes watched

        categoryScores[category] = (categoryScores[category] || 0) + weight;
      }

      // Get top 5 categories
      const topCategories = Object.entries(categoryScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category);

      stats.favoriteCategories = topCategories;
      await StorageService.saveUserStats(stats);
    } catch (error) {
      console.error('Error updating favorite categories:', error);
    }
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get trending channels (most watched recently)
   */
  static async getTrendingChannels(
    allChannels: Channel[],
    limit: number = 10
  ): Promise<Channel[]> {
    try {
      const history = await StorageService.loadWatchHistory();

      // Get channels watched in last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentHistory = history.filter(
        h => h.lastWatchedAt >= weekAgo
      );

      // Count views per channel
      const channelViews: Record<string, number> = {};
      for (const item of recentHistory) {
        channelViews[item.channelId] = (channelViews[item.channelId] || 0) + 1;
      }

      // Get top channels
      const trendingIds = Object.entries(channelViews)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);

      return allChannels.filter(c => trendingIds.includes(c.id));
    } catch (error) {
      console.error('Error getting trending channels:', error);
      return [];
    }
  }
}
