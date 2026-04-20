const { Client, GatewayIntentBits, Partials } = require("discord.js");
const express = require("express");
require("dotenv").config();

// 🌐 servidor (uptimerobot)
const app = express();
app.get("/", (req, res) => res.send("Bot online"));
app.listen(process.env.PORT || 3000, () => {
  console.log("🌐 Web rodando");
});

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

// 🔥 anti crash REAL
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err);
});
process.on("uncaughtException", (err) => {
  console.error("CRASH:", err);
});

// 📂 carregar comandos
require("./painel")(client);

// login
console.log("TOKEN:", process.env.TOKEN);
client.login(process.env.TOKEN);
