const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ContainerBuilder,
  MessageFlags,
} = require('discord.js');

/**
 * Call this from your main interactionCreate listener, e.g.:
 *
 * client.on('interactionCreate', async (interaction) => {
 *   if (interaction.isButton() && interaction.customId.startsWith('dmreply_')) {
 *     return handleDmReplyButton(interaction);
 *   }
 *   if (interaction.isModalSubmit() && interaction.customId.startsWith('dmreplymodal_')) {
 *     return handleDmReplyModal(interaction);
 *   }
 *   // ...your other command/component routing
 * });
 */

async function handleDmReplyButton(interaction) {
  const [, modId] = interaction.customId.split('_');

  const modal = new ModalBuilder()
    .setCustomId(`dmreplymodal_${modId}`)
    .setTitle('Reply to Staff');

  const input = new TextInputBuilder()
    .setCustomId('reply_text')
    .setLabel('Your reply')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  modal.addComponents(new ActionRowBuilder().addComponents(input));

  await interaction.showModal(modal);
}

async function handleDmReplyModal(interaction) {
  const [, modId] = interaction.customId.split('_');
  const replyText = interaction.fields.getTextInputValue('reply_text');

  try {
    const mod = await interaction.client.users.fetch(modId);

    const container = new ContainerBuilder()
      .setAccentColor(0xed4245)
      .addTextDisplayComponents((td) =>
        td.setContent(
          `### 💬 DM Reply\n**From:** ${interaction.user.tag} (${interaction.user.id})\n\n${replyText}`
        )
      );

    await mod.send({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });

    await interaction.reply({
      content: '✅ Your reply has been sent.',
      flags: MessageFlags.Ephemeral,
    });
  } catch (err) {
    console.error('Failed to deliver DM reply:', err);
    await interaction.reply({
      content: "❌ Couldn't deliver your reply — the staff member may have DMs disabled.",
      flags: MessageFlags.Ephemeral,
    });
  }
}

module.exports = { handleDmReplyButton, handleDmReplyModal };
