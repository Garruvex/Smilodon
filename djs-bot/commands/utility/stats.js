const os = require("os");
const moment = require("moment");
require("moment-duration-format");
const { EmbedBuilder } = require("discord.js");
const SlashCommand = require("../../lib/SlashCommand");

const command = new SlashCommand()
	.setName("stats")
	.setDescription("Get information about the bot")
	.setRun(async (client, interaction) => {
		let nodes = "";

		const nodeMap = client.manager.Engine.nodeManager?.nodes ?? client.manager.Engine.nodes;
		const nodesList = nodeMap instanceof Map ? Array.from(nodeMap.values()) : Object.values(nodeMap || {});
		nodesList.forEach((node) => {
			const stats = node.stats ?? node.info ?? {};
			const lavauptime = moment.duration(stats.uptime ?? 0).format(" D[d], H[h], m[m]");
			const lavaram = ((stats.memory?.used ?? 0) / 1024 / 1024).toFixed(2);
			nodes += `\`\`\`yml\nNode: ${node.options?.id ?? node.options?.identifier ?? "node"}\nUptime: ${lavauptime}\nRAM: ${lavaram} MB\nPlayers: ${stats.playingPlayers ?? 0} out of ${stats.players ?? 0}\nWrapper: ${client.config.musicEngine}\`\`\`\n`;
		});

		// get OS info
		const osver = os.platform() + " " + os.release();

		// Get nodejs version
		const nodeVersion = process.version;

		// show system uptime
		const sysuptime = moment
			.duration(os.uptime() * 1000)
			.format("d[ Days]・h[ Hrs]・m[ Mins]・s[ Secs]");

		// get commit hash and date
		let gitHash = "unknown";
		try {
			gitHash = require("child_process")
				.execSync("git rev-parse HEAD")
				.toString()
				.trim();
		} catch (e) {
			// do nothing
			gitHash = "unknown";
		}

		const statsEmbed = new EmbedBuilder()
			.setTitle(`${client.user.username} Information`)
			.setColor(client.config.embedColor)
			.setDescription(
				`\`\`\`yml\nName: ${client.user.username}#${client.user.discriminator} [${client.user.id}]\nAPI: ${client.ws.ping}ms\n\`\`\``
			)
			.setFields([
				{
					name: `Lavalink stats`,
					value: nodes,
					inline: false,
				},
				{
					name: "Bot stats",
					value: `\`\`\`yml\nCommandsRan: ${
						client.commandsRan
					}\nSongsPlayed: ${client.songsPlayed}\nGuilds: ${
						client.guilds.cache.size
					} \nNodeJS: ${nodeVersion}\nDiscordMusicBot: v${
						require("../../package.json").version
					} \`\`\``,
					inline: true,
				},
				{
					name: "System stats",
					value: `\`\`\`yml\nOS: ${osver}\nUptime: ${sysuptime}\n\`\`\``,
					inline: false,
				},
			])
			.setFooter({ text: `Build: ${gitHash}` });

		return interaction.reply({ embeds: [statsEmbed] });
	});

module.exports = command;
