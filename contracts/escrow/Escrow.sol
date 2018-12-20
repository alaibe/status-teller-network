pragma solidity ^0.5.0;

import "../common/Ownable.sol";
import "../common/Pausable.sol";
import "../license.sol";
import "./EscrowData.sol";
import "../proxy/UpdatableProxyImplementation.sol";

/**
 * @title Escrow
 * @dev Escrow contract for buying/selling ETH. Current implementation lacks arbitrage, marking trx as paid, and ERC20 support
 */
contract Escrow is UpdatableProxyImplementation, EscrowData, Pausable {

    constructor(address _license) public OwnableData(msg.sender){
        init(_license, msg.sender);
    }
    
    function init(address _license, address _ownerAddress) internal {
        require(address(license) == address(0) , "Already initialized");
        license = License(_license); 
        owner = _ownerAddress;
    }

    /**
     * @dev Create a new escrow
     * @param _buyer The address that will perform the buy for the escrow
     * @param _expirationTime Unix timestamp before the transaction is considered expired
     * @notice Requires contract to be unpaused.
     *         The seller needs to be licensed.
     *         The expiration time must be at least 10min in the future
     */
    function create(address payable _buyer, uint _expirationTime) payable public whenNotPaused {
        require(_expirationTime > (block.timestamp + 600), "Expiration time must be at least 10min in the future");
        require(msg.value > 0, "ETH amount is required"); // TODO: abstract this to use ERC20. Maybe thru the use of wETH
        require(license.isLicenseOwner(msg.sender), "Must be a valid seller to create escrow transactions");

        uint escrowId = transactions.length++;

        transactions[escrowId].seller = msg.sender;
        transactions[escrowId].buyer = _buyer;
        transactions[escrowId].amount = msg.value;
        transactions[escrowId].expirationTime = _expirationTime;
        transactions[escrowId].released = false;
        transactions[escrowId].canceled = false;

        emit Created(msg.sender, _buyer, msg.value, escrowId);
    }


    /**
     * @dev Release escrow funds to buyer
     * @param _escrowId Id of the escrow
     * @notice Requires contract to be unpaused.
     *         Can only be executed by the seller
     *         Transaction must not be expired, or previously canceled or released
     */
    function release(uint _escrowId) public whenNotPaused {
        require(_escrowId < transactions.length, "Invalid escrow id");

        EscrowTransaction storage trx = transactions[_escrowId];

        require(trx.released == false, "Transaction already released");
        require(trx.canceled == false, "Transaction already canceled");
        require(trx.expirationTime > block.timestamp, "Transaction already expired");
        require(trx.seller == msg.sender, "Function can only be invoked by the escrow owner");
        
        trx.released = true;
        trx.buyer.transfer(trx.amount); // TODO: transfer fee to Status

        emit Paid(_escrowId);
    }

    /**
     * @dev Cancel an escrow operation
     * @param _escrowId Id of the escrow
     * @notice Requires contract to be unpaused.
     *         Can only be executed by the seller
     *         Transaction must not be expired, or previously canceled or released
     */
    function cancel(uint _escrowId) public whenNotPaused {
        require(_escrowId < transactions.length, "Invalid escrow id");

        EscrowTransaction storage trx = transactions[_escrowId];

        require(trx.released == false, "Transaction already released");
        require(trx.canceled == false, "Transaction already canceled");
        require(trx.seller == msg.sender, "Function can only be invoked by the escrow owner");
        
        trx.canceled = true;
        trx.seller.transfer(trx.amount);

        emit Canceled(_escrowId);
    }

    
    /**
     * @dev Withdraws funds to the sellers in case of emergency
     * @param _escrowId Id of the escrow
     * @notice Requires contract to be paused.
     *         Can be executed by anyone
     *         Transaction must not be canceled or released
     */
    function withdraw_emergency(uint _escrowId) public whenPaused {
        require(_escrowId < transactions.length, "Invalid escrow id");

        EscrowTransaction storage trx = transactions[_escrowId];

        require(trx.released == false, "Transaction already released");
        require(trx.canceled == false, "Transaction already canceled");
        
        trx.canceled = true;
        trx.seller.transfer(trx.amount);

        emit Canceled(_escrowId);
    }
}
