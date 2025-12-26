// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title StakedAMOR (stAMOR)
 * @notice Non-transferable staking receipt + governance weight token.
 * @dev OZ v5 compatible. Transfers are blocked at the _update layer.
 */
contract StakedAMOR is ERC20, ERC20Permit, ERC20Votes, AccessControl, Pausable {
    bytes32 public constant STAKING_CONTRACT_ROLE = keccak256("STAKING_CONTRACT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    error NonTransferable();

    constructor(address admin)
        ERC20("Staked AMOR", "stAMOR")
        ERC20Permit("Staked AMOR")
    {
        require(admin != address(0), "stAMOR: admin=0");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /*//////////////////////////////////////////////////////////////
                                MINT / BURN
    //////////////////////////////////////////////////////////////*/

    function mint(address to, uint256 amount)
        external
        onlyRole(STAKING_CONTRACT_ROLE)
    {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount)
        external
        onlyRole(STAKING_CONTRACT_ROLE)
    {
        _burn(from, amount);
    }

    /*//////////////////////////////////////////////////////////////
                                PAUSE
    //////////////////////////////////////////////////////////////*/

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                        OZ v5 TRANSFER CONTROL
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev OZ v5 unified hook.
     * Blocks transfers except mint (from=0) and burn (to=0).
     * Also drives ERC20Votes checkpoints.
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
        whenNotPaused
    {
        if (from != address(0) && to != address(0)) {
            revert NonTransferable();
        }
        super._update(from, to, value);
    }

    /*//////////////////////////////////////////////////////////////
                            REQUIRED OVERRIDES
    //////////////////////////////////////////////////////////////*/

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
