/*global contract, config, it, assert, embark, web3, before, describe, beforeEach*/
const EthUtil = require('ethereumjs-util');
const TestUtils = require("../utils/testUtils");

const License = embark.require('Embark/contracts/License');
const MetadataStore = embark.require('Embark/contracts/MetadataStore');
const Escrow = embark.require('Embark/contracts/Escrow');
const StandardToken = embark.require('Embark/contracts/StandardToken');
const SNT = embark.require('Embark/contracts/SNT');

const FIAT = 0;
const CRYPTO = 1;

let accounts;
const feeAmount = '10';

config({
  deployment: {
    // The order here corresponds to the order of `web3.eth.getAccounts`, so the first one is the `defaultAccount`
    accounts: [
      {
        mnemonic: "foster gesture flock merge beach plate dish view friend leave drink valley shield list enemy",
        balance: "5 ether",
        numAddresses: "10"
      }
    ]
  },
  contracts: {
    "MiniMeToken": { "deploy": false },
    "MiniMeTokenFactory": {

    },
    "SNT": {
      "instanceOf": "MiniMeToken",
      "args": [
        "$MiniMeTokenFactory",
        "0x0000000000000000000000000000000000000000",
        0,
        "TestMiniMeToken",
        18,
        "STT",
        true
      ]
    },
    License: {
      args: ["$SNT", TestUtils.zeroAddress, 10, 86400 * 365]
    },
    MetadataStore: {
      args: ["$License"]
    },
    Escrow: {
      args: ["$License", "$accounts[5]", "$MetadataStore", "$SNT", "0x0000000000000000000000000000000000000001", feeAmount]
    },
    StandardToken: {
    }
  }
}, (_err, web3_accounts) => {
  accounts = web3_accounts;
});

contract("Escrow Funding", function() {
  const {toBN} = web3.utils;
  const value = web3.utils.toWei("0.1", "ether");

  let receipt, escrowId, escrowTokenId, ethOfferId, tokenOfferId, SNTOfferId;

  this.timeout(0);

  before(async () => {
    console.log(License.options.address);
    await SNT.methods.generateTokens(accounts[0], 1000).send();
    const encodedCall = License.methods.buy().encodeABI();
    await SNT.methods.approveAndCall(License.options.address, 10, encodedCall).send({from: accounts[0]});
  
    receipt  = await MetadataStore.methods.addOffer(TestUtils.zeroAddress, License.address, "London", "USD", "Iuri", [0], 0, 1).send({from: accounts[0]});
    ethOfferId = receipt.events.OfferAdded.returnValues.offerId;
    
    receipt  = await MetadataStore.methods.addOffer(StandardToken.options.address, License.address, "London", "USD", "Iuri", [0], 0, 1).send({from: accounts[0]});
    tokenOfferId = receipt.events.OfferAdded.returnValues.offerId;

    receipt  = await MetadataStore.methods.addOffer(SNT.options.address, License.address, "London", "USD", "Iuri", [0], 0, 1).send({from: accounts[0]});
    SNTOfferId = receipt.events.OfferAdded.returnValues.offerId;
  });

  describe("ETH as asset", async () => {
    it("Should fund escrow and deduct an SNT fee", async () => {
      receipt = await Escrow.methods.create(accounts[1], ethOfferId, 123, FIAT, [0], "L", "U").send({from: accounts[0], value});
    });
  });

  describe("SNT as asset", async () => {
    it("0 allowance. Should fail funding", async () => {
      
    });

    it("Allowance less than required amount. Should fail funding", async () => {
      
    });

    it("0 allowance. Approve fee + fund. Should fund escrow and deduct fee", async () => {
      
    });

    it("Allowance less than required amount. Approve amounts. Should fund escrow and deduct fee", async () => {
      
    });
  });

  describe("ERC20 as asset", async () => {
    it("0 allowance. Should fail funding", async () => {
      
    });

    it("Allowance less than required amount. Should fail funding", async () => {
      
    });

    it("0 allowance. Approve fee + fund. Should fund escrow and deduct fee in single transaction", async () => {
      
    });

    it("Allowance less than required amount. Approve amounts. Should fund escrow and deduct fee in single transaction", async () => {
      
    });
  });

});
