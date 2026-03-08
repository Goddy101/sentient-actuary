import { parseAbi } from "viem";

export const VAULT_ABI = parseAbi([
  "function getUserVaultStats(address user) view returns (uint256 totalCollateral, uint256 totalDebt, uint256 healthFactor)",
  "function setDynamicCollateralRatio(address user, uint256 newRatio) external",
  "event RatioUpdated(address indexed user, uint256 newRatio)"
]);