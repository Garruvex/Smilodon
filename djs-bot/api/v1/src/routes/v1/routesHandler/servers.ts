import { getBot } from '../../..';
import APIError from '../../../lib/APIError';
import { RouteHandler, BotWithEngine } from '../../../interfaces/common';
import { createReply } from '../../../utils/reply';
import { getUserGuilds } from '../../../services/discord';
import type { Guild, Role, GuildBasedChannel, GuildMember } from 'discord.js';

const handler: RouteHandler = async (request, reply) => {
  const bot = getBot() as BotWithEngine;

  if (!bot)
    throw new APIError(
      'Bot not found',
      APIError.STATUS_CODES.NOT_FOUND,
      APIError.ERROR_CODES.NOT_FOUND,
    );

  const id = (request.query as { id: string | undefined }).id;
  if (id) {
    const guild = bot.guilds.cache.get(id);
    if (!guild)
      throw new APIError(
        'Server not found',
        APIError.STATUS_CODES.NOT_FOUND,
        APIError.ERROR_CODES.NOT_FOUND,
      );

    return createReply({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      owner: guild.ownerId,
      roles: guild.roles.cache.map((role: Role) => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
      })),
      channels: guild.channels.cache.map((channel: GuildBasedChannel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        parent: channel.parentId,
      })),
      members: guild.members.cache.map((member: GuildMember) => ({
        id: member.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        avatar: member.user.avatarURL(),
        roles: member.roles.cache.map((role: Role) => role.id),
      })),
      player: (() => {
        const player = bot.manager?.Engine.players.get(guild.id);
        const q = player?.queue as { tracks?: Array<{ title?: string; author?: string; duration?: number; info?: { title?: string; author?: string; duration?: number } }>; current?: { title?: string; author?: string; duration?: number; info?: { title?: string; author?: string; duration?: number } } } | undefined;
        const tracks = q?.tracks ?? (Array.isArray(q) ? q : []);
        const current = q?.current;
        const trackFields = (t: typeof current) => ({
          title: t?.info?.title ?? t?.title,
          author: t?.info?.author ?? t?.author,
          duration: t?.info?.duration ?? t?.duration,
        });
        return {
          queue: Array.isArray(tracks) ? tracks.map((track) => trackFields(track)) : [],
          playing: trackFields(current),
        };
      })(),
    });
  }

  const guilds = await getUserGuilds(request.headers.user_id as string);

  return createReply({
    servers: guilds
      .map((userGuild) => {
        // @ts-ignore
        const guild: Guild = new Guild(bot, userGuild);

        const cachedGuild = bot.guilds.cache.get(guild.id);

        return {
          ...userGuild,
          icon: guild.iconURL(),
          mutual: !!cachedGuild,
        };
      })
      .sort((a, b) => ((b.mutual && 1) || 0) - ((a.mutual && 1) || 0)),
  });
};

export const options = { requiresAuth: true };

export default handler;
