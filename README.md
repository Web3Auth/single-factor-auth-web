# Web3Auth Single Factor Auth

[![npm version](https://img.shields.io/npm/v/@web3auth/single-factor-auth?label=%22%22)](https://www.npmjs.com/package/@web3auth/single-factor-auth/v/latest)
[![minzip](https://img.shields.io/bundlephobia/minzip/@web3auth/single-factor-auth?label=%22%22)](https://bundlephobia.com/result?p=@web3auth/single-factor-auth@latest)

> Web3Auth is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

Web3Auth Single Factor Auth is the SDK that gives you the ability to start with just one key (aka, Single Factor) with Web3Auth, giving you the flexibility of implementing your own UI and UX.

## 📖 Documentation

Checkout the official [Web3Auth Documentation](https://web3auth.io/docs/sdk/core-kit/sfa) to get started.

## 💡 Features

- JWT based Web3 Authentication Service
- Fully decentralized, non-custodial key infrastructure
- End to end Whitelabelable solution
- Threshold Cryptography based Key Reconstruction
- Multi Factor Authentication Setup & Recovery (Includes password, backup phrase, device factor editing/deletion etc)
- Support for WebAuthn & Passwordless Login
- Support for connecting to multiple wallets
- DApp Active Session Management

...and a lot more

## 🔗 Installation

```shell
npm install --save @web3auth/single-factor-auth
```

## ⚡ Quick Start

### Get your Client ID from Web3Auth Dashboard

Hop on to the [Web3Auth Dashboard](https://dashboard.web3auth.io/) and create a new project. Use the Client ID of the project to start your integration.

![Web3Auth Dashboard](https://camo.githubusercontent.com/15b4c47aed7958ed46b82d4e1cc882931fa378dc42328f67759007a341f593de/68747470733a2f2f6769746875622d70726f64756374696f6e2d757365722d61737365742d3632313064662e73332e616d617a6f6e6177732e636f6d2f363936323536352f3237323737393436342d30343366363338332d653637312d346161352d383066622d6563383763353639653561622e706e67)

### Initialize Web3Auth for your preferred blockchain

Web3Auth needs to initialize as soon as your app loads up to enable the user to log in. Preferably done within a constructor, initialization is the step where you can pass on all the configurations for Web3Auth you want. A simple integration for Ethereum blockchain will look like this:

**Note**
This package can only be used with verifiers created on the developer dashboard.

```js
import { Web3Auth } from "@web3auth/single-factor-auth";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

//Initialize within your constructor
const web3auth = new Web3Auth({
  clientId: "", // Get your Client ID from Web3Auth Dashboard
  web3AuthNetwork: "mainnet",
  usePnPKey: false, // Setting this to true returns the same key as PnP Web SDK.
  // By default, this SDK returns CoreKitKey.
});

const chainConfig: {
  chainNamespace: "eip155",
  chainId: "0x1",
  rpcTarget: "https://rpc.ankr.com/eth",
};

const provider = new EthereumPrivateKeyProvider({ config: { chainConfig } })

await web3auth.init(provider);
```

### Login your User

Once you're done initialising, just create a button that triggers login with the JWT and verifier details.

```js
await web3auth.connect({
  verifier: "verifier-name", // e.g. `web3auth-sfa-verifier` replace with your verifier name, and it has to be on the same network passed in init().
  verifierId: "verifier-id-value", // e.g. `Yux1873xnibdui` or `name@email.com` replace with your verifier id(sub or email)'s value.
  idToken: "JWT Token", // replace with your newly created unused JWT Token.
});
```

## 🩹 Examples

Checkout the examples for your preferred blockchain and platform in our [examples repository](https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/single-factor-auth)

## 🌐 Demo

Checkout the [Web3Auth Demo](https://w3a.link/one-key-example) to see how Web3Auth SFA can be used in your application.

## 💬 Troubleshooting and Support

- Have a look at our [Community Portal](https://community.web3auth.io/) to see if anyone has any questions or issues you might be having. Feel free to reate new topics and we'll help you out as soon as possible.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions.
- For Priority Support, please have a look at our [Pricing Page](https://web3auth.io/pricing.html) for the plan that suits your needs.
