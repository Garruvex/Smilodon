const { getClient } = require("../bot");
const { getControlChannelMessage } = require("./controlChannel");
const { redEmbed, colorEmbed, addQueueEmbed, loadedPlaylistEmbed } = require("./embeds");
const { joinStageChannelRoutine, addTrack } = require("./player");

/**
 * @param {import("discord.js").Message} message
 */
const handleMessageCreate = async (message) => {
	const client = getClient();

	if (!message?.guildId || message.author.id === client.user.id) return;

	const controlChannelMessage = await getControlChannelMessage(message.guildId);

	if (!controlChannelMessage || controlChannelMessage.channelId !== message.channelId) return;

	const retDel = async () => {
		return message.delete().catch(client.warn);
	};

	if (message.webhookId || (message.author.bot && message.author.id !== client.user.id))
		return retDel();

	const returnError = async (desc) => {
		// message reply can't be ephemeral
		const msg = await message.reply({
			embeds: [
				redEmbed({
					desc,
				}),
			],
			target: message,
		});

		setTimeout(async () => await msg.delete().catch(client.warn), 20000);

		return retDel();
	};

	const memberVC = message.member?.voice?.channel;
	if (!memberVC) return returnError("You're not in a voice channel!");

	const clientVC = message.guild.members.cache.get(client.user.id)?.voice?.channel;
	const isNotInSameVC = !clientVC?.equals(memberVC);

	if (clientVC && isNotInSameVC) return returnError("You're not in my voice channel!");

	if (!memberVC.joinable)
		return returnError("I don't have enough permission to join your voice channel");

	const node = await client.getLavalink(client);
	if (!node) return retDel();

	const query = message.content.trim();
	if (!query.length) return retDel();

	const player = client.manager.Engine.createPlayer({
		guildId: message.guild.id,
		voiceChannelId: memberVC.id,
		textChannelId: message.channel.id,
	});

	await player.connect();

	if (memberVC.type == "GUILD_STAGE_VOICE") {
		joinStageChannelRoutine(message.guild.members.me);
	}

	const responseMessage = await message
		.reply({
			embeds: [colorEmbed({ desc: ":mag_right: **Searching...**" })],
			fetchReply: true,
		})
		.catch(client.warn);

	if (!responseMessage) return retDel();

	const editResponse = async (payload) => responseMessage.edit(payload).catch(client.warn);

	const retDelAll = async () => {
		setTimeout(async () => await responseMessage.delete().catch(client.warn), 20000);

		return retDel();
	};

	const searchResult = await player.search({ query }, message.author).catch((err) => {
		client.error(err);
		return { loadType: "error" };
	});

	const playerDestroy = () => {
		if (!player.queue.current) {
			player.destroy();
		}
	};

	const triggerPlay = async () => {
		if (!player.playing && !player.paused) {
			await player.play();
		}
	};

	const loadFailed = searchResult.loadType === "error";
	const noMatches = searchResult.loadType === "empty";
	const trackLoaded =
		searchResult.loadType === "track" || searchResult.loadType === "search";

	const playlistLoaded = searchResult.loadType === "playlist";

	if (loadFailed || noMatches) {
		playerDestroy();

		await editResponse({
			embeds: [
				redEmbed({
					desc: noMatches
						? "No results were found"
						: "There was an error while searching",
				}),
			],
		});

		return retDelAll();
	}

	const firstTrack = searchResult.tracks?.[0];

	if (trackLoaded && firstTrack) {
		firstTrack.requester = message.author;
		if (firstTrack.userData == null) firstTrack.userData = {};
		firstTrack.userData.requester = message.author;
		player.set("requester", message.author);
		await addTrack(player, firstTrack);
		await triggerPlay();

		await editResponse({
			embeds: [
				addQueueEmbed({
					track: firstTrack,
					player,
					requesterId: message.author.id,
				}),
			],
		});
	}

	if (playlistLoaded && searchResult.tracks?.length) {
		for (const t of searchResult.tracks) {
			t.requester = message.author;
			if (t.userData == null) t.userData = {};
			t.userData.requester = message.author;
		}
		player.set("requester", message.author);
		await addTrack(player, searchResult.tracks);
		await triggerPlay();

		await editResponse({
			embeds: [loadedPlaylistEmbed({ searchResult, query })],
		});
	}

	return retDelAll();
};

module.exports = {
	handleMessageCreate,
};
