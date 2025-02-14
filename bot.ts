import { Client, Events, GatewayIntentBits, ChatInputCommandInteraction } from 'discord.js';
import 'dotenv/config';
import { createCon, endCon, runQuery } from './bot/database';

var con = createCon;

const client = new Client({ intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
]});

client.on(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
});

// client.on('messageCreate', message => {
//     if(message.author.bot) return;
//     if (message.content.startsWith('paisa')){
//         const x = message.content.split('paisa')[1];
//         return message.reply({
//             content:'mazha kade pn!! 👀',
//         });
//     }
//     // message.reply({
//     //     content:"GST bharla ka?"
//     // });
// });

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    
    else if (interaction.commandName === 'work') {
        // work command logic
        const username = interaction.user.username
        const result = await runQuery(con, `SELECT 1 FROM balance WHERE username = "${username}" LIMIT 1;`, "") 
        
        // check if user is already in the db, if not create a new record for him
        if (result.length == 0) {
            await runQuery(con, `INSERT IGNORE INTO balance (username, balance) VALUES ("${username}", 100);`, `created new user row for ${username}`)
        } else{
            // logic to check if the user has worked in the last hour, if not, add 100 to balance
            let worked = await runQuery(con, `SELECT last_worked FROM balance WHERE username = "${username}";`, `checking last_worked of ${username}`);
            
            const currentTimestamp = new Date();
            const storedTimestamp = new Date(worked[0].last_worked);
            const differenceMs: number = currentTimestamp.getTime() - storedTimestamp.getTime();
            const differenceHours = Math.floor(differenceMs / (1000 * 60 * 60)); // Convert to hours
            
            if (differenceHours >= 1) {
                await runQuery(con, `UPDATE balance SET balance = balance + 100, last_worked = CURRENT_TIMESTAMP  WHERE username = "${username}"`, `added 100$ for ${username}`);
            } else{
                await interaction.reply(`wait for an hour before you work again!`);
            }
        }

        if(!interaction.replied){
            await interaction.reply(`${username} Worked hard and has earned 100$`);
        }
    }
    
    else if (interaction.commandName === 'send'){
        // sending command logic
        const amount = (interaction as ChatInputCommandInteraction).options.getInteger('amount');
        const recipient = (interaction as ChatInputCommandInteraction).options.getUser('user');
        const sender = interaction.user.username;

        if (!recipient) return interaction.reply('User not found!');
        if (recipient.bot) return interaction.reply("You cannot send money to a bot!");
        if (!amount) return interaction.reply('amount should be more than zero!');

        // logic to check if the sender exsits, if not throw make one entry for him
        const result1 = await runQuery(con, `SELECT 1 FROM balance WHERE username = "${sender}" LIMIT 1;`, "") 
        if (result1.length == 0) {
            await runQuery(con, `INSERT IGNORE INTO balance (username, balance) VALUES ("${sender}", 100);`, `created new user row for ${sender}`)
        }

        const bal = await runQuery(con, `SELECT balance FROM balance WHERE username ="${sender}";`, `Balance queried! for ${sender}`);
        if (bal<amount){
            await interaction.reply(`Not enough balance!`);
        }else{
            // logic to send money
            await runQuery(con, `UPDATE balance SET balance = balance - ${amount} WHERE username = '${sender}';`, `${sender} sent ${amount} to ${recipient.username}`);

            // logic to check if the recipient exsits, if not throw make one entry for him
            const result2 = await runQuery(con, `SELECT 1 FROM balance WHERE username = "${recipient.username}" LIMIT 1;`, "") 
            if (result2.length == 0) {
                await runQuery(con, `INSERT IGNORE INTO balance (username, balance) VALUES ("${recipient.username}", 100);`, `created new user row for ${recipient.username}`)
            }
            
            await runQuery(con, `UPDATE balance SET balance = balance + ${amount} WHERE username = '${recipient.username}';`, `${recipient.username} received ${amount}`);
            await interaction.reply(`${sender} sent ${amount} Dollars to ${recipient.username}.`);
        }

        if (!interaction.replied){
            await interaction.reply(`You can't send money right now! Try again in some time!`);
        }
    } 
    
    else if(interaction.commandName === 'balance') {
        const bal = await runQuery(con, `SELECT balance FROM balance WHERE username ="${interaction.user.username}";`, `Balance queried for ${interaction.user.username}`);
        await interaction.reply(`${bal[0].balance}\$`);
    }

    else if(interaction.commandName === 'ping'){
        await interaction.reply(`pong! ${interaction.user.username}`)
    }
});

client.login(process.env.TOKEN)

endCon(con);