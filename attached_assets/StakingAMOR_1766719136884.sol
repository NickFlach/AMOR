// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./AMOR.sol";
import "./StakedAMOR.sol";

/**
 * @title AMORStaking
 * @notice Stakes AMOR and mints non-transferable stAMOR 1:1.
 * @dev Withdrawal is a 2-step process with a fixed 7-day delay:
 *      - requestUnstake(amount) burns stAMOR immediately (removes governance weight)
 *      - claimUnstake(requestId) after 7 days returns AMOR
 *      - cancelUnstake(requestId) re-mints stAMOR (restores weight) before claim
 *
 * Design intent:
 * - Depth > Speed: exits are slow, entries are immediate.
 * - Consciousness signal may later modulate weight, but cannot bypass stake.
 */
contract AMORStaking is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant WITHDRAWAL_DELAY = 7 days;

    AMOR public immutable amor;
    StakedAMOR public immutable stAmor;

    struct UnstakeRequest {
        uint256 amount;
        uint64 requestedAt;
        uint64 unlockAt;
        bool claimed;
        bool cancelled;
    }

    mapping(address => uint256) public stakedBalance;
    mapping(address => UnstakeRequest[]) private _requests;

    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event UnstakeRequested(address indexed user, uint256 indexed requestId, uint256 amount, uint256 unlockAt);
    event UnstakeCancelled(address indexed user, uint256 indexed requestId, uint256 amount);
    event UnstakeClaimed(address indexed user, uint256 indexed requestId, uint256 amount);

    constructor(address admin, address amorToken, address stAmorToken) {
        require(admin != address(0), "AMORStaking: admin=0");
        require(amorToken != address(0), "AMORStaking: amor=0");
        require(stAmorToken != address(0), "AMORStaking: st=0");

        amor = AMOR(amorToken);
        stAmor = StakedAMOR(stAmorToken);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    // -------------------------
    // Core staking actions
    // -------------------------

    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "AMORStaking: amount=0");

        IERC20(address(amor)).safeTransferFrom(msg.sender, address(this), amount);

        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        // Mint 1:1 stAMOR as governance weight.
        stAmor.mint(msg.sender, amount);

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Initiate an unstake; burns stAMOR immediately, starting the 7-day delay.
     */
    function requestUnstake(uint256 amount) external nonReentrant whenNotPaused returns (uint256 requestId) {
        require(amount > 0, "AMORStaking: amount=0");
        require(stakedBalance[msg.sender] >= amount, "AMORStaking: insufficient");

        // Remove governance weight immediately.
        stAmor.burn(msg.sender, amount);

        // Reduce active stake immediately (prevents using stake while exiting).
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        uint64 nowTs = uint64(block.timestamp);
        uint64 unlockAt = uint64(block.timestamp + WITHDRAWAL_DELAY);

        _requests[msg.sender].push(UnstakeRequest({
            amount: amount,
            requestedAt: nowTs,
            unlockAt: unlockAt,
            claimed: false,
            cancelled: false
        }));

        requestId = _requests[msg.sender].length - 1;

        emit UnstakeRequested(msg.sender, requestId, amount, unlockAt);
    }

    /**
     * @notice Cancel an unstake request before claiming; restores stake + stAMOR weight.
     */
    function cancelUnstake(uint256 requestId) external nonReentrant whenNotPaused {
        UnstakeRequest storage r = _getRequest(msg.sender, requestId);
        require(!r.claimed, "AMORStaking: claimed");
        require(!r.cancelled, "AMORStaking: cancelled");

        r.cancelled = true;

        // Restore active stake and governance weight.
        stakedBalance[msg.sender] += r.amount;
        totalStaked += r.amount;

        stAmor.mint(msg.sender, r.amount);

        emit UnstakeCancelled(msg.sender, requestId, r.amount);
    }

    /**
     * @notice Claim AMOR after the unlock time. Transfers the reserved AMOR out.
     */
    function claimUnstake(uint256 requestId) external nonReentrant {
        UnstakeRequest storage r = _getRequest(msg.sender, requestId);
        require(!r.claimed, "AMORStaking: claimed");
        require(!r.cancelled, "AMORStaking: cancelled");
        require(block.timestamp >= r.unlockAt, "AMORStaking: not unlocked");

        r.claimed = true;

        IERC20(address(amor)).safeTransfer(msg.sender, r.amount);

        emit UnstakeClaimed(msg.sender, requestId, r.amount);
    }

    // -------------------------
    // Views
    // -------------------------

    function requestCount(address user) external view returns (uint256) {
        return _requests[user].length;
    }

    function getRequest(address user, uint256 requestId) external view returns (
        uint256 amount,
        uint256 requestedAt,
        uint256 unlockAt,
        bool claimed,
        bool cancelled
    ) {
        UnstakeRequest storage r = _requests[user][requestId];
        return (r.amount, r.requestedAt, r.unlockAt, r.claimed, r.cancelled);
    }

    function getActiveStake(address user) external view returns (uint256) {
        return stakedBalance[user];
    }

    // -------------------------
    // Admin safety
    // -------------------------

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    /**
     * @dev No “sweep funds” function on purpose. Treasury flows will be governed later.
     *      If you need emergency recovery, we do it through Governor+Timelock in Pass 2.
     */

    // -------------------------
    // Internal helpers
    // -------------------------

    function _getRequest(address user, uint256 requestId) internal view returns (UnstakeRequest storage) {
        require(requestId < _requests[user].length, "AMORStaking: bad id");
        return _requests[user][requestId];
    }
}
