pragma solidity ^0.5.0;

import "./Proxy.sol";
import "./UpdatableProxyShared.sol";

contract UpdatableProxy is Proxy, UpdatableProxyShared {
    constructor(address proxied, address owner)
        public
        Proxy(proxied)
        OwnableData(owner)
    {}

    function proxyType() public pure returns (uint256) {
        return 2; // for "upgradable proxy"
                  // again, see EIP 897
    }
}