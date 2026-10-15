const{SlashCommandBuilder,ContainerBuilder,SeparatorBuilder,ModalBulder,TextInputBuilder,ActionRowBuilder,PermissionFlagsBits,MessageFlags,SeparatorSpacingSize,ButtonBuilder,ButtonStyle,TextDisplayBuilder} = require('discord.js')

const randomUUIID = require('crypto')
const knex = require('../db')
const LOA_REQUEST_CHANNEL_ID = process.env.LOA_REQUEST_CHANNEL_ID
const LOA_ROLE_ID = process.env.LOA_ROLE_ID
const LOA_LOG_CHANNEL_ID = process.env.LOA_LOG_CHANNEL_ID


module.exports = {
    data:new SlashCommandBuilder()
    .setName('loa')
    .setDescription('Loa commannds')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)    
    .addSubcommand(sub=>sub
        .setName('panel-deploy')
        .setDescription('Deploys the request pannel')
    )
    .addSubcommand(sub=>sub
        .setName('fetch')
        .setDescription('Fetches all loas for the user')
        .addUserOption(o=>o
            .setName('user')
            .setDescription('User to fetch the loas for')
        )
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

        if(subcommand ==='panel-deploy'){
            const user = interaction.options.getUser('user')
            const container = new ContainerBuilder()
            const loachanel = LOA_REQUEST_CHANNEL_ID
            const loaid  = randomUUIID
            .setAccentColor(15547576)
            .addTextDisplayComponents((textDisplay) => textDisplay
            .setContent('# Loa Requests ')
            
            
        )




        }
    }
}
   
    
}
