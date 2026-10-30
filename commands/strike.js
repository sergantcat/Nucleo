const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    PermissionFlagsBits,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
} = require("discord.js");

const db = require("../db.js");
const randomUUID = require('crypto')

module.exports = {
    data: new SlashCommandBuilder()
        .setName("strike")
        .setDescription("Issue a Strike on a Staff Member.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName("issue")
                .setDescription("Issue a Strike on a Staff Member.")
                .addUserOption((option) =>
                    option
                        .setName("user")  
                        .setDescription("The Staff Member to issue a Strike on.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("reason")
                        .setDescription("The Reason for the Strike.")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("fetch")
                .setDescription("Fetch Strike Information for a Staff Member.")
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("The Staff Member to fetch Strike information for.")
                        .setRequired(false)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("delete")
                .setDescription("Delete a Strike from a Staff Member.")
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("The Staff Member to delete Strike information for.")
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("strike")
                        .setDescription("The strike to select.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (interaction.options.getSubcommand() !== "delete" || focusedOption.name !== "strike") {
            return interaction.respond([]);
        }

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.respond([]);
        }

        const user = interaction.options.getUser("user");
        const query = String(focusedOption.value ?? "").trim().toLowerCase();
        let strikeQuery = db("strikes")
            .select("id", "reason", "date", "user")
            .orderBy("date", "desc");

        if (user) {
            strikeQuery = strikeQuery.where({ user: user.id });
        } else {
            strikeQuery = strikeQuery.limit(100);
        }

        const strikes = await strikeQuery;

        const choices = strikes
            .map((strike) => ({
                strike,
                name: `#${strike.id} - ${String(strike.reason ?? "No reason provided")}${user ? "" : ` (User ${strike.user})`}`,
            }))
            .filter(({ strike, name }) =>
                `${name} ${strike.id} ${strike.reason ?? ""}`.toLowerCase().includes(query)
            )
            .slice(0, 25)
            .map(({ strike, name }) => ({
                name: name.slice(0, 100),
                value: String(strike.id).slice(0, 100),
            }));

        return interaction.respond(choices);
    },
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser("user") ?? interaction.user;
        const isManager = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
        const canFetchUser = user?.id === interaction.user.id || isManager;

        if ((subcommand === "issue" || subcommand === "delete") && !isManager) {
            const container = new ContainerBuilder()
                .setAccentColor(13895688)
                .addTextDisplayComponents((textDisplay) => textDisplay
                    .setContent("### Access Denied\nYou need Manage Server permission to issue or delete strikes.")
                );
            return interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        if (subcommand === "fetch" && !canFetchUser) {
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
        .setContent(`-# **${interaction.client.user.username}**`)
    );
            return interaction.reply({ components: [container], ephemeral: true, flags: MessageFlags.Ephemeral.IsComponentsV2 });
        }

        if (subcommand === "issue") {
            const user = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason");
            const strikeId = randomUUID.randomUUID();

            await db ('strikes') .insert({
                id: strikeId,
                user: user.id,
                date : new Date(),
                reason: reason,
                moderator : interaction.user.id,
              
            });
            const container = new ContainerBuilder()
    .setAccentColor(11730944)
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent("# <:strike:1556233480269209691> A Strike has been Issued ")
    )
    .addSeparatorComponents((separator) => separator
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent("A Strike Has been Issued, if you Belive this is a Misstake Contact a Staff Manager or an HR member.")
    )
    .addSeparatorComponents((separator) => separator
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent(`**Strike ID:** \`${strikeId}\`\n**Reason:** ${reason}\n**Issued by:** <@${interaction.user.id}>`)
    )
    .addSeparatorComponents((separator) => separator
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent(`-# ${interaction.client.user.username} · ${new Date().toLocaleString()}`)
    );

            await user.send({
                flags: MessageFlags.IsComponentsV2,
                components: [container],
            });
            const component = new ContainerBuilder()
    .setAccentColor(16713222)
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent("# <:strike:1556233480269209691>  Success")
    )
    .addSeparatorComponents((separator) => separator
        .setDivider(true)
    )
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent(`Succesfully issued a strike on : <@${user.id}>.`)
    );
            return interaction.reply({components: [component], ephemeral: true, flags: MessageFlags.IsComponentsV2 });
            
        }

        if (subcommand === "fetch") {
              const strikes = await db('strikes')
                  .select('id', 'reason', 'date', 'moderator')
                  .where({ user: user.id })
                  .orderBy('date', 'desc');
        const container = new ContainerBuilder()
            .setAccentColor(7472132)
            .addTextDisplayComponents(new TextDisplayBuilder()
                .setContent(`# Strikes for <@${user.id}> (${strikes.length})`)
            )
            .addSeparatorComponents((separator) => separator
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Small)
            );

        if (strikes.length) {
            strikes.forEach((strike, index) => {
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `- **ID:** \`${strike.id}\` Reason: ${strike.reason} (${new Date(strike.date).toLocaleString()}) · Issued by <@${strike.moderator}>`
                ));

                if (index < strikes.length - 1) {
                    container.addSeparatorComponents((separator) => separator
                        .setDivider(true)
                        .setSpacing(SeparatorSpacingSize.Small)
                    );
                }
            });
        } else {
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(" ## No strikes found."));
        }

        container
            .addSeparatorComponents((separator) => separator
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Small)
            )
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `-# ${interaction.client.user.username} · ${new Date().toLocaleString()}`
            ));

        return interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] },
        });
        }
        if (subcommand === "delete") {
            const strikeId = interaction.options.getString("strike");
            const strike = await db('strikes').where({ id: strikeId, user: user.id }).first();
            if (!strike) {
                return interaction.reply({ content: "Strike not found.", ephemeral: true });
            }
            await db('strikes').where({ id: strikeId, user: user.id }).delete();

            const container = new ContainerBuilder()
                .setAccentColor(96512)
                .addTextDisplayComponents((textDisplay) => textDisplay
                    .setContent("# <:check:1556233903931392052> Strike Termination Notice")
                )
                .addSeparatorComponents((separator) => separator
                    .setDivider(true)
                )
                .addTextDisplayComponents((textDisplay) => textDisplay
                    .setContent("### Greetings, Your strike With Id displayed Below has been Removed.")
                )
                .addSeparatorComponents((separator) => separator
                    .setDivider(true)
                    .setSpacing(SeparatorSpacingSize.Small)
                )
                .addTextDisplayComponents((textDisplay) => textDisplay
                    .setContent(`- **ID:** \`${strike.id}\`\n Reason: ${strike.reason} \n (${new Date(strike.date).toLocaleString()}) · Issued by <@${strike.moderator}>`)
                )
                .addSeparatorComponents((separator) => separator
                    .setDivider(true)
                    .setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents((textDisplay) => textDisplay
                    .setContent("### Please Do not break the Staff Guidelines Again.")
                )
                .addSeparatorComponents((separator) => separator
                    .setDivider(true)
                )
                .addTextDisplayComponents((textDisplay) => textDisplay
                    .setContent(  `-# ${interaction.client.user.username} · ${new Date().toLocaleString()}`)
                );

            await user.send({
                flags: MessageFlags.IsComponentsV2,
                components: [container],
            });

            const successcontainer = new ContainerBuilder()
    .setAccentColor(1376006)
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent("# <:check:1556233903931392052> Success")
    )
    .addSeparatorComponents((separator) => separator
        .setDivider(true)
    )
    .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent(`Strike with ID \`${strike.id}\` has been removed from <@${user.id}>.`)
    );

            return interaction.reply({ components: [successcontainer], ephemeral: true,
                flags: MessageFlags.IsComponentsV2
            });
        }
    
    }

        

};  
 
