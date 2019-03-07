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
const feeAmount = 10;
const fundAmount = 100;

config({
  deployment: {
    // The order here corresponds to the order of `web3.eth.getAccounts`, so the first one is the `defaultAccount`
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

  let expirationTime = parseInt((new Date()).getTime() / 1000, 10) + 1000;
  
  let receipt, escrowId, escrowTokenId, ethOfferId, tokenOfferId, SNTOfferId, encodedCall;
  let StandardTokenAddress, SNTTokenAddress;
  
  this.timeout(0);

  before(async () => {
    await StandardToken.methods.mint(accounts[0], 100000000).send();
    await SNT.methods.generateTokens(accounts[0], 100000000).send();
    const encodedCall = License.methods.buy().encodeABI();
    await SNT.methods.approveAndCall(License.options.address, 10, encodedCall).send({from: accounts[0]});
  
    StandardTokenAddress = StandardToken.options.address;
    SNTTokenAddress = SNT.options.address;  

    receipt  = await MetadataStore.methods.addOffer(TestUtils.zeroAddress, License.address, "London", "USD", "Iuri", [0], 0, 1).send({from: accounts[0]});
    ethOfferId = receipt.events.OfferAdded.returnValues.offerId;
    
    receipt  = await MetadataStore.methods.addOffer(StandardToken.options.address, License.address, "London", "USD", "Iuri", [0], 0, 1).send({from: accounts[0]});
    tokenOfferId = receipt.events.OfferAdded.returnValues.offerId;

    receipt  = await MetadataStore.methods.addOffer(SNT.options.address, License.address, "London", "USD", "Iuri", [0], 0, 1).send({from: accounts[0]});
    SNTOfferId = receipt.events.OfferAdded.returnValues.offerId;
  });

  describe("ETH as asset", async () => {
    beforeEach(async () => {
      receipt = await Escrow.methods.create(accounts[1], ethOfferId, 123, FIAT, [0], "L", "U")
                                    .send({from: accounts[0]});
      
      escrowId = receipt.events.Created.returnValues.escrowId;
    });

    it("Should fund escrow and deduct an SNT fee", async () => {    
      // Still requires 2 transactions, because approveAndCall cannot send ETH
      // TODO: test if inside the contract we can encode the call, and call approveAndCall

      await SNT.methods.approve(Escrow.options.address, feeAmount).send({from: accounts[0]});
      
      receipt = await Escrow.methods.fund(escrowId, value, expirationTime)
                                    .send({from: accounts[0], value});

    });
  });

  describe("SNT as asset", async () => {
    beforeEach(async () => {
      // Reset allowance
      await SNT.methods.approve(Escrow.options.address, "0").send({from: accounts[0]});

      receipt = await Escrow.methods.create(accounts[1], SNTOfferId, 123, FIAT, [0], "L", "U")
                                    .send({from: accounts[0]});
      
      escrowId = receipt.events.Created.returnValues.escrowId;
    });

    it("0 allowance. Approve fee + fund. Should fund escrow and deduct fee", async () => {
      const accountBalanceBefore = await SNT.methods.balanceOf(accounts[0]).call();
      const contractBalanceBefore = await SNT.methods.balanceOf(Escrow.options.address).call();

      // should approve for a 110 allowance
      encodedCall = Escrow.methods.fund(escrowId, 100, expirationTime).encodeABI();
      receipt = await SNT.methods.approveAndCall(Escrow.options.address, 110, encodedCall).send({from: accounts[0]});
    
      const accountBalanceAfter = await SNT.methods.balanceOf(accounts[0]).call();
      const contractBalanceAfter = await SNT.methods.balanceOf(Escrow.options.address).call();

      assert(toBN(accountBalanceBefore), toBN(accountBalanceAfter).sub(toBN(110)), "Fee and funds weren't deducted from account");
      assert(toBN(contractBalanceBefore), toBN(contractBalanceAfter).add(toBN(110)), "Fee and funds weren't sent to contract");
    });

    it("Allowance less than required amount. Should fail funding", async () => {
      try { // Trying with no SNT 0
        encodedCall = Escrow.methods.fund(escrowId, 100, expirationTime).encodeABI();
        receipt = await SNT.methods.approveAndCall(Escrow.options.address, 0, encodedCall).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch(err) {
        assert.strictEqual(err.message, "VM Exception while processing transaction: revert Amount should include fee");
      }

      try { // Trying with only the fee
        encodedCall = Escrow.methods.fund(escrowId, 100, expirationTime).encodeABI();
        receipt = await SNT.methods.approveAndCall(Escrow.options.address, feeAmount, encodedCall).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch(err) {
        assert.strictEqual(err.message, "VM Exception while processing transaction: revert Allowance not set for this contract for specified amount");
      }

      try { // Trying with only the fundAmount
        encodedCall = Escrow.methods.fund(escrowId, 100, expirationTime).encodeABI();
        receipt = await SNT.methods.approveAndCall(Escrow.options.address, 100, encodedCall).send({from: accounts[0]});
        assert.fail('should have reverted before');
      } catch(err) {
        assert.strictEqual(err.message, "VM Exception while processing transaction: revert Allowance not set for this contract for specified amount");
      }
    });

   
  });

  describe("ERC20 as asset", async () => {
    xit("0 allowance. Should fail funding", async () => {
      
    });

    xit("Allowance less than required amount. Should fail funding", async () => {
      
    });

    xit("0 allowance. Approve fee + fund. Should fund escrow and deduct fee in single transaction", async () => {
      
    });

  });

  describe("Standard dapp flow", async () => {
    let escrowIdSNT, escrowIdToken;
    beforeEach(async () => {
      // Reset allowance
      await SNT.methods.approve(Escrow.options.address, "0").send({from: accounts[0]});
      await StandardToken.methods.approve(Escrow.options.address, "0").send({from: accounts[0]});

      receipt = await Escrow.methods.create(accounts[1], SNTOfferId, 123, FIAT, [0], "L", "U")
                                    .send({from: accounts[0]});
      escrowIdSNT = receipt.events.Created.returnValues.escrowId;

      receipt = await Escrow.methods.create(accounts[1], tokenOfferId, 123, FIAT, [0], "L", "U")
                                    .send({from: accounts[0]});
      escrowIdToken = receipt.events.Created.returnValues.escrowId;

    });


    const func = async (token, escrowId) => {
      const tokenAllowance = await token.methods.allowance(accounts[0], Escrow.options.address).call();
      const sntAllowance = await SNT.methods.allowance(accounts[0], Escrow.options.address).call();

      const toSend = Escrow.methods.fund(escrowId, fundAmount, expirationTime);

      let amountToApprove = fundAmount;
      
      if (token.options.address === SNT.options.address){
        amountToApprove += feeAmount;
        if(toBN(sntAllowance).eq(toBN(amountToApprove))){
          receipt = await toSend.send({from: accounts[0]});
        } else {
          if(toBN(sntAllowance).gt(toBN(0))){
            // Reset approval 
            // due to: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
            await token.methods.approve(Escrow.options.address, "0").send({from: accounts[0]});
          }
          receipt = await token.methods.approveAndCall(Escrow.options.address, amountToApprove, encodedCall)
                                       .send({from: accounts[0]});
        } 
      } else {
        encodedCall = toSend.encodeABI();
        if(!toBN(tokenAllowance).eq(toBN(amountToApprove))){
          if(toBN(tokenAllowance).gt(toBN(0))){ // Reset approval 
            await token.methods.approve(Escrow.options.address, "0").send({from: accounts[0]});
          }
          await token.methods.approve(Escrow.options.address, amountToApprove).send({from: accounts[0]});
        }
        receipt = await SNT.methods.approveAndCall(Escrow.options.address, feeAmount, encodedCall)
                                   .send({from: accounts[0]});
      }
    };

    it("Allowance different than funds and fee. Token is SNT", async () => {
      const amount = toBN(feeAmount).add(toBN(fundAmount)).add(toBN(1000)).toString(10);
      await SNT.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});
      await func(SNT, escrowIdSNT);
    });

    it("Allowance equals to funds and fee. Token is SNT", async () => {
      const amount = toBN(feeAmount).add(toBN(fundAmount)).toString(10);
      await SNT.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});
      await func(SNT, escrowIdSNT);
    });

    it("Allowance different than required funds. Token is not SNT.", async () => {
      const amount = toBN(feeAmount).add(toBN(fundAmount)).add(toBN(1000)).toString(10);
      await StandardToken.methods.approve(Escrow.options.address, amount).send({from: accounts[0]});
      await func(StandardToken, escrowIdToken);
    });

    it("Allowance equal to required funds. Token is not SNT.", async () => {
      await StandardToken.methods.approve(Escrow.options.address, fundAmount).send({from: accounts[0]});
      await func(StandardToken, escrowIdToken);
    });

  });

});
