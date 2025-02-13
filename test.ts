import {
  createSafeClient,
  // safeOperations,
  // BundlerOptions
} from '@safe-global/sdk-starter-kit';
// import { PaymasterOptions } from '@safe-global/relay-kit' 

const ABI = [{"inputs":[{"internalType":"address","name":"_singleton","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"stateMutability":"payable","type":"fallback"}];
const RPC_URL = `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`;

const sendRandomTnx = async (safeAddress: string = "0x53b2b1795ed7C16C7956c86a131F3B546D668d1d") =>{

	const safeClient = await createSafeClient({
		provider: RPC_URL,
		signer: process.env.AGENT_PRIVATE_KEY,
		safeAddress: '0x53b2b1795ed7C16C7956c86a131F3B546D668d1d',
	});
	console.log("safe Cleint - ", safeClient);
  const some = safeClient.getOwners();
  
  console.log(await some);
};

sendRandomTnx("0x53b2b1795ed7C16C7956c86a131F3B546D668d1d");