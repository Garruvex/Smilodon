/**
 * /servers route
 * returns the servers the bot is in
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("../../../lib/Bot")} bot
 */
module.exports = (req, res, bot) => {
	const id = req.query.id;
	if (id) {
		const guild = bot.guilds.cache.get(id);
		if (!guild) return res.status(404).json({ error: "Server not found" });

		return res.status(200).json({
			id: guild.id,
			name: guild.name,
			icon: guild.iconURL(),
			owner: guild.ownerId,
			roles: guild.roles.cache.map(role => ({
				id: role.id,
				name: role.name,
				color: role.hexColor,
			})),
			channels: guild.channels.cache.map(channel => ({
				id: channel.id,
				name: channel.name,
				type: channel.type,
				parent: channel.parentId,
			})),
			members: guild.members.cache.map(member => ({
				id: member.id,
				username: member.user.username,
				discriminator: member.user.discriminator,
				avatar: member.user.avatarURL(),
				roles: member.roles.cache.map(role => role.id),
			})),
			player: (() => {
				const p = bot.manager.Engine.players.get(guild.id);
				const q = p?.queue;
				const tracks = q?.tracks ?? q ?? [];
				const arr = Array.isArray(tracks) ? tracks : [];
				const current = q?.current;
				const info = (t) => t?.info ?? t;
				return {
					queue: arr.map((track) => ({
						title: info(track).title,
						author: info(track).author,
						duration: info(track).duration,
					})),
					playing: current
						? {
								title: info(current).title,
								author: info(current).author,
								duration: info(current).duration,
						  }
						: null,
				};
			})(),
		});
	}

	res.status(200).json({
		servers: bot.guilds.cache.map(guild => ({
			id: guild.id,
			name: guild.name,
			icon: guild.iconURL(),
		})),
	});
}