const SlashCommand = require("../lib/SlashCommand");
const { ccInteractionHook } = require("../util/interactions");
const { pause } = require("../util/player");
const { updateControlMessage, updatePauseControlMessage } = require("../util/controlChannel");

const command = new SlashCommand()
	.setName("playpause")
	.setCategory("cc")
	.setDescription("Play and Pause interaction")
	.setRun(async (client, interaction, options) => {
		const { error, data } = await ccInteractionHook(client, interaction);

		if (error || !data || data instanceof Promise) return data;

		const { player, channel, sendError } = data;

		if (player.paused) {
			await pause(player, false);
		} else {
			await pause(player, true);
		}

		const currentTrack =
			player.queue?.current ?? player.queue?.tracks?.[0] ?? player.queue?.[0];
		if (player.paused) {
			updatePauseControlMessage(interaction.guildId, currentTrack ?? undefined).catch(() => {});
		} else {
			updateControlMessage(interaction.guildId, currentTrack ?? undefined).catch(() => {});
		}

		return interaction.deferUpdate();
	});

module.exports = command;
