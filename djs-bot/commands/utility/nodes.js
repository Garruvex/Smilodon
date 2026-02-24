const moment = require("moment");
const { EmbedBuilder, MessageFlags } = require("discord.js")
const Bot = require("../../lib/Bot");

module.exports = {
	name: "nodes",
	category: "utility",
	usage: "/nodes",
	description: "Check the bot's lavalink node statistics!",
	ownerOnly: false,
	/**
	 * 
	 * @param {Bot} client 
	 * @param {import("discord.js").Interaction} interaction 
	 * @returns 
	 */
	run: async (client, interaction) => {
		let lavauptime, lavaram, lavaclientstats, lavacores, lavalloc;
		
		const statsEmbed = new EmbedBuilder()
		.setTitle(`${client.user.username} Nodes Information`)
		.setColor(client.config.embedColor)
		
		if (client.manager?.Engine) {
			const nodeMap = client.manager.Engine.nodeManager?.nodes ?? client.manager.Engine.nodes;
			const nodesList = nodeMap instanceof Map ? Array.from(nodeMap.entries()) : Object.entries(nodeMap || {});
			for (const [index, lavalinkClient] of nodesList) {
				const stats = lavalinkClient.stats ?? lavalinkClient.info ?? {};
				const lavaclientstats = stats;
				lavacores = lavaclientstats.cpu?.cores ?? 0;
				lavauptime = moment.duration(lavaclientstats.uptime ?? 0).format("d[ Days]・h[ Hrs]・m[ Mins]・s[ Secs]");
				lavaram = ((lavaclientstats.memory?.used ?? 0) / 1024 / 1024).toFixed(2);
				lavalloc = ((lavaclientstats.memory?.allocated ?? lavaclientstats.memory?.used ?? 0) / 1024 / 1024).toFixed(2);
				statsEmbed.addFields([{
					name: `${lavalinkClient.options?.id ?? lavalinkClient.options?.identifier ?? index}`,
					value: `\`\`\`yml\nUptime: ${lavauptime}\nRAM: ${lavaram} / ${lavalloc}MB\nCPU: ${(lavacores === 1) ? "1 Core" : `${lavacores} Cores`}\nPlaying: ${lavaclientstats.playingPlayers ?? 0} out of ${lavaclientstats.players ?? 0}\n\`\`\``,
				}]);
			}
		} else {
			statsEmbed.setDescription("**Lavalink manager was not initialized on startup, there are no nodes connected.**")
		}
		return interaction.reply({ embeds: [statsEmbed], flags: MessageFlags.Ephemeral });
	},
};