/**
 * Discord Affiliate Application System
 * Discord.js v14 + JavaScript (CommonJS)
 *
 * FLOW:
 * 1. postApplicationEmbed() sends an embed with an "Apply" button in your public channel.
 * 2. User clicks it -> modal form pops up.
 * 3. User submits -> answers get posted as an embed in your REVIEW channel,
 *    pinging REVIEW_ROLE_ID, with Accept / Deny / Deny w/ Reason buttons.
 * 4. Staff clicks Accept/Deny -> bot edits the embed to show the result and
 *    (optionally) DMs the applicant. "Deny with Reason" opens a second modal
 *    for staff to type why, then posts that reason too.
 *
 * WIRE-UP: require this file in your main bot file and call
 * handleApplicationInteractions() inside your interactionCreate listener
 * (see the bottom of this file for an example).
 */

require("dotenv").config();

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

// ─────────────────────────────────────────────
// CONFIG — pulled from .env (see .env.example)
// ─────────────────────────────────────────────
const REVIEW_CHANNEL_ID = process.env.REVIEW_CHANNEL_ID?.trim();
const REVIEW_ROLE_ID = process.env.REVIEW_ROLE_ID?.trim();

function getReviewConfig() {
  return {
    reviewChannelId: REVIEW_CHANNEL_ID,
    reviewRoleId: REVIEW_ROLE_ID,
  };
}

// Custom ID prefixes (do not change unless you also change the parsing below)
const IDS = {
  applyButton: "app_apply",
  applyModal: "app_modal",
  accept: "app_accept",
  deny: "app_deny",
  denyReason: "app_deny_reason",
  denyReasonModal: "app_deny_reason_modal",
};

function getApplicantIdFromInteraction(interaction) {
  const parts = interaction.customId?.split("_") ?? [];
  const maybeId = parts[parts.length - 1];
  return maybeId && /^\d+$/.test(maybeId) ? maybeId : null;
}

async function sendApplicantDm(interaction, message) {
  const applicantId = getApplicantIdFromInteraction(interaction);
  if (!applicantId) return false;

  try {
    const applicant = await interaction.client.users.fetch(applicantId);
    if (applicant) {
      await applicant.send(message);
      return true;
    }
  } catch (error) {
    console.error("Could not DM applicant:", error);
  }

  return false;
}

const affiliateCommand = {
  requiredPermissions: PermissionFlagsBits.Administrator,

  data: new SlashCommandBuilder()
    .setName("post-affiliate")
    .setDescription("Post the affiliate application embed")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.channel) {
      return interaction.reply({ content: "This command can only be used in a server text channel.", flags: MessageFlags.Ephemeral });
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "Only administrators can use this command.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.channel.isTextBased()) {
      return interaction.reply({ content: "This command must be used in a text channel.", flags: MessageFlags.Ephemeral });
    }

    const { reviewChannelId, reviewRoleId } = getReviewConfig();
    if (!reviewChannelId || !reviewRoleId) {
      return interaction.reply({
        content: "Affiliate review settings are not configured. Set REVIEW_CHANNEL_ID and REVIEW_ROLE_ID in your .env file.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await postApplicationEmbed(interaction.channel);
    await interaction.editReply({ content: "✅ Affiliate application embed posted." });
  },
};

// ─────────────────────────────────────────────
// 1. POST THE INITIAL EMBED (call this from a slash command, e.g. /post-application)
// ─────────────────────────────────────────────
async function postApplicationEmbed(channel) {
  const embed = new EmbedBuilder()
    .setTitle("FSRI Parrtnership Application")
    .setDescription(
      'Partnership Applications Here You may Open An Application Form ')
    .setColor(BlackButNotDark);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.applyButton)
      .setLabel("Apply Now")
      .setEmoji("📝")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ─────────────────────────────────────────────
// 2. MAIN INTERACTION ROUTER — call this inside client.on("interactionCreate", ...)
// ─────────────────────────────────────────────
async function handleApplicationInteractions(interaction) {
  if (interaction.isButton()) {
    if (interaction.customId === IDS.applyButton) return showApplicationModal(interaction);
    if (interaction.customId.startsWith(IDS.accept)) return handleDecision(interaction, "accept");
    if (interaction.customId.startsWith(IDS.denyReason)) return showDenyReasonModal(interaction);
    if (interaction.customId.startsWith(IDS.deny) && !interaction.customId.startsWith(IDS.denyReason)) {
      return handleDecision(interaction, "deny");
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === IDS.applyModal) return handleApplicationSubmit(interaction);
    if (interaction.customId.startsWith(IDS.denyReasonModal)) return handleDenyReasonSubmit(interaction);
  }
}

// ─────────────────────────────────────────────
// 3. SHOW THE APPLICATION MODAL
// ─────────────────────────────────────────────
async function showApplicationModal(interaction) {
  const modal = new ModalBuilder().setCustomId(IDS.applyModal).setTitle("Server Affiliate Application");

  const serverName = new TextInputBuilder()
    .setCustomId("server_name")
    .setLabel("Your server Name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const memberCount = new TextInputBuilder()
    .setCustomId("member_count")
    .setLabel("Server Member Count")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const inviteLink = new TextInputBuilder()
    .setCustomId("invite_link")
    .setLabel("Invite link to your server")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const whyAffiliate = new TextInputBuilder()
    .setCustomId("why_affiliate")
    .setLabel("Why do you want to create a Partnership with us?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const extra = new TextInputBuilder()
    .setCustomId("extra_info")
    .setLabel("Anything else we should know?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(serverName),
    new ActionRowBuilder().addComponents(memberCount),
    new ActionRowBuilder().addComponents(inviteLink),
    new ActionRowBuilder().addComponents(whyAffiliate),
    new ActionRowBuilder().addComponents(extra)
  );

  await interaction.showModal(modal);
}

// ─────────────────────────────────────────────
// 4. HANDLE APPLICATION SUBMISSION -> post review embed with buttons
// ─────────────────────────────────────────────
async function handleApplicationSubmit(interaction) {
  // Acknowledge immediately so Discord doesn't time out the interaction
  // while we do the (potentially slower) work of fetching the channel and sending the embed.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const serverName = interaction.fields.getTextInputValue("server_name");
  const memberCount = interaction.fields.getTextInputValue("member_count");
  const inviteLink = interaction.fields.getTextInputValue("invite_link");
  const whyAffiliate = interaction.fields.getTextInputValue("why_affiliate");
  const extraInfo = interaction.fields.getTextInputValue("extra_info") || "N/A";

  const { reviewChannelId, reviewRoleId } = getReviewConfig();
  if (!reviewChannelId || !reviewRoleId) {
    return interaction.editReply({ content: "Affiliate review settings are not configured. Set REVIEW_CHANNEL_ID and REVIEW_ROLE_ID in your .env file." });
  }

  const reviewChannel = await interaction.client.channels.fetch(reviewChannelId).catch(() => null);
  if (!reviewChannel || reviewChannel.type !== ChannelType.GuildText || !reviewChannel.isTextBased()) {
    return interaction.editReply({ content: "Review channel is misconfigured. Contact an admin." });
  }

  const reviewEmbed = new EmbedBuilder()
    .setTitle("New PartnerShip Application")
    .setColor(0xf1c40f)
    .addFields(
      { name: "Applicant", value: `${interaction.user} (${interaction.user.id})` },
      { name: "Server Name", value: serverName },
      { name: "Member Count", value: memberCount },
      { name: "Invite Link", value: inviteLink },
      { name: "Why Affiliate?", value: whyAffiliate },
      { name: "Extra Info", value: extraInfo },
      { name: "Status", value: "Pending" }
    )
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${IDS.accept}_${interaction.user.id}`)
      .setLabel("Accept")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅"),
    new ButtonBuilder()
      .setCustomId(`${IDS.deny}_${interaction.user.id}`)
      .setLabel("Deny")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("❌"),
    new ButtonBuilder()
      .setCustomId(`${IDS.denyReason}_${interaction.user.id}`)
      .setLabel("Deny With Reason")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📝")
  );

  await reviewChannel.send({
    content: `<@&${reviewRoleId}>`,
    embeds: [reviewEmbed],
    components: [row],
  });

  // Store message ID in the button custom IDs for later reference
  await interaction.editReply({
    content: `Your application has been submitted! We'll review it shortly.`,
  });
}

// ─────────────────────────────────────────────
// 5. SHOW DENY REASON MODAL
// ─────────────────────────────────────────────
async function showDenyReasonModal(interaction) {
  const userId = interaction.customId.split("_").pop();
  const modal = new ModalBuilder()
    .setCustomId(`${IDS.denyReasonModal}_${userId}`)
    .setTitle("Deny Application with Reason");

  const reason = new TextInputBuilder()
    .setCustomId("deny_reason")
    .setLabel("Why are we denying this application?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(reason));

  await interaction.showModal(modal);
}

// ─────────────────────────────────────────────
// 6. HANDLE DENY REASON SUBMISSION
// ─────────────────────────────────────────────
async function handleDenyReasonSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const reason = interaction.fields.getTextInputValue("deny_reason");
  const messageId = interaction.message.id;

  // Update the review embed to show denial with reason
  const originalEmbed = interaction.message.embeds[0];
  const updatedEmbed = EmbedBuilder.from(originalEmbed)
    .setColor(0xe74c3c)
    .spliceFields(6, 1, { name: "Status", value: `❌ Denied\n\n**Reason:** ${reason}` });

  await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

  await sendApplicantDm(
    interaction,
    `❌ Your affiliate application was denied.\n\n**Reason:** ${reason}`
  );

  await interaction.editReply({ content: "✅ Succesfully Denied The application With a Reason " });
}

// ─────────────────────────────────────────────
// 7. HANDLE ACCEPT / DENY DECISION
// ─────────────────────────────────────────────
async function handleDecision(interaction, decision) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const originalEmbed = interaction.message.embeds[0];
  let updatedEmbed;

  if (decision === "accept") {
    updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setColor(0x2ecc71)
      .spliceFields(6, 1, { name: "Status", value: "✅ Accepted" });
  } else {
    updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setColor(0xe74c3c)
      .spliceFields(6, 1, { name: "Status", value: "❌ Denied" });
  }

  await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

  let dmMessage = "";
  if (decision === "accept") {
    dmMessage = "🎉 Congratulations! Your affiliate application has been **accepted**!";
  } else {
    dmMessage =
      "❌ Unfortunately, your affiliate application has been **denied**. We appreciate your interest and encourage you to apply again in the future!";
  }

  await sendApplicantDm(interaction, dmMessage);

  await interaction.editReply({
    content: `✅ Application ${decision === "accept" ? "accepted" : "denied"}.`,
  });
}

// ─────────────────────────────────────────────
// EXPORT — call handleApplicationInteractions() in your interactionCreate listener
// ─────────────────────────────────────────────
module.exports = {
  ...affiliateCommand,
  postApplicationEmbed,
  handleApplicationInteractions,
};