/**
 * Get the first available Lavalink node (or manager for Lavalink-Client)
 * @param {import("../lib/Bot")} client
 */
module.exports = async (client) => {
	const engine = client.manager?.Engine;
	if (!engine) return null;
	// Lavalink-Client: leastUsedNode getter on manager
	return engine.leastUsedNode ?? (engine.useable ? engine : null) ?? null;
};