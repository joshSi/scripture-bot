require('dotenv').config();
const axios = require('axios');
const Discord = require('discord.js');

const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"]}); //create new client

const prefix = '!';

let verseCache = {};

async function searchVerse(phrase, pg = 1){
    const res = await axios.get(`https://api.esv.org/v3/passage/search/?q=${phrase}&page-size=5&page=${pg}`,
    {
        headers: {
        'Authorization': process.env.CROSSWAY_TOKEN
        }
    });
    console.log(res.data)
    return res.data;
}
// parseInt((Math.random() * (max - min + 1)), 10) + min;
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(prefix)) return;
    if (msg.author.id === client.user.id) return;
    const command = msg.content.split(/ (.+)/);

    switch (command[0]) {            
        case "!esv":
        case "!find":
            if (command.length > 1) {
                const verses = await searchVerse(command[1]);
                msg.reply(`*Found ${verses.total_results} matching verses*`);
                verses.results.forEach(verse => {
                        msg.channel.send(`**${verse.reference}** - "${verse.content}"`);
                    }
                )
                if (verses.total_pages > 1) {
                    verseCache[msg.channelId] = {'searchTerm': command[1], 'page': 1};
                    msg.channel.send(`!next to show more, or !*[number]* for a specific page`);
                }
            }
            break;
        case "!n":
        case "!next":
            if (msg.channelId in verseCache) {
                const verses = await searchVerse(verseCache[msg.channelId].searchTerm, ++verseCache[msg.channelId].page);
                msg.channel.send(`(Showing page ${verses.page} of ${verses.total_pages})`);
                verses.results.forEach(verse => {
                    msg.channel.send(`**${verse.reference}** - "${verse.content}"`);
                })
                if (verses.total_pages <= verseCache[msg.channelId].page)
                    verseCache[msg.channelId].page = 0;
            } else {
                msg.channel.send(`No previous search found!`);
            }
            break;
        default:
            if (/^!\d+$/.test(msg.content)) {
                if (msg.channelId in verseCache) {
                    const pg_num = parseInt(msg.content.substring(1));
                    
                    const verses = await searchVerse(verseCache[msg.channelId].searchTerm, pg_num);
                    msg.channel.send(`(Showing page ${verses.page} of ${verses.total_pages})`);
                    verses.results.forEach(verse => {
                        msg.channel.send(`**${verse.reference}** - "${verse.content}"`);
                    })
                    if (verses.total_pages > pg_num)
                        verseCache[msg.channelId].page = pg_num;
                } else {
                    msg.channel.send(`No previous search found!`);
                }
                break;
            }
        }
    });

client.login(process.env.CLIENT_TOKEN); //login via Discord client token