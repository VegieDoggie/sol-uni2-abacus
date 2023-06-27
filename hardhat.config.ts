import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-abi-exporter';
import * as dotenv from 'dotenv';
dotenv.config()

const config: HardhatUserConfig = {
  abiExporter: [
    {
      runOnCompile: true,
      clear: true,
      path: './abi-pretty',
      pretty: true
    }
  ],
  networks: {
    local: {
      url: "http://127.0.0.1:8545/"
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-2-s1.binance.org:8545",
      accounts: [process.env.bscTestnet as string],
      timeout: 60000,
    },
    bsc: {
      url: "https://bsc-dataseed1.ninicoin.io",
      accounts: [process.env.bsc as string],
      timeout: 60000,
    },
  },
  solidity: {
    compilers: [
      {version: "0.8.18"}
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 2048,
      },
    }
  },
};

export default config;
