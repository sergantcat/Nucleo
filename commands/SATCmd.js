const {SlashCommandBuilder,ContinerBuilder,TextDisplayBuilder,SeparatorBuilder,SeparatorSpacingSize,PermissionFlagsBits,MessageFlags} = require('discord.js')
const knex = require('../db')
const MAIN_SAT_ROLE_ID = process.env.MAIN_SAT_ROLE_ID
const SENIOR_SAT_ROLE_ID = process.env.SENIOR_SAT_ROLE_ID
const SAT_ROLE_ID = process.env.SAT_ROLE_ID
const JUNIOR_SAT_ROLE_ID = process.env.JUNIOR_SAT_ROLE_ID

module.exports = {
  data:new SlashCommandBuilder()
  .setName('safety')
  .setDescription('Commnds to Interact with safety assurance db')
  .addSubcommand(sub=>
    sub
    .setName('add')
    .setDescription('adds a user to the SAT database')
    
    .addUserOption(o=>
      o
      .setName('user')
      .setDescription('User to add to the db and rank')
      .setRequired(true)
      .addStringOption(o=>
        o 
          .setName('rank')
          .setDescription('Rank you want to add to the user')
          .setRequired(true)
          .addChoices( 
                { name: 'Senior Mod', value: 'senior_mod' },
				        { name: 'Mod', value: 'mod' },
				        { name: 'Junior Mod', value: 'junior_mod' },
            )             
      
                )
                   .addSubcommand(sub=>
                     sub
                                  .setName('remove')
                                  .setDescription
