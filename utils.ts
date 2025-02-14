import { CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { createPublicClient, http, Address, Hash, parseEventLogs, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';
import {
  createSafeClient,
} from '@safe-global/sdk-starter-kit';

const ABI = [{"inputs":[{"internalType":"address","name":"_singleton","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"stateMutability":"payable","type":"fallback"}];
const RPC_URL = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;
const USDC_ADDRESS: Address = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const ERC20_ABI = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 value)']);


export function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export const isAdmin = (interaction: CommandInteraction): boolean => {
    return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ?? false;
};

export async function verifyUSDCTransfer(
  txHash: Hash,
  expectedSender: Address,
  expectedReceiver: Address,
  expectedAmount: bigint
): Promise<boolean> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`)
  });
  try {
    // Fetch transaction receipt (ERC-20 transfers are in logs, not in transaction details)
    const receipt = await client.getTransactionReceipt({ hash: txHash });

    if (!receipt) {
      console.log('Transaction receipt not found.');
      return false;
    }

    // Parse event logs for Transfer events from the USDC contract
    const transferLogs = parseEventLogs({
      abi: ERC20_ABI,
      logs: receipt.logs,
      eventName: 'Transfer'
    });

    // Find a matching transfer event
    for (const log of transferLogs) {
      if (
        log.address.toLowerCase() === USDC_ADDRESS.toLowerCase() && // Must be from USDC contract
        log.args.from.toLowerCase() === expectedSender.toLowerCase() &&
        log.args.to.toLowerCase() === expectedReceiver.toLowerCase() &&
        log.args.value === expectedAmount
      ) {
        console.log('USDC Transfer verified successfully!');
        return true;
      }
    }

    console.log('USDC Transfer verification failed!');
    return false;
  } catch (error) {
    console.error('Error verifying USDC transfer:', error);
    return false;
  }
}

export const addOwner = async (safeAddress: string = "0x53b2b1795ed7C16C7956c86a131F3B546D668d1d", newOwner: string) =>{

	const safeClient = await createSafeClient({
		provider: RPC_URL,
		signer: process.env.AGENT_PRIVATE_KEY,
		safeAddress: '0x53b2b1795ed7C16C7956c86a131F3B546D668d1d',
	});
	console.log("safe Cleint - ", safeClient);
  const transaction = await safeClient.createAddOwnerTransaction({
    ownerAddress: '0x...',
    threshold: 2
  })

  const txResult = await safeClient.send({
    transactions: [transaction]
  })
  
  console.log(await txResult);
};
