const fuzzysort = require('fuzzysort');
const { SlashCommandBuilder } = require('discord.js');

// todo: autocomplete usernames

const data = new SlashCommandBuilder()
    .setName('identify')
	.setDescription('Associate your discord with a given forum username.')
	.addStringOption((option) => option
        .setName('username') // must be underscore format
        .setDescription('Your forum username.')
        .setRequired(true));

const execute = async (interaction) => {
    // send "thinking" reply
    await interaction.deferReply();
    // get desired username
    const username = interaction.options.getString('username');
    // interaction.guild.members.fetch({ query: username, limit: 1 })
    // get SHL usernames
    fetch('https://cards.simulationhockey.com/api/v2/users')
        .then(resp => resp.json())
    	.then(users => {
        	let names = users.map(user => user.username);
        	// check if desired name is on forum
        	if (names.includes(username)) {
                // set guild member's nickname
                interaction.editReply('Identity found. Setting nickname: ' + username);
                interaction.member.setNickname(username, 'Requested through bot');
            } else {
                // look for similar names (https://stackoverflow.com/questions/23305000/javascript-fuzzy-search-that-makes-sense)
                // https://github.com/farzher/fuzzysort
                let possible = fuzzysort.go(username, names, { threshold: 0, limit: 3 }).map(r => r.target);
                if (possible.length) {
                    interaction.editReply(`Unsuccessful. Did you mean: ${possible.join(', ')}?`);
                } else {
                    interaction.editReply('Unsuccessful. Try again.');
                }
            }
    	})
    	.catch(error => {
        	console.error(error);
        	interaction.editReply('Error executing command.');
    	});
}

module.exports = { data, execute };
