// https://metamask.app.link/send/{contract_address}?value={amount}&asset={token_symbol}&to={recipient_address}

import { privateKeyToAddress } from 'viem/accounts'
import { createSafeClient } from '@safe-global/sdk-starter-kit'
// import { generateTransferCallData } from './utils';

const RPC_URL = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;
const usdcTokenAddress = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const usdcAmount = 1_000_000n;

async function send() {
    const owner1 = privateKeyToAddress(process.env.AGENT_PRIVATE_KEY as `0x${string}`);
    // const owner2 = privateKeyToAddress(OWNER_2_PRIVATE_KEY)
    // const owner3 = privateKeyToAddress(OWNER_3_PRIVATE_KEY)
  
    const safeClient = await createSafeClient({
      provider: RPC_URL,
      signer: process.env.AGENT_PRIVATE_KEY,
      safeOptions: {
        owners: [owner1],
        threshold: 1
      }
    })
  
    const safeAddress = await safeClient.protocolKit.getAddress()
    console.log('-Safe Address:', safeAddress)
  
    // Send 1 USDC from each owner to the Safe wallet

    const deepLink = `https://metamask.app.link/send/${usdcTokenAddress}?value=${usdcAmount}&asset=USDC&to=${safeAddress}`

    // await message.reply(`Click here to pay 1 USDC: ${deepLink}`)

  
    // Now execute the original Safe transactions
    
  }
  