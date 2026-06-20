// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MonsoonMandiEscrow} from "../src/MonsoonMandiEscrow.sol";

/// @notice Deploys MonsoonMandiEscrow to Monad testnet.
///         Reads VERIFIER_ADDRESS, SLASH_RECIPIENT, and DEPLOYER_PK from env.
///         Run:
///         forge script script/Deploy.s.sol:Deploy \
///           --rpc-url monad_testnet --broadcast
contract Deploy is Script {
    function run() external returns (MonsoonMandiEscrow escrow) {
        address verifier = vm.envAddress("VERIFIER_ADDRESS");
        address slashRecipient = vm.envAddress("SLASH_RECIPIENT");
        uint256 deployerKey = vm.envUint("DEPLOYER_PK");

        vm.startBroadcast(deployerKey);
        escrow = new MonsoonMandiEscrow(verifier, slashRecipient);
        vm.stopBroadcast();

        console.log("--------------------------------------------------------");
        console.log("MonsoonMandiEscrow deployed");
        console.log("  address          :", address(escrow));
        console.log("  verifier         :", verifier);
        console.log("  slashRecipient   :", slashRecipient);
        console.log("  AUCTION_DURATION :", escrow.AUCTION_DURATION(), "seconds");
        console.log("  STAKE_AMOUNT     :", escrow.STAKE_AMOUNT(), "wei");
        console.log("  MIN_BOUNTY       :", escrow.MIN_BOUNTY(), "wei");
        console.log("--------------------------------------------------------");
    }
}
