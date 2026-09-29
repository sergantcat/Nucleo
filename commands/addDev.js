const {SlashCommandBuilder,ContainerBuilder,TextDisplayBuilder,SeparatorBuilder,SeparatorSpacingSize,MessageFlags,PermissionFlagsBits} = require('discord.js')
const knex = require('../db')

const MAIN_DEV_ROLE_ID = process.env.MAIN_DEV_ROLE_ID;
const SENIOR_DEV_ROLE_ID = process.env.SENIOR_DEV_ROLE_ID;
const DEV_ROLE_ID = process.env.DEV_ROLE_ID;
const JUNIOR_DEV_ROLE_ID = process.env.JUNIOR_DEV_ROLE_ID;

function createResponseContainer(content, accentColor = 7472132) {
    return new ContainerBuilder()
        .setAccentColor(accentColor)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('devs')
    .setDescription('[STM] Allows to Remove or Add developers')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub=>
        sub
        .setName('add')
        .setDescription('[STM] adds a Developer to the Database and Roles the User')
        .addUserOption(o=>
            o
            .setName('user')
            .setDescription('User to add to the role and to the db as a Developer')
            .setRequired(true)
        )
        .addStringOption(o=>
            o
            .setName('rank')
            .setDescription('Rank to add to the user and the db')
            .setRequired(true)
            .addChoices(
                { name: 'Senior Dev', value: 'senior_dev' },
				{ name: 'Dev', value: 'dev' },
				{ name: 'Junior Dev', value: 'junior_dev' },
            )
        )

    )
    .addSubcommand(sub=>
        sub
        .setName('remove')
        .setDescription('[STM] removes the User From the Developers db and removes the Roles')
        .addUserOption(o=>
            o
            .setName('user')
            .setDescription('User to remove')
            .setRequired(true)
        )
    )
     .addSubcommand(sub=>
        sub
        .setName('fetch')
        .setDescription('[STM] fetches the developers in the db ')
       
    ),


    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
                    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            const container = new ContainerBuilder()
    .setAccentColor(13895688)
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent(" # <:denied:1544287937628348528> Access Denied")
    )
    .addSeparatorComponents((separator) => separator
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent("### You dont have Permision to run this command")
    )
    .addSeparatorComponents((separator) => separator
        .setDivider(true)
    )
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent("-# **Nucleo**")
    );
        return interaction.reply({ 
              components:[container],
           flags:MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
    }
    if(subcommand === 'add') {
        const user = interaction.options.getUser('user');
        const rank = interaction.options.getString('rank');
        const secondaryRoleId = {
            senior_dev: SENIOR_DEV_ROLE_ID,
            dev: DEV_ROLE_ID,
            junior_dev: JUNIOR_DEV_ROLE_ID,
        }[rank];

        if (!MAIN_DEV_ROLE_ID || !secondaryRoleId) {
            return interaction.reply({
                components: [createResponseContainer('Developer role IDs are not configured.', 13895688)],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.roles.add([MAIN_DEV_ROLE_ID, secondaryRoleId]);
            await knex('devs').insert({
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
            console.error('Failed to add developer:', error);
            return interaction.editReply({
                components: [createResponseContainer('Could not add the developer. Check the bot role hierarchy and database connection.', 13895688)],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

    }
    if(subcommand === 'fetch') {
        const devs = await knex('devs').select('user', 'rank').orderBy('user');
        const content = devs.length
            ? `### Developers (${devs.length})\n${devs.map((dev) => {
                const rank = String(dev.rank).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
                return `- <@${dev.user}> - ${rank}`;
            }).join('\n')}`
            : '### No developers found.';
        const container = new ContainerBuilder()
            .setAccentColor(7472132)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            allowedMentions: { parse: [] },
        });
    }

    if(subcommand === 'remove') {
        const user = interaction.options.getUser('user');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        try {
            const dev = await knex('devs').where({ user: user.id }).first();
            if (!dev) {
                return interaction.editReply({
                    components: [createResponseContainer(`No developer record found for <@${user.id}>.`, 13895688)],
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                    allowedMentions: { parse: [] },
                });
            }

            const secondaryRoleId = {
                senior_dev: SENIOR_DEV_ROLE_ID,
                dev: DEV_ROLE_ID,
                junior_dev: JUNIOR_DEV_ROLE_ID,
            }[dev.rank];

            if (!MAIN_DEV_ROLE_ID || !secondaryRoleId) {
                return interaction.editReply({
                    components: [createResponseContainer('Developer role IDs are not configured.', 13895688)],
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                });
            }

            const member = await interaction.guild.members.fetch(user.id);
            await member.roles.remove([MAIN_DEV_ROLE_ID, secondaryRoleId]);
            await knex('devs').where({ user: user.id }).del();

            return interaction.editReply({
                components: [createResponseContainer(`Removed <@${user.id}> from the developer team.`)],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                allowedMentions: { parse: [] },
            });
        } catch (error) {
            console.error('Failed to remove developer:', error);
            return interaction.editReply({
                components: [createResponseContainer('Could not remove the developer. Check the bot role hierarchy and database connection.', 13895688)],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }
    }

  }
    
   
    
}