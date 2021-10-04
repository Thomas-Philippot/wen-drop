const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios')
const moment = require('moment')
const {MessageEmbed} = require('discord.js')
require('dotenv').config()

module.exports = {
  data: new SlashCommandBuilder()
      .setName('drop')
      .setDescription('Donne la liste des prochains drop NFT')
      .addStringOption(option =>
          option.setName('blockchain')
                .setDescription('La blockchain')
                .setRequired(true)
                .addChoice('Ethereum','Ethereum')
                .addChoice('Solana','Solana')
                .addChoice('Binance Smart Chain','Binance Smart Chain')
                .addChoice('Elrond','Elrond')
                .addChoice('Avalanche','Avalanche')
      )
      .addStringOption(option =>
          option.setName('date')
              .setDescription('la date de recherche')
              .setRequired(true)
              .addChoice('Aujourd\'hui','Aujourd\'hui')
              .addChoice('Demain','Demain')
      ),
  async execute(interaction) {
    const blockchain = interaction.options.getString('blockchain')
    const date = interaction.options.getString('date')
    let from = ''
    let to = ''

    if (date === "Aujourd'hui") {
      from = moment().format('Y-MM-DD HH:mm')
      to = moment().format('Y-MM-DD 23:59')
    } else {
      const tomorrow = moment()
      tomorrow.add(1, 'days')
      from = tomorrow.format('Y-MM-DD 00:00')
      to = tomorrow.format('Y-MM-DD 23:59')
    }

    const response = await axios.get(process.env.DROPS_URL, {
      params: {
        'blockchain.name': blockchain,
        'date[after]': from,
        'date[before]': to,
        'itemsPerPage': 10
      }
    }).catch(async (e) => {
      await interaction.reply('Une erreur est survenue');
    })

    if (response.data['hydra:totalItems'] === 0) {
      await interaction.reply(`Aucun résultat pour ${date} sur ${blockchain}`);
      return
    }

    const embeds = []

    for (let i = 0; i < response.data['hydra:member'].length; i++) {
      let drop = response.data['hydra:member'][i]
      const embed = new MessageEmbed()
          .setColor('#0099ff')
          .setAuthor('voir sur wen-drop', 'https://wen-drop.app/logo.svg', `${process.env.DROP_URL}/${drop.id}`)
          .setTitle(drop.name)
          .setURL(drop.url)
          .setThumbnail(drop.image)
          .setDescription(drop.description)
          .addField('Heure', moment(drop.date).format('HH:mm'), true)
          .addField('Prix du mint', (drop.mintPrice) ? drop.mintPrice.toString() : 'TBA', true)
          .addField('Supply', (drop.supply) ? drop.supply.toString() : 'TBA', true)
      ;
      if (drop.score > 0) {
        embed.addField('Note des diggers', `${drop.score}/5`, true)
      }
      if (drop.comments.length > 0) {
        embed.addField('Nombre de commentaires', drop.comments.length.toString(), true)
      }
      embeds.push(embed)
    }

    await interaction.reply({ embeds});
  },
};
