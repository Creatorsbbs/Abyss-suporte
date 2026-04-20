const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

module.exports = (client) => {

  const tickets = new Map();
  let painelImagem = null; // 👈 guarda a imagem

  client.on("messageCreate", async (message) => {
    try {
      if (!message.guild || message.author.bot) return;

      // ================= SETAR IMAGEM =================
      if (message.content.startsWith("P!painelimg")) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return message.reply("❌ Apenas administradores.");
        }

        const args = message.content.split(" ");
        const url = args[1];

        if (!url) {
          return message.reply("❌ Use: P!painelimg <url>");
        }

        painelImagem = url;

        return message.reply("✅ Imagem do painel atualizada.");
      }

      // ================= PAINEL =================
      if (message.content === "P!painel") {

        const menu = new StringSelectMenuBuilder()
          .setCustomId("ticket_menu")
          .setPlaceholder("Selecione o atendimento")
          .addOptions([
            { label: "Parceria", value: "parceria" },
            { label: "Dúvidas", value: "duvidas" },
            { label: "Compras", value: "compras" },
            { label: "Denúncias", value: "denuncias" },
            { label: "Outros", value: "outros" }
          ]);

        const row = new ActionRowBuilder().addComponents(menu);

        const embed = new EmbedBuilder()
          .setTitle("🎫 Painel de Suporte - Executive")
          .setDescription("Escolha uma opção abaixo.");

        if (painelImagem) {
          embed.setImage(painelImagem); // 👈 aplica imagem
        }

        await message.channel.send({
          embeds: [embed],
          components: [row]
        });
      }

    } catch (err) {
      console.log("ERRO painel:", err);
    }
  });

  // ================= INTERAÇÕES =================
  client.on("interactionCreate", async (interaction) => {
    try {

      // MENU
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId !== "ticket_menu") return;

        const tipo = interaction.values[0];

        const jaTem = [...tickets.values()].find(t => t.dono === interaction.user.id);
        if (jaTem) {
          return interaction.reply({
            content: "❌ Você já tem um ticket aberto.",
            ephemeral: true
          });
        }

        const nome = interaction.user.username
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        const canal = await interaction.guild.channels.create({
          name: `ticket-${nome}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
              ]
            }
          ]
        });

        tickets.set(canal.id, {
          dono: interaction.user.id,
          staff: null
        });

        const embed = new EmbedBuilder()
          .setTitle("🎟️ Ticket criado")
          .setDescription(`Tipo: **${tipo}**`);

        const botoes = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("assumir")
            .setLabel("Assumir")
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId("fechar")
            .setLabel("Fechar")
            .setStyle(ButtonStyle.Danger)
        );

        await canal.send({
          content: `<@${interaction.user.id}>`,
          embeds: [embed],
          components: [botoes]
        });

        await interaction.reply({
          content: "✅ Ticket criado!",
          ephemeral: true
        });

        try {
          await interaction.user.send(`🎫 Seu ticket foi criado: ${canal.name}`);
        } catch {}
      }

      // BOTÕES
      if (interaction.isButton()) {

        const data = tickets.get(interaction.channel.id);
        if (!data) return;

        if (interaction.customId === "assumir") {

          if (data.staff) {
            return interaction.reply({
              content: "❌ Já foi assumido.",
              ephemeral: true
            });
          }

          data.staff = interaction.user.id;

          await interaction.reply(`👮 Assumido por <@${interaction.user.id}>`);

          try {
            const user = await client.users.fetch(data.dono);
            user.send("Seu ticket foi assumido.");
          } catch {}
        }

        if (interaction.customId === "fechar") {

          await interaction.reply("🔒 Fechando em 5s...");

          setTimeout(() => {
            tickets.delete(interaction.channel.id);
            interaction.channel.delete().catch(() => {});
          }, 5000);
        }
      }

    } catch (err) {
      console.log("ERRO interaction:", err);
    }
  });
};
