require('dotenv').config();
const { Events, ContainerBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) {
      console.error('WELCOME_CHANNEL_ID is not set in .env');
      return;
    }

    const channel = await member.guild.channels.fetch(channelId).catch(() => null);
    if (!channel) {
      console.error(`Could not resolve channel with ID ${channelId}`);
      return;
    }

    const component = new ContainerBuilder()
      .setAccentColor(5063705)
      .addSectionComponents((section) => section
        .addTextDisplayComponents(
          (textDisplay) => textDisplay
            .setContent('# New User Joined'),
        )
        .setThumbnailAccessory((thumbnail) => thumbnail
          .setURL(member.user.displayAvatarURL({ extension: 'png' }))
        )
      )
      .addSeparatorComponents((separator) => separator
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
      )
      .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent(`Greetings ${member}, Welcome to ${member.guild.name} We are so glad to see you here.\nIn This Guild you can track the development process of the Game and much more. Feel free to engage with the community and enjoy.`)
      )
      .addSeparatorComponents((separator) => separator
        .setDivider(true)
      )
      .addTextDisplayComponents((textDisplay) => textDisplay
        .setContent('-# Nucleo')
      );

    await channel.send({
      components: [component],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};