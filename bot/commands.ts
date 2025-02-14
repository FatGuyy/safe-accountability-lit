import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();


const commands = [
    new SlashCommandBuilder()
        .setName('work')
        .setDescription('Gives 100$')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your balance')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('send')
        .setDescription('Sends Money to someone')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('The amount to send')
                .setRequired(true)
        )
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The recipient')
                .setRequired(true)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('says pong')
        .toJSON(),
];

(async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);

  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();
