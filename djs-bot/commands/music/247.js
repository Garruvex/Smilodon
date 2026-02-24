const colors = require("colors");
const { EmbedBuilder, MessageFlags } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
	.setName("247")
	.setDescription("Prevents the bot from ever disconnecting from a VC (toggle)")
	.setRun(async (client, interaction, options) => {
		let channel = await client.getChannel(client, interaction);
		if (!channel) {
			return;
		}
		
		const engine = client.manager?.Engine;
		if (!engine) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("Lavalink node is not connected"),
				],
			});
		}
		const player =
			(typeof engine.getPlayer === "function" ? engine.getPlayer(interaction.guild.id) : null) ??
			engine.players?.get?.(interaction.guild.id) ??
			null;
		
		if (!player) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor("Red")
						.setDescription("There's nothing to play 24/7."),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
		
		let twentyFourSevenEmbed = new EmbedBuilder().setColor(
			client.config.embedColor,
		);
		const twentyFourSeven = player.get("twentyFourSeven");
		
		if (!twentyFourSeven) {
			player.set("twentyFourSeven", true);
		} else {
			player.set("twentyFourSeven", false);
		}
		twentyFourSevenEmbed
		  .setDescription(`**24/7 mode is** \`${!twentyFourSeven ? "ON" : "OFF"}\``)
		  .setFooter({
		    text: `The bot will ${!twentyFourSeven ? "now" : "no longer"} stay connected to the voice channel 24/7.`
      });
		const gid = player.guildId ?? player.guild ?? player.options?.guild;
		client.warn(
			`Player: ${gid} | [${colors.blue("24/7")}] has been [${colors.blue(
				!twentyFourSeven ? "ENABLED" : "DISABLED",
			)}] in ${
				client.guilds.cache.get(gid) ? client.guilds.cache.get(gid).name : "a guild"
			}`,
		);
		
		const queueLen = (player.queue?.tracks?.length ?? 0) + (player.queue?.current ? 1 : 0);
		if (!player.playing && queueLen === 0 && twentyFourSeven) {
			player.destroy();
		}
		
		const ret = await interaction.reply({ embeds: [twentyFourSevenEmbed], fetchReply: true });
		if (ret) setTimeout(() => ret.delete().catch(client.warn), 20000);
		return ret;
	});

module.exports = command;
