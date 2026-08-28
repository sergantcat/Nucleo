const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a DM to a user through the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers) // Mod+ only
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User to DM').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('message').setDescription('Message to send').setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const messageText = interaction.options.getString('message');

    // Encode who to ping and where, into the button's customId so we don't need a DB
    const replyButton = new ButtonBuilder()
      .setCustomId(`dmreply_${interaction.user.id}`)
      .setLabel('Reply')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(replyButton);

    const container = new ContainerBuilder()
      .setAccentColor(0x5865f2)
      .addTextDisplayComponents((td) =>
        td.setContent(`### 📨 Message from Staff\n${messageText}`)
      )
      .addActionRowComponents(row);

    // Ack immediately so a slow DM send can never blow the 3s interaction window
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await target.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });

      await interaction.editReply({
        content: `✅ Sent DM to **${target.tag}**.`,
      });
    } catch (err) {
      console.error('Failed to send DM:', err);
      await interaction.editReply({
        content: `❌ Couldn't DM **${target.tag}**. They may have DMs disabled.`,
      });
    }
  },
};
