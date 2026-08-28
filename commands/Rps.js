const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

const CHOICES = {
  rock: { emoji: '🪨', beats: 'scissors' },
  paper: { emoji: '📄', beats: 'rock' },
  scissors: { emoji: '✂️', beats: 'paper' },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play rock, paper, scissors against the bot'),

  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      Object.entries(CHOICES).map(([choice, { emoji }]) =>
        new ButtonBuilder()
          .setCustomId(`rps_${choice}`)
          .setLabel(choice[0].toUpperCase() + choice.slice(1))
          .setEmoji(emoji)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const message = await interaction.reply({
      content: 'Choose your weapon!',
      components: [row],
      withResponse: true,
    });

    const collector = message.resource.message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 15_000,
      max: 1,
    });

    collector.on('collect', async (i) => {
      const playerChoice = i.customId.replace('rps_', '');
      const botChoice = Object.keys(CHOICES)[Math.floor(Math.random() * 3)];

      let result;
      if (playerChoice === botChoice) {
        result = "It's a tie!";
      } else if (CHOICES[playerChoice].beats === botChoice) {
        result = 'You win! 🎉';
      } else {
        result = 'You lose! 😢';
      }

      const embed = new EmbedBuilder()
        .setColor(
          result.includes('win') ? 0x57f287 : result.includes('lose') ? 0xed4245 : 0xfee75c
        )
        .setTitle('Rock Paper Scissors')
        .addFields(
          { name: 'You', value: `${CHOICES[playerChoice].emoji} ${playerChoice}`, inline: true },
          { name: 'Bot', value: `${CHOICES[botChoice].emoji} ${botChoice}`, inline: true }
        )
        .setDescription(`**${result}**`);

      await i.update({ content: null, embeds: [embed], components: [] });
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: '⏱️ You didn\'t choose in time!',
          components: [],
        }).catch(() => {});
      }
    });
  },
};