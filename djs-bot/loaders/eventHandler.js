// EventHandler.js
class EventHandler {
	constructor(client) {
		this.client = client;
		this.events = {};
	}

	registerEvent(eventName, handler) {
		if (!this.events[eventName]) {
			this.events[eventName] = [];
		}
		this.events[eventName].push(handler);
	}

	trigger(eventName, ...args) {
		if (this.events[eventName]) {
			this.events[eventName].forEach((handler) => {
				try {
					handler(...args);
				} catch (error) {
					console.error(`Error handling ${eventName} event`, error);
				}
			});
		}
	}

	loadEventHandlers(path) {
		// You would use Node's file system module to load all files from a directory
		const fs = require("fs");
		const eventFiles = fs.readdirSync(path).filter((file) => file.endsWith(".js"));

		for (const file of eventFiles) {
			const eventName = file.split(".")[0];
			const handler = require(`./${path}/${file}`);
			this.registerEvent(eventName, handler);
		}
	}
}

module.exports = EventHandler;
