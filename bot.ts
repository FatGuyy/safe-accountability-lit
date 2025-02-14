import { Client, 
        Events, 
        GatewayIntentBits, 
        ChatInputCommandInteraction,
} from 'discord.js';

import 'dotenv/config';
import { createCon, endCon, runQuery } from './bot/database';
import { agent } from './agent';
import { isValidEthereumAddress, isAdmin } from './utils';
import { HumanMessage } from "@langchain/core/messages";

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
    
    // Register Command
    else if(interaction.commandName === 'register') {
        const discordId = interaction.user.id;
        const username = interaction.user.username;
        const ethAddress = interaction.options.get('wallet_address', true)?.value as string;
        console.log("eth add of user - ", isValidEthereumAddress(ethAddress), ethAddress);

        if (isValidEthereumAddress(ethAddress)){
        try {
            // Check if user already exists
            const checkUser = await runQuery(con, `SELECT * FROM users WHERE discord_id = ${discordId}`, `Checking if user - ${username} already exists in the table`);
            if (checkUser.length > 0) {
                return interaction.reply({ content: 'You are already registered.' });
            }
    
            // Insert user into database
            await runQuery(con, 
                `INSERT INTO users (discord_id, username, eth_address) VALUES (${discordId}, "${username}", "${ethAddress}")`, `Inseted New User - ${username} with ${ethAddress} in the database!`
            );
    
            interaction.reply({ content: `Successfully registered! 🎉\nYour ETH Address: ${ethAddress}` });
        } catch (error) {
            console.error('Error registering user:', error);
            interaction.reply({ content: 'Error registering. Please try again later.' });
        }}
        else{
            interaction.reply({content:`Please enter an valid ETH address`});
        }

        await interaction.reply(`Huge Error registering. Please try again later.`);
    }

    // start_bet Command
    else if(interaction.commandName === 'start_bet') {
        await interaction.deferReply();
        await interaction.editReply({ content: "Deploying New Safe for you...." });
        const discordId = interaction.user.id;
        const bet_desc = interaction.options.get('description', true)?.value as string;
        const depositAmt = interaction.options.get('deposit_fee', true)?.value as Number; // USDC
        const duration = interaction.options.get('duration', true)?.value as Number; // In hours

        // if (!isAdmin(interaction)) {
        //     return interaction.reply({ content: "You must be an admin to use this command.", ephemeral: true });
        // }

        // Call agent to deploy safe!
        // const agentFinalState = await agent.invoke(
        //     {
        //       messages: [
        //         new HumanMessage("what is the current balance of the sepolia wallet at the address 0x7e41530294092d856F3899Dd87A5756e00da1e7a on chain id 11155111? Please answer in ETH and its total value in USD."),
        //       ],
        //     },
        //     { configurable: { thread_id: "42" } }
        //   );
        
        const content = `**🌐 Safe Multisignature Wallet Deployed Successfully 🌐**
          Here are the details of your newly deployed Safe multisig wallet on Sepolia:
              
          - **Safe Address:** sep:0xD4d71F522EFCE5AFB604B8A3B4E1dc12886b1D5f
          - **Salt Nonce:** 6017049909
              
          You can interact with your new Safe wallet using the following link:
              
          https://app.safe.global/home?safe=sep%3A0xD4d71F522EFCE5AFB604B8A3B4E1dc12886b1D5f
              
          **⚠️ Remember to keep your recovery phrases and master seed safe! ⚠️**
              
          If you need any further assistance or have other requests, feel free to ask!
              
          Happy managing your funds securely with Safe! 🔒💰`
        
        const contentString = String(content);
        const safeAddressMatch = contentString.match(/0x[a-fA-F0-9]{40}/);
        const safeAddress = safeAddressMatch ? safeAddressMatch[0] : null;

        if (!safeAddress) {
          console.error("Safe address not found in response.");
          await interaction.editReply("Failed to retrieve Safe address.");
          return;
        }

        try {
            const createNewBet = await runQuery(
                con, 
                `INSERT INTO bets (creator_discord_id, deposit_amount, wallet_address, duration, description)  
                VALUES ('${discordId}', ${depositAmt}, '${safeAddress}', ${duration}, '${bet_desc}');`,
                `Created a new bet in the bets table!`
            );
            console.log("new created Bet - ",createNewBet);

            await interaction.followUp(`✅ Bet created successfully!\n\nSafe Address: \`${safeAddress}\`\n\n${content}`);
        }catch(error){
            console.error("Database error:", error);
            await interaction.followUp("❌ Failed to create bet in the database.");
        }

        // await interaction.editReply(`Some error occured!`);
    }

    else if(interaction.commandName === 'ping'){
        await interaction.reply(`pong! ${interaction.user.tag}`)
    }
});

client.login(process.env.TOKEN)

endCon(con);