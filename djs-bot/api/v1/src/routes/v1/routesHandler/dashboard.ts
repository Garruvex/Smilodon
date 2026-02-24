import { getBot } from '../../..';
import { RouteHandler, BotWithEngine } from '../../../interfaces/common';
import { createReply } from '../../../utils/reply';
import APIError from '../../../lib/APIError';
import moment from 'moment';

interface LavalinkNodeStats {
  uptime: number;
  cpu: { cores: number };
  memory: { used: number; allocated: number };
}

const handler: RouteHandler = async (request, reply) => {
  const bot = getBot() as BotWithEngine;

  if (!bot)
    throw new APIError(
      'Bot not found',
      APIError.STATUS_CODES.NOT_FOUND,
      APIError.ERROR_CODES.NOT_FOUND,
    );

  const lavaNodes = bot.manager?.Engine?.nodes?.entries();

  if (!lavaNodes)
    throw new APIError(
      'Lava nodes not found',
      APIError.STATUS_CODES.NOT_FOUND,
      APIError.ERROR_CODES.NOT_FOUND,
    );

  let lavaNodesAggregates: Record<string, unknown> = {};
  for (const [nodeId, node] of lavaNodes) {
    const n = node as { connected?: boolean; stats: LavalinkNodeStats };
    lavaNodesAggregates = {
      ...lavaNodesAggregates,
      [nodeId]: {
        id: nodeId,
        connected: n.connected,
        nodeStats: n.stats,
        stats: {
          cores: n.stats.cpu.cores,
          uptime: (moment.duration(n.stats.uptime) as moment.Duration & { format(template: string): string }).format("d[ Days]・h[ Hrs]・m[ Mins]・s[ Secs]"),
          ramUsage: (n.stats.memory.used / 1024 / 1024).toFixed(2),
          ramTotal: (n.stats.memory.allocated / 1024 / 1024).toFixed(2),
        }
      },
    };
  }

  return createReply({
    commandsRan: bot.commandsRan || 0,
    users: bot.guilds.cache.reduce((acc: number, guild: { memberCount: number }) => acc + guild.memberCount, 0),
    servers: bot.guilds.cache.size,
    songsPlayed: bot.songsPlayed || 0,
    nodes: lavaNodesAggregates,
  });
};

export const options = { requiresAuth: true };

export default handler;
