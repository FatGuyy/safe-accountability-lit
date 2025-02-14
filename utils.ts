import { CommandInteraction, PermissionFlagsBits } from 'discord.js';

export function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export const isAdmin = (interaction: CommandInteraction): boolean => {
    return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
};