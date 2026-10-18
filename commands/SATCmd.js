const {
  SlashCommandBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');

const knex = require('../db');

const MAIN_SAT_ROLE_ID = process.env.MAIN_SAT_ROLE_ID;
const SENIOR_SAT_ROLE_ID = process.env.SENIOR_SAT_ROLE_ID;
const SAT_ROLE_ID = process.env.SAT_ROLE_ID;
const JUNIOR_SAT_ROLE_ID = process.env.JUNIOR_SAT_ROLE_ID;

function createResponseContainer(content, accentColor = 7472132) {
  return new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

async function resolveSafetyTable() {
  const candidates = ['safety', 'sats'];

  for (const tableName of candidates) {
    const exists = await knex.schema.hasTable(tableName);
    if (exists) return tableName;
  }

  return 'safety';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('safety')
    .setDescription('[STM] Allows to add or remove safety team members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('[STM] adds a user to the SAT database and grants the matching role')
        .addUserOption((o) =>
          o
            .setName('user')
            .setDescription('User to add to the safety database')
            .setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName('rank')
            .setDescription('Rank you want to add to the user')
            .setRequired(true)
            .addChoices(
              { name: 'Senior Safety', value: 'senior_sat' },
              { name: 'Safety', value: 'sat' },
              { name: 'Junior Safety', value: 'junior_sat' },
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('[STM] removes a user from the SAT database and removes the matching role')
        .addUserOption((o) =>
          o
            .setName('user')
            .setDescription('User to remove from the safety database')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const tableName = await resolveSafetyTable();

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      const container = new ContainerBuilder()
        .setAccentColor(13895688)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent('# <:denied:1544287937628348528> Access Denied'))
        .addSeparatorComponents((separator) => separator.setDivider(true).setSpacing(SeparatorSpacingSize.Large))
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent('### You do not have permission to run this command'))
        .addSeparatorComponents((separator) => separator.setDivider(true))
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent('-# **Nucleo**'));

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user');
      const rank = interaction.options.getString('rank');
      const secondaryRoleId = {
        senior_sat: SENIOR_SAT_ROLE_ID,
        sat: SAT_ROLE_ID,
        junior_sat: JUNIOR_SAT_ROLE_ID,
      }[rank];

      if (!MAIN_SAT_ROLE_ID || !secondaryRoleId) {
        return interaction.reply({
          components: [createResponseContainer('Safety role IDs are not configured.', 13895688)],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.roles.add([MAIN_SAT_ROLE_ID, secondaryRoleId]);
        await knex(tableName).insert({
          user: user.id,
          who_added: interaction.user.username,
          rank,
          time: new Date(),
        });

        return interaction.editReply({
          components: [createResponseContainer(`Added <@${user.id}> as **${rank.replace(/_/g, ' ')}**.`)],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      } catch (error) {
        console.error('Failed to add safety user:', error);
        return interaction.editReply({
          components: [createResponseContainer('Could not add the user. Check the bot role hierarchy and database connection.', 13895688)],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    if (subcommand === 'remove') {
      const user = interaction.options.getUser('user');

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        const memberRecord = await knex(tableName).where({ user: user.id }).first();
        if (!memberRecord) {
          return interaction.editReply({
            components: [createResponseContainer(`No safety record found for <@${user.id}>.`, 13895688)],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            allowedMentions: { parse: [] },
          });
        }

        const secondaryRoleId = {
          senior_sat: SENIOR_SAT_ROLE_ID,
          sat: SAT_ROLE_ID,
          junior_sat: JUNIOR_SAT_ROLE_ID,
        }[memberRecord.rank];

        if (!MAIN_SAT_ROLE_ID || !secondaryRoleId) {
          return interaction.editReply({
            components: [createResponseContainer('Safety role IDs are not configured.', 13895688)],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          });
        }

        const member = await interaction.guild.members.fetch(user.id);
        await member.roles.remove([MAIN_SAT_ROLE_ID, secondaryRoleId]);
        await knex(tableName).where({ user: user.id }).del();

        return interaction.editReply({
          components: [createResponseContainer(`Removed <@${user.id}> from the safety team.`)],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      } catch (error) {
        console.error('Failed to remove safety user:', error);
        return interaction.editReply({
          components: [createResponseContainer('Could not remove the user. Check the bot role hierarchy and database connection.', 13895688)],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    return interaction.reply({
      content: 'Unsupported safety subcommand.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
