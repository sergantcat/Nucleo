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
  ContainerBuilder,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
  ThumbnailBuilder,
} = require("discord.js");

// ─────────────────────────────────────────────
// CONFIG — pulled from .env (see .env.example)
// ─────────────────────────────────────────────
const REVIEW_CHANNEL_ID = process.env.REVIEW_CHANNEL_ID?.trim();
const REVIEW_ROLE_ID = process.env.REVIEW_ROLE_ID?.trim();
const FORUM_CHANNEL_ID = process.env.FORUM_CHANNEL_ID?.trim();

function getReviewConfig() {
  return {
    reviewChannelId: REVIEW_CHANNEL_ID,
    reviewRoleId: REVIEW_ROLE_ID,
  };
}

function getForumConfig() {
  return {
    forumChannelId: FORUM_CHANNEL_ID,
  };
}

// Pulls a field's value back out of the review embed by its field name.
// Used when we need the raw data again later (e.g. building the forum post on accept).
function getEmbedFieldValue(embed, name) {
  return embed?.fields?.find((f) => f.name === name)?.value;
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

const partnershipCommand = {
  requiredPermissions: PermissionFlagsBits.Administrator,

  data: new SlashCommandBuilder()
    .setName("post-partnership")
    .setDescription("Post the partnership application prompt")
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
        content: "Partnership review settings are not configured. Set REVIEW_CHANNEL_ID and REVIEW_ROLE_ID in your .env file.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await postApplicationEmbed(interaction.channel);
    await interaction.editReply({ content: "✅ Partnership application prompt posted." });
  },
};

// ─────────────────────────────────────────────
// 1. POST THE INITIAL EMBED (call this from a slash command, e.g. /post-application)
// ─────────────────────────────────────────────
function buildPartnershipPromptComponents() {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## FSRI Partnership Programm 🤝")
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "Hello Here you can Apply For partnerships with FSRI, By Partnering With Us you can Recive Some benefits Stated Below Also We Will be Happy If You Will Partner With Us."
      )
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "### What Are The Benefits?\n- Announcments From Your Server Will get Posted in The Partnership Announcments Channel\n- Development And Other Sneek Peeks will be Posted in Partnerships Development channel\n- W.I.P You will also Recive A Headtag in game"
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "\n- You can View The Requirements in the <#1523058659817689158> Channel."
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "> Ready to begin? Tap the button below to submit your partnership application."
      )
    );
}

async function postApplicationEmbed(channel) {
<<<<<<< HEAD
  const container = buildPartnershipPromptComponents();
=======
  const embed = new EmbedBuilder()
    .setTitle("FSRI Partnership Application")
    .setDescription(
      'By Pressing This Button You Will open An Modal To apply For partnership With FSRI')
    .setColor(BlackButNotDark);
>>>>>>> 862a144a0cb9a2e3dfe73bf0e50243600dc9efef

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.applyButton)
      .setLabel("Apply")
      .setEmoji({ id: "1532792685243400385", name: "partnership" })
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({
    components: [container, row],
    flags: MessageFlags.IsComponentsV2,
  });
}

// ─────────────────────────────────────────────
// 2. MAIN INTERACTION ROUTER — call this inside client.on("interactionCreate", ...)
// ─────────────────────────────────────────────
async function handleApplicationInteractions(interaction) {
  try {
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
  } catch (error) {
    console.error("Partnership interaction failed:", error);

    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: "Something went wrong while processing that request.", flags: MessageFlags.Ephemeral });
      } catch {}
    }
  }
}

// ─────────────────────────────────────────────
// 3. SHOW THE APPLICATION MODAL
// ─────────────────────────────────────────────
async function showApplicationModal(interaction) {
  const modal = new ModalBuilder().setCustomId(IDS.applyModal).setTitle("Partnership Application");

  const serverName = new TextInputBuilder()
    .setCustomId("server_name")
    .setLabel("Your server name")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const inviteLink = new TextInputBuilder()
    .setCustomId("invite_link")
    .setLabel("Invite link to your server")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const memberCount = new TextInputBuilder()
    .setCustomId("member_count")
    .setLabel("Server member count")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const robloxGroupLink = new TextInputBuilder()
    .setCustomId("roblox_group_link")
    .setLabel("Roblox group link")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const whyPartnership = new TextInputBuilder()
    .setCustomId("why_partnership")
    .setLabel("Why partner with us?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(serverName),
    new ActionRowBuilder().addComponents(memberCount),
    new ActionRowBuilder().addComponents(inviteLink),
    new ActionRowBuilder().addComponents(robloxGroupLink),
    new ActionRowBuilder().addComponents(whyPartnership)
  );

  await interaction.showModal(modal);
}

// ─────────────────────────────────────────────
// 4. HANDLE APPLICATION SUBMISSION -> post review embed with buttons
// ─────────────────────────────────────────────
async function handleApplicationSubmit(interaction) {
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  } catch (error) {
    if (error?.code !== 10062) {
      console.error("Failed to defer application reply:", error);
    }
  }

  const serverName = interaction.fields.getTextInputValue("server_name");
  const memberCount = interaction.fields.getTextInputValue("member_count");
  const inviteLink = interaction.fields.getTextInputValue("invite_link");
  const robloxGroupLink = interaction.fields.getTextInputValue("roblox_group_link");
  const whyPartnership = interaction.fields.getTextInputValue("why_partnership");

  // Pull the server icon straight from the invite instead of asking the applicant for a URL.
  let serverIcon = null;
  try {
    const inviteCode = inviteLink.trim().split("/").pop();
    const invite = await interaction.client.fetchInvite(inviteCode);
    serverIcon = invite.guild?.iconURL({ size: 256 }) ?? null;
  } catch (error) {
    console.error("Could not resolve server icon from invite link:", error);
  }

  const { reviewChannelId, reviewRoleId } = getReviewConfig();
  if (!reviewChannelId || !reviewRoleId) {
    return interaction.editReply?.({ content: "Partnership review settings are not configured. Set REVIEW_CHANNEL_ID and REVIEW_ROLE_ID in your .env file." });
  }

  const reviewChannel = await interaction.client.channels.fetch(reviewChannelId).catch(() => null);
  if (!reviewChannel || reviewChannel.type !== ChannelType.GuildText || !reviewChannel.isTextBased()) {
    return interaction.editReply?.({ content: "Review channel is misconfigured. Contact an admin." });
  }

  const reviewEmbed = new EmbedBuilder()
    .setTitle("🤝 New Partnership Application")
    .setDescription("A new partnership request has been submitted and is awaiting review.")
    .setColor(0xffc857)
    .addFields(
      { name: "Applicant", value: `${interaction.user} (${interaction.user.id})`, inline: false },
      { name: "Server Name", value: serverName || "Not provided", inline: true },
      { name: "Member Count", value: memberCount || "Not provided", inline: true },
      { name: "Invite Link", value: inviteLink || "Not provided", inline: false },
      { name: "Roblox Group Link", value: robloxGroupLink || "Not provided", inline: false },
      { name: "Why Partnership?", value: whyPartnership || "Not provided", inline: false },
      { name: "Status", value: "⏳ Pending Review", inline: false }
    )
    .setThumbnail(serverIcon || interaction.user.displayAvatarURL({ size: 256, dynamic: true }))
    .setFooter({ text: "FSRI Partnerships" })
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

  const confirmationEmbed = new EmbedBuilder()
    .setTitle("✅ Partnership request received")
    .setDescription("Thank you for reaching out. Your application has been submitted and our team will review it shortly.")
    .setColor(0x2ecc71)
    .setFooter({ text: "FSRI Partnerships" });

  await interaction.editReply?.({
    embeds: [confirmationEmbed],
  });
}

// ─────────────────────────────────────────────
// 5. SHOW DENY REASON MODAL
// ─────────────────────────────────────────────
async function showDenyReasonModal(interaction) {
  const userId = interaction.customId.split("_").pop();
  const modal = new ModalBuilder()
    .setCustomId(`${IDS.denyReasonModal}_${userId}`)
    .setTitle("Deny Partnership with Reason");

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
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content: "Processing your decision...", flags: MessageFlags.Ephemeral });
  } else {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  }

  const reason = interaction.fields.getTextInputValue("deny_reason");
  const messageId = interaction.message.id;

  // Update the review embed to show denial with reason
  const originalEmbed = interaction.message.embeds[0];
  const statusIndex = originalEmbed.fields.findIndex((f) => f.name === "Status");
  const updatedEmbed = EmbedBuilder.from(originalEmbed)
    .setColor(0xe74c3c)
    .spliceFields(statusIndex, 1, { name: "Status", value: `❌ Denied\n\n**Reason:** ${reason}` });

  await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

  const denialEmbed = new EmbedBuilder()
    .setTitle("📝 Partnership application update")
    .setDescription("Your partnership request has been denied.")
    .setColor(0xe74c3c)
    .addFields({ name: "Reason", value: reason })
    .setFooter({ text: "FSRI Partnerships" });

  await sendApplicantDm(interaction, { embeds: [denialEmbed] });

  await interaction.editReply?.({ content: "✅ Successfully denied the application with a reason." });
}

// ─────────────────────────────────────────────
// 6b. CREATE PARTNER FORUM POST (called on Accept)
// ─────────────────────────────────────────────
async function createPartnerForumPost(interaction, originalEmbed) {
  const { forumChannelId } = getForumConfig();
  if (!forumChannelId) {
    console.error("FORUM_CHANNEL_ID is not set in .env — skipping forum post.");
    return;
  }

  const forumChannel = await interaction.client.channels.fetch(forumChannelId).catch(() => null);
  if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
    console.error("FORUM_CHANNEL_ID does not point to a valid forum channel.");
    return;
  }

  const applicantId = getApplicantIdFromInteraction(interaction);
  const applicant = applicantId ? await interaction.client.users.fetch(applicantId).catch(() => null) : null;
  const member =
    applicantId && interaction.guild ? await interaction.guild.members.fetch(applicantId).catch(() => null) : null;

  const serverName = getEmbedFieldValue(originalEmbed, "Server Name") || "Unknown Server";
  const inviteLink = getEmbedFieldValue(originalEmbed, "Invite Link") || "Not provided";
  const robloxGroupLink = getEmbedFieldValue(originalEmbed, "Roblox Group Link") || "Not provided";
  const serverIcon = originalEmbed.thumbnail?.url; // pulled from the invite link when the application was submitted, or the applicant's avatar as a fallback

  // Role color doubles as the container's accent bar — the closest Components V2
  // gets to a colored "background" for the card.
  const roleColor = member?.roles?.highest?.color || 0x2f3136;

  const container = new ContainerBuilder()
    .setAccentColor(roleColor)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`## 🤝 ${serverName}\nNewly accepted partner server`)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(serverIcon || applicant?.displayAvatarURL({ size: 256 }))
        )
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      // A plain <@id> mention is enough — Discord automatically renders it as a
      // rounded chip with the person's avatar and their highest role's color.
      new TextDisplayBuilder().setContent(`**Owner**\n${applicant ?? "Unknown"}`)
    )
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`**Server Link**\n${inviteLink}`),
      new TextDisplayBuilder().setContent(`**Roblox Group**\n${robloxGroupLink}`)
    );

  try {
    await forumChannel.threads.create({
      name: serverName.slice(0, 100),
      message: {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      },
    });
  } catch (error) {
    // Most likely cause: the auto-fetched server icon URL was invalid or unreachable.
    // Retry once without the custom server icon so the post still goes out.
    console.error("Forum post failed, retrying without custom server icon:", error);
    container.spliceComponents(0, 1,
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`## 🤝 ${serverName}\nNewly accepted partner server`)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder().setURL(applicant?.displayAvatarURL({ size: 256 }) ?? "https://cdn.discordapp.com/embed/avatars/0.png")
        )
    );
    await forumChannel.threads.create({
      name: serverName.slice(0, 100),
      message: {
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      },
    });
  }
}

// ─────────────────────────────────────────────
// 7. HANDLE ACCEPT / DENY DECISION
// ─────────────────────────────────────────────
async function handleDecision(interaction, decision) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content: "Processing your decision...", flags: MessageFlags.Ephemeral });
  } else {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  }

  const originalEmbed = interaction.message.embeds[0];
  const statusIndex = originalEmbed.fields.findIndex((f) => f.name === "Status");
  let updatedEmbed;

  if (decision === "accept") {
    updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setColor(0x2ecc71)
      .spliceFields(statusIndex, 1, { name: "Status", value: "✅ Accepted" });
  } else {
    updatedEmbed = EmbedBuilder.from(originalEmbed)
      .setColor(0xe74c3c)
      .spliceFields(statusIndex, 1, { name: "Status", value: "❌ Denied" });
  }

  await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

  if (decision === "accept") {
    await createPartnerForumPost(interaction, originalEmbed).catch((error) => {
      console.error("Failed to create partner forum post:", error);
    });
  }

  const notificationEmbed = new EmbedBuilder()
    .setTitle(decision === "accept" ? "🎉 Partnership application accepted" : "⚠️ Partnership application update")
    .setDescription(
      decision === "accept"
        ? "Congratulations! Your partnership request has been accepted. We’re excited to work with you."
        : "Unfortunately, your partnership request was not approved at this time. We appreciate your interest and encourage you to apply again in the future."
    )
    .setColor(decision === "accept" ? 0x2ecc71 : 0xe74c3c)
    .setFooter({ text: "FSRI Partnerships" });

  await sendApplicantDm(interaction, { embeds: [notificationEmbed] });

  await interaction.editReply?.({
    content: `✅ Application ${decision === "accept" ? "accepted" : "denied"}.`,
  });
}

// ─────────────────────────────────────────────
// EXPORT — call handleApplicationInteractions() in your interactionCreate listener
// ─────────────────────────────────────────────
module.exports = {
  ...partnershipCommand,
  postApplicationEmbed,
  handleApplicationInteractions,
};