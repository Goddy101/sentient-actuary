// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SentientVault} from "../src/SentientVault.sol";

contract DeployVault is Script {
    function run() external returns (SentientVault) {
        // This grabs the private key from My.env file automatically
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // For the War Room, we use dummy addresses for external contracts.
        // 
        address mockRouter = address(0x1);
        address mockAgent = vm.addr(deployerPrivateKey); 
        address mockPriceFeed = address(0x3);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the Vault!
        SentientVault vault = new SentientVault(mockRouter, mockAgent, mockPriceFeed);

        vm.stopBroadcast();
        
        console.log("=========================================");
        console.log("Sentient Vault Deployed to:", address(vault));
        console.log("=========================================");
        
        return vault;
    }
}