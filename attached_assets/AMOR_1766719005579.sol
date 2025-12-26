// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AMOR
 * @notice Base token of the system. AMOR represents durable alignment, care, and commitment.
 * @dev Governance weight is intended to come from staked representation (stAMOR), not raw AMOR balance.
 */
contract AMOR is ERC20, ERC20Permit, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public immutable MAX_SUPPLY;

    constructor(
        address admin,
        uint256 maxSupply,
        address initialReceiver,
        uint256 initialMint
    )
        ERC20("AMOR", "AMOR")
        ERC20Permit("AMOR")
    {
        require(admin != address(0), "AMOR: admin=0");
        require(initialReceiver != address(0), "AMOR: receiver=0");
        require(maxSupply > 0, "AMOR: max=0");
        require(initialMint <= maxSupply, "AMOR: init>max");

        MAX_SUPPLY = maxSupply;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        if (initialMint > 0) _mint(initialReceiver, initialMint);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "AMOR: max supply");
        _mint(to, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
