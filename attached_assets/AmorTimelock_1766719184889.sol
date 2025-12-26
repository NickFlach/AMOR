// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title AmorTimelock
 * @notice Timelock controller for AMOR governance execution
 * @dev OZ v5 TimelockController; governor becomes proposer, executors can be open or restricted.
 */
contract AmorTimelock is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
