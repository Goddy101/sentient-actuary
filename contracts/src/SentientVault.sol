// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// --- INLINED CCIP LIBRARY & RECEIVER (Ensures zero missing-file errors) ---
library Client {
    struct EvmTokenAmount {
        address token;
        uint256 amount;
    }
    struct Any2EvmMessage {
        bytes32 messageId;
        uint64 sourceChainSelector;
        bytes sender;
        bytes data;
        EvmTokenAmount[] destTokenAmounts;
    }
}

interface IAny2EVMMessageReceiver {
    function ccipReceive(Client.Any2EvmMessage calldata message) external;
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

abstract contract CCIPReceiver is IAny2EVMMessageReceiver, IERC165 {
    address internal immutable I_CCIP_ROUTER;

    error InvalidRouter(address router);

    constructor(address router) {
        if (router == address(0)) revert InvalidRouter(address(0));
        I_CCIP_ROUTER = router;
    }

    function ccipReceive(Client.Any2EvmMessage calldata message) external virtual override {
        if (msg.sender != I_CCIP_ROUTER) revert InvalidRouter(msg.sender);
        _ccipReceive(message);
    }

    function _ccipReceive(Client.Any2EvmMessage memory message) internal virtual;

    function getRouter() public view returns (address) {
        return I_CCIP_ROUTER;
    }

    function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
        return interfaceId == type(IAny2EVMMessageReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }
}

// --- INLINED AGGREGATOR INTERFACE ---
interface AggregatorV3Interface {
  function decimals() external view returns (uint8);
  function description() external view returns (string memory);
  function version() external view returns (uint256);
  function getRoundData(uint80 _roundId) external view returns (
    uint80 roundId,
    int256 answer,
    uint256 startedAt,
    uint256 updatedAt,
    uint80 answeredInRound
  );
  function latestRoundData() external view returns (
    uint80 roundId,
    int256 answer,
    uint256 startedAt,
    uint256 updatedAt,
    uint80 answeredInRound
  );
}

/**
 * @title SentientVault
 * @notice Hackathon-Ready Vault for Base Sepolia / Tenderly War Room
 * @dev Implements AI-Underwritten RWA logic with Chainlink CRE & CCIP.
 */
contract SentientVault is CCIPReceiver, ReentrancyGuard, Ownable {
    
    // --- State Variables ---
    mapping(address => uint256) public userCollateral; // Always in ETH (Native)
    mapping(address => uint256) public userDebt;       // Synthetic sNGN
    mapping(address => uint256) public userCollateralRatio; 

    uint256 public constant BASE_RATIO = 150; // 150% standard
    uint256 public constant PRECISION = 1e18;
    
    address public sentientAgent; 
    AggregatorV3Interface internal priceFeed;

    // --- Events ---
    event CollateralDeposited(address indexed user, uint256 amount, bool isCrossChain);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event SyntheticMinted(address indexed user, uint256 amount);
    event SyntheticRepaid(address indexed user, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator, uint256 collateralTaken, uint256 debtRepaid);
    event RatioUpdated(address indexed user, uint256 newRatio);
    event AgentUpdated(address indexed newAgent);

    // Note the Ownable(msg.sender) here for OpenZeppelin v5!
    constructor(address _router, address _agent, address _priceFeed) 
        CCIPReceiver(_router) 
        Ownable(msg.sender) 
    {
        require(_router != address(0), "Invalid Router");
        require(_agent != address(0), "Invalid Agent");
        require(_priceFeed != address(0), "Invalid Price Feed");
        
        sentientAgent = _agent;
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    modifier onlyAgent() {
        _onlyAgent();
        _;
    }

    function _onlyAgent() internal view {
        require(msg.sender == sentientAgent, "Sentient: Only AI Agent");
    }

    // --- Helper Logic ---
    function getLatestPrice() public view returns (uint256) {
        (, int price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid Oracle Price");
        
        // casting to 'uint256' is safe because price > 0 is checked above
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint256(price) * 1e10; // Scale to 18 decimals assuming 8 decimal price feed
    }

    function getCollateralValue(address _user) public view returns (uint256) {
        return (userCollateral[_user] * getLatestPrice()) / PRECISION;
    }

    function getHealthFactor(address _user) public view returns (uint256) {
        if (userDebt[_user] == 0) return type(uint256).max;
        
        uint256 collateralValue = getCollateralValue(_user);
        uint256 minRequiredCollateral = (userDebt[_user] * userCollateralRatio[_user]) / 100;
        
        if (minRequiredCollateral == 0) return type(uint256).max;
        return (collateralValue * PRECISION) / minRequiredCollateral;
    }

    // --- User Actions ---
    function depositCollateral() external payable nonReentrant {
        require(msg.value > 0, "Sentient: Zero deposit");
        userCollateral[msg.sender] += msg.value;
        if (userCollateralRatio[msg.sender] == 0) userCollateralRatio[msg.sender] = BASE_RATIO;
        emit CollateralDeposited(msg.sender, msg.value, false);
    }

    function withdrawCollateral(uint256 _amount) external nonReentrant {
        require(userCollateral[msg.sender] >= _amount, "Sentient: Insufficient balance");
        
        // Optimistically subtract
        userCollateral[msg.sender] -= _amount;
        
        if (userDebt[msg.sender] > 0) {
            require(getHealthFactor(msg.sender) >= PRECISION, "Sentient: Unsafe withdrawal");
        }
        
        // Transfer ETH back to user
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Sentient: Transfer failed");
        
        emit CollateralWithdrawn(msg.sender, _amount);
    }

    function mintSynthetic(uint256 _amount) external nonReentrant {
        userDebt[msg.sender] += _amount;
        require(getHealthFactor(msg.sender) >= PRECISION, "Sentient: Insufficient collateral");
        emit SyntheticMinted(msg.sender, _amount);
    }

    function repaySynthetic(uint256 _amount) external nonReentrant {
        require(userDebt[msg.sender] >= _amount, "Sentient: Over-repaying");
        userDebt[msg.sender] -= _amount;
        emit SyntheticRepaid(msg.sender, _amount);
    }

    /**
     * @notice Liquidates an unsafe position.
     */
    function liquidate(address _target) external payable nonReentrant {
        require(getHealthFactor(_target) < PRECISION, "Sentient: User is Healthy");
        
        uint256 collateralToTake = userCollateral[_target];
        uint256 debtWiped = userDebt[_target];

        // Reset the unsafe position
        userDebt[_target] = 0;
        userCollateral[_target] = 0;

        (bool success, ) = msg.sender.call{value: collateralToTake}("");
        require(success, "Liquidation failed");

        emit Liquidated(_target, msg.sender, collateralToTake, debtWiped);
    }

    // --- CCIP Receiver ---
    function _ccipReceive(Client.Any2EvmMessage memory any2EvmMessage) internal override {
        // Enforce single token transfer to avoid logic errors
        require(any2EvmMessage.destTokenAmounts.length == 1, "Sentient: Only 1 token allowed");
        
        uint256 amount = any2EvmMessage.destTokenAmounts[0].amount;
        address sender = abi.decode(any2EvmMessage.sender, (address));

        userCollateral[sender] += amount;
        
        // Set default ratio if this is a new user
        if (userCollateralRatio[sender] == 0) userCollateralRatio[sender] = BASE_RATIO;

        emit CollateralDeposited(sender, amount, true);
    }

    // --- AI Controls ---
    function setDynamicCollateralRatio(address _user, uint256 _newRatio) external onlyAgent {
        // Safety bound: never go below 105% even if AI says so
        require(_newRatio >= 105, "Sentient: Safety breach"); 
        userCollateralRatio[_user] = _newRatio;
        emit RatioUpdated(_user, _newRatio);
    }

    // Uses the onlyOwner modifier inherited from OpenZeppelin Ownable
    function updateAgent(address _newAgent) external onlyOwner {
        require(_newAgent != address(0), "Invalid Address");
        sentientAgent = _newAgent;
        emit AgentUpdated(_newAgent);
    }

    function getUserVaultStats(address _user) external view returns (uint256, uint256, uint256) {
        return (userCollateral[_user], userDebt[_user], getHealthFactor(_user));
    }
}
















// pragma solidity ^0.8.19; // Locked pragma for stability

// // --- OPENZEP DIRECT IMPORT (Stable for Remix) ---
// //import {ReentrancyGuard} from "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/security/ReentrancyGuard.sol";
// //
// import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
// import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
// import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// // --- INLINED CCIP LIBRARY & RECEIVER (Fixes "Not Found" Errors in Remix) ---
// library Client {
//     struct EVMTokenAmount {
//         address token;
//         uint256 amount;
//     }
//     struct Any2EVMMessage {
//         bytes32 messageId;
//         uint64 sourceChainSelector;
//         bytes sender;
//         bytes data;
//         EVMTokenAmount[] destTokenAmounts;
//     }
// }

// interface IAny2EVMMessageReceiver {
//     function ccipReceive(Client.Any2EVMMessage calldata message) external;
// }

// interface IERC165 {
//     function supportsInterface(bytes4 interfaceId) external view returns (bool);
// }

// abstract contract CCIPReceiver is IAny2EVMMessageReceiver, IERC165 {
//     address internal immutable i_ccipRouter;

//     error InvalidRouter(address router);

//     constructor(address router) {
//         if (router == address(0)) revert InvalidRouter(address(0));
//         i_ccipRouter = router;
//     }

//     function ccipReceive(Client.Any2EVMMessage calldata message) external virtual override {
//         if (msg.sender != i_ccipRouter) revert InvalidRouter(msg.sender);
//         _ccipReceive(message);
//     }

//     function _ccipReceive(Client.Any2EVMMessage memory message) internal virtual;

//     function getRouter() public view returns (address) {
//         return i_ccipRouter;
//     }

//     function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
//         return interfaceId == type(IAny2EVMMessageReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
//     }
// }

// // --- INLINED AGGREGATOR INTERFACE ---
// interface AggregatorV3Interface {
//   function decimals() external view returns (uint8);
//   function description() external view returns (string memory);
//   function version() external view returns (uint256);
//   function getRoundData(uint80 _roundId) external view returns (
//     uint80 roundId,
//     int256 answer,
//     uint256 startedAt,
//     uint256 updatedAt,
//     uint80 answeredInRound
//   );
//   function latestRoundData() external view returns (
//     uint80 roundId,
//     int256 answer,
//     uint256 startedAt,
//     uint256 updatedAt,
//     uint80 answeredInRound
//   );
// }

// /**
//  * @title SentientVault
//  * @notice Hackathon-Ready Vault for Base Sepolia
//  * @dev Implements AI-Underwritten RWA logic with Chainlink CRE & CCIP.
//  */
// contract SentientVault is CCIPReceiver, ReentrancyGuard {
    
//     // --- State Variables ---
//     mapping(address => uint256) public userCollateral; // Always in ETH (Native)
//     mapping(address => uint256) public userDebt;       // Synthetic sNGN
//     mapping(address => uint256) public userCollateralRatio; 

//     uint256 public constant BASE_RATIO = 150; // 150% standard
//     uint256 public constant PRECISION = 1e18;
    
//     address public sentientAgent; 
//     address public owner;
//     AggregatorV3Interface internal priceFeed;

//     // --- Events ---
//     event CollateralDeposited(address indexed user, uint256 amount, bool isCrossChain);
//     event CollateralWithdrawn(address indexed user, uint256 amount);
//     event SyntheticMinted(address indexed user, uint256 amount);
//     event SyntheticRepaid(address indexed user, uint256 amount);
//     event Liquidated(address indexed user, address indexed liquidator, uint256 collateralTaken, uint256 debtRepaid);
//     event RatioUpdated(address indexed user, uint256 newRatio);
//     event AgentUpdated(address indexed newAgent);

//     constructor(address _router, address _agent, address _priceFeed) CCIPReceiver(_router) {
//         require(_router != address(0), "Invalid Router");
//         require(_agent != address(0), "Invalid Agent");
//         require(_priceFeed != address(0), "Invalid Price Feed");
        
//         sentientAgent = _agent;
//         owner = msg.sender;
//         priceFeed = AggregatorV3Interface(_priceFeed);
//     }

//     modifier onlyAgent() {
//         require(msg.sender == sentientAgent, "Sentient: Only AI Agent");
//         _;
//     }

//     modifier onlyOwner() {
//         require(msg.sender == owner, "Sentient: Only Owner");
//         _;
//     }

//     // --- Helper Logic ---
//     function getLatestPrice() public view returns (uint256) {
//         (, int price, , , ) = priceFeed.latestRoundData();
//         require(price > 0, "Invalid Oracle Price");
//         return uint256(price) * 1e10; // Scale to 18 decimals
//     }

//     function getCollateralValue(address _user) public view returns (uint256) {
//         return (userCollateral[_user] * getLatestPrice()) / PRECISION;
//     }

//     function getHealthFactor(address _user) public view returns (uint256) {
//         if (userDebt[_user] == 0) return type(uint256).max;
        
//         uint256 collateralValue = getCollateralValue(_user);
//         uint256 minRequiredCollateral = (userDebt[_user] * userCollateralRatio[_user]) / 100;
        
//         if (minRequiredCollateral == 0) return type(uint256).max;
//         return (collateralValue * PRECISION) / minRequiredCollateral;
//     }

//     // --- User Actions ---
    
//     function depositCollateral() external payable nonReentrant {
//         require(msg.value > 0, "Sentient: Zero deposit");
//         userCollateral[msg.sender] += msg.value;
//         if (userCollateralRatio[msg.sender] == 0) userCollateralRatio[msg.sender] = BASE_RATIO;
//         emit CollateralDeposited(msg.sender, msg.value, false);
//     }

//     function withdrawCollateral(uint256 _amount) external nonReentrant {
//         require(userCollateral[msg.sender] >= _amount, "Sentient: Insufficient balance");
        
//         // Optimistically subtract
//         userCollateral[msg.sender] -= _amount;
        
//         if (userDebt[msg.sender] > 0) {
//             require(getHealthFactor(msg.sender) >= PRECISION, "Sentient: Unsafe withdrawal");
//         }
        
//         // Transfer ETH back to user
//         (bool success, ) = msg.sender.call{value: _amount}("");
//         require(success, "Sentient: Transfer failed");
        
//         emit CollateralWithdrawn(msg.sender, _amount);
//     }

//     function mintSynthetic(uint256 _amount) external nonReentrant {
//         userDebt[msg.sender] += _amount;
//         require(getHealthFactor(msg.sender) >= PRECISION, "Sentient: Insufficient collateral");
//         emit SyntheticMinted(msg.sender, _amount);
//     }

//     function repaySynthetic(uint256 _amount) external nonReentrant {
//         require(userDebt[msg.sender] >= _amount, "Sentient: Over-repaying");
//         userDebt[msg.sender] -= _amount;
//         emit SyntheticRepaid(msg.sender, _amount);
//     }

//     /**
//      * @notice Liquidates an unsafe position.
//      */
//     function liquidate(address _target) external payable nonReentrant {
//         require(getHealthFactor(_target) < PRECISION, "Sentient: User is Healthy");
        
//         uint256 collateralToTake = userCollateral[_target];
//         uint256 debtWiped = userDebt[_target];

//         // Reset the unsafe position
//         userDebt[_target] = 0;
//         userCollateral[_target] = 0;

//         (bool success, ) = msg.sender.call{value: collateralToTake}("");
//         require(success, "Liquidation failed");

//         emit Liquidated(_target, msg.sender, collateralToTake, debtWiped);
//     }

//     // --- CCIP Receiver ---
//     function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
//         // Enforce single token transfer to avoid logic errors
//         require(any2EvmMessage.destTokenAmounts.length == 1, "Sentient: Only 1 token allowed");
        
//         uint256 amount = any2EvmMessage.destTokenAmounts[0].amount;
//         address sender = abi.decode(any2EvmMessage.sender, (address));

//         userCollateral[sender] += amount;
        
//         // Set default ratio if this is a new user
//         if (userCollateralRatio[sender] == 0) userCollateralRatio[sender] = BASE_RATIO;

//         emit CollateralDeposited(sender, amount, true);
//     }

//     // --- AI Controls ---
//     function setDynamicCollateralRatio(address _user, uint256 _newRatio) external onlyAgent {
//         // Safety bound: never go below 105% even if AI says so
//         require(_newRatio >= 105, "Sentient: Safety breach"); 
//         userCollateralRatio[_user] = _newRatio;
//         emit RatioUpdated(_user, _newRatio);
//     }

//     function updateAgent(address _newAgent) external onlyOwner {
//         require(_newAgent != address(0), "Invalid Address");
//         sentientAgent = _newAgent;
//         emit AgentUpdated(_newAgent);
//     }

//     function getUserVaultStats(address _user) external view returns (uint256, uint256, uint256) {
//         return (userCollateral[_user], userDebt[_user], getHealthFactor(_user));
//     }
// }




