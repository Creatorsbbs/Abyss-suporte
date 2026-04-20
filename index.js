const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");
require("dotenv").config();

// 🌐 servidor pra UptimeRobot
const app = express();
app.get("/", (req, res) => res.send("Bot online"));
app.listen(3000, () => console.log("🌐 Web rodando"));

// 🤖 bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

client.once("ready", () => {
  console.log(`🤖 Logado como ${client.user.tag}`);
});

// 🔥 ANTI CRASH
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// 📂 comando separado
require("./painel")(client);

client.login(process.env.TOKEN);
