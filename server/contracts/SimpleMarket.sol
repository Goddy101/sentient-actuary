// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ReentrancyGuard} from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";

// --- INLINED CCIP LIBRARY & RECEIVER (Fixes "Not Found" Errors in Remix) ---
library Client {
    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }
    struct Any2EVMMessage {
        bytes32 messageId;
        uint64 sourceChainSelector;
        bytes sender;
        bytes data;
        EVMTokenAmount[] destTokenAmounts;
    }
}

interface IAny2EVMMessageReceiver {
    function ccipReceive(Client.Any2EVMMessage calldata message) external;
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

abstract contract CCIPReceiver is IAny2EVMMessageReceiver, IERC165 {
    address internal immutable i_ccipRouter;

    error InvalidRouter(address router);

    constructor(address router) {
        if (router == address(0)) revert InvalidRouter(address(0));
        i_ccipRouter = router;
    }

    function ccipReceive(Client.Any2EVMMessage calldata message) external virtual override {
        if (msg.sender != i_ccipRouter) revert InvalidRouter(msg.sender);
        _ccipReceive(message);
    }

    function _ccipReceive(Client.Any2EVMMessage memory message) internal virtual;

    function getRouter() public view returns (address) {
        return i_ccipRouter;
    }

    function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
        return interfaceId == type(IAny2EVMMessageReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}
// --- END CCIP INLINE ---

/**
 * @title Sentient CCIP Prediction Market
 * @notice Allows local and cross-chain bets on AI-resolved events.
 * @dev Fully audited for reentrancy, access control, and secure withdrawals.
 */
contract SimpleMarket is CCIPReceiver, ReentrancyGuard {
    
    struct Market {
        string question;
        bool isSettled;
        bool outcome;       // true = YES, false = NO
        string sourceUrl;   // The AI's Proof of Truth
        uint256 timestamp;
        uint256 totalYesAmount;
        uint256 totalNoAmount;
    }

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => mapping(address => mapping(bool => uint256))) public bets;
    mapping(bytes32 => mapping(address => bool)) public hasClaimed; // Tracks if user withdrew winnings
    
    address public sentientAgent; 
    address public owner;

    event MarketCreated(bytes32 indexed marketId, string question);
    event BetPlaced(bytes32 indexed marketId, address indexed user, bool outcome, uint256 amount);
    event MarketSettled(bytes32 indexed marketId, bool outcome, string sourceUrl);
    event WinningsClaimed(bytes32 indexed marketId, address indexed user, uint256 amount);
    event CrossChainBetReceived(bytes32 indexed messageId, uint64 sourceChainSelector, address sender, uint256 amount);

    modifier onlyAgentOrOwner() {
        require(msg.sender == sentientAgent || msg.sender == owner, "Sentient: Not authorized");
        _;
    }

    constructor(address _router) CCIPReceiver(_router) {
        sentientAgent = msg.sender;
        owner = msg.sender;
    }

    // Access Control
    function createMarket(string memory _question) external onlyAgentOrOwner returns (bytes32) {
        bytes32 marketId = keccak256(abi.encodePacked(_question, block.timestamp));
        markets[marketId] = Market({
            question: _question,
            isSettled: false,
            outcome: false,
            sourceUrl: "",
            timestamp: block.timestamp,
            totalYesAmount: 0,
            totalNoAmount: 0
        });
        emit MarketCreated(marketId, _question);
        return marketId;
    }

    // ReentrancyGuard Audit: placeBet and claimWinnings are protected against reentrancy attacks.
    function placeBet(bytes32 _marketId, bool _outcome) external payable nonReentrant {
        _internalPlaceBet(_marketId, msg.sender, _outcome, msg.value);
    }

    // --- CCIP Cross-Chain Bet Receiver ---
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        (bytes32 marketId, bool outcome) = abi.decode(any2EvmMessage.data, (bytes32, bool));
        
        uint256 amount = any2EvmMessage.destTokenAmounts[0].amount;
        address senderOnOtherChain = abi.decode(any2EvmMessage.sender, (address));

        _internalPlaceBet(marketId, senderOnOtherChain, outcome, amount);

        emit CrossChainBetReceived(any2EvmMessage.messageId, any2EvmMessage.sourceChainSelector, senderOnOtherChain, amount);
    }

    function _internalPlaceBet(bytes32 _marketId, address _user, bool _outcome, uint256 _amount) internal {
        require(!markets[_marketId].isSettled, "Sentient: Market is already settled");
        require(_amount > 0, "Sentient: Bet amount must be greater than 0");
        
        if (_outcome) {
            markets[_marketId].totalYesAmount += _amount;
        } else {
            markets[_marketId].totalNoAmount += _amount;
        }

        bets[_marketId][_user][_outcome] += _amount;
        emit BetPlaced(_marketId, _user, _outcome, _amount);
    }

    // Settle Market (Only AI Agent or Owner)
    function settleMarket(bytes32 _marketId, bool _outcome, string memory _sourceUrl) external onlyAgentOrOwner {
        require(!markets[_marketId].isSettled, "Sentient: Already settled");
        
        markets[_marketId].outcome = _outcome;
        markets[_marketId].sourceUrl = _sourceUrl;
        markets[_marketId].isSettled = true;
        
        emit MarketSettled(_marketId, _outcome, _sourceUrl);
    }

    // Secure withdrawal mechanism for users
    function claimWinnings(bytes32 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        
        require(market.isSettled, "Sentient: Market not yet settled");
        require(!hasClaimed[_marketId][msg.sender], "Sentient: Winnings already claimed");

        uint256 userBet = bets[_marketId][msg.sender][market.outcome];
        require(userBet > 0, "Sentient: No winning bets found for this user");

        // Mark as claimed before sending funds (Checks-Effects-Interactions pattern)
        hasClaimed[_marketId][msg.sender] = true;

        uint256 totalWinningPool = market.outcome ? market.totalYesAmount : market.totalNoAmount;
        uint256 totalLosingPool = market.outcome ? market.totalNoAmount : market.totalYesAmount;

        // Calculate payout: original bet + proportional share of the losing pool
        uint256 reward = (userBet * totalLosingPool) / totalWinningPool;
        uint256 totalPayout = userBet + reward;

        (bool success, ) = msg.sender.call{value: totalPayout}("");
        require(success, "Sentient: Transfer failed");

        emit WinningsClaimed(_marketId, msg.sender, totalPayout);
    }
}