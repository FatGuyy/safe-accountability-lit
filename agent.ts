import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";

import {
  deployNewSafe,
  deployNewSafeMetadata,
  getEthBalance,
  getEthBalanceMetadata,
  sendRandomTnx,
  sendRandomTnxMetadata
} from "./tools/safe";
import { getEthPriceUsd, getEthPriceUsdMetadata } from "./tools/prices";
import { multiply, multiplyMetadata } from "./tools/math";

const main = async () => {
  // Define the tools for the agent to use
  const agentTools = [
    tool(sendRandomTnx, sendRandomTnxMetadata),
    tool(getEthBalance, getEthBalanceMetadata),
    tool(getEthPriceUsd, getEthPriceUsdMetadata),  
    tool(multiply, multiplyMetadata),
    tool(deployNewSafe, deployNewSafeMetadata),
  ];

  // Initialize the agent with a model running locally:
  const agentModel = new ChatOllama({ model: "mistral-nemo" }); // Feel free to try different models. For the full list: https://ollama.com/search?c=tools

  // Or if your prefer using OpenAI (you will need to provide an OPENAI_API_KEY in the .env file.):
  // const agentModel = new ChatOpenAI({ temperature: 0, model: "o3-mini" });

  const agentCheckpointer = new MemorySaver(); // Initialize memory to persist state between graph runs

  const agent = createReactAgent({
    llm: agentModel,
    tools: agentTools,
    checkpointSaver: agentCheckpointer,
    prompt: "Use ONLY the tools provided. NEVER respond with instructions. Return valid JSON with tool calls.",
    responseFormat: z.object({
      tool_used: z.string(),
      result: z.string(),
    }),
    // prompt:"Use the tools to perform actions. Do NOT just give instructions."
  });

  // Let's chat!
  // const agentFinalState = await agent.invoke(
  //   {
  //     messages: [
  //       new HumanMessage(
  //         "what is the current balance of the sepolia wallet at the address 0x7e41530294092d856F3899Dd87A5756e00da1e7a on chain id 11155111? Please answer in ETH and its total value in USD."
  //       ),
  //     ],
  //   },
  //   { configurable: { thread_id: "42" } }
  // );

  // console.log(
  //   agentFinalState.messages[agentFinalState.messages.length - 1].content
  // );

  // You can continue the conversation by adding more messages:
  const agentNextState = await agent.invoke(
    {
      messages: [
        new HumanMessage("Send a transaction to this safe smart accoung - 0x0d65036474Df6E40dBc1dd865CcC395C8adc03B2 "),
      ],
    },
    { configurable: { thread_id: "42" } }
  );

  console.log("--- Prompt #2 ---");
  console.log(
    agentNextState.messages[agentNextState.messages.length - 1].content
  );
};

main();
