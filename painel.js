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

  client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    if (message.content === "P!painel") {

      const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("Selecione o tipo de atendimento")
        .addOptions([
          { label: "Parceria", value: "parceria" },
          { label: "Dúvidas", value: "duvidas" },
          { label: "Compras", value: "compras" },
          { label: "Denúncias", value: "denuncias" },
          { label: "Outros", value: "outros" }
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      const embed = new EmbedBuilder()
        .setTitle("🎫 Painel de Suporte")
        .setDescription("Escolha uma opção abaixo para abrir um ticket.");

      message.channel.send({ embeds: [embed], components: [row] });
    }
  });

  // interação
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === "ticket_menu") {
      const tipo = interaction.values[0];

      const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel]
          }
        ]
      });

      tickets.set(canal.id, {
        dono: interaction.user.id,
        assumido: null
      });

      const embed = new EmbedBuilder()
        .setTitle("🎟️ Ticket aberto")
        .setDescription(`Tipo: **${tipo}**\nAguarde um suporte.`);

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

      canal.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embed],
        components: [botoes]
      });

      interaction.reply({ content: "Ticket criado!", ephemeral: true });

      // avisa no privado
      interaction.user.send(`Seu ticket foi criado: ${canal}`);
    }
  });

  // botões
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const data = tickets.get(interaction.channel.id);
    if (!data) return;

    // assumir
    if (interaction.customId === "assumir") {
      data.assumido = interaction.user.id;

      interaction.reply(`👮 Ticket assumido por <@${interaction.user.id}>`);

      const user = await client.users.fetch(data.dono);
      user.send("Seu ticket foi assumido por um suporte.");
    }

    // fechar
    if (interaction.customId === "fechar") {
      interaction.reply("🔒 Fechando ticket em 5s...");

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  });
};
