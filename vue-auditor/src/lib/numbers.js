import { BigNumber } from "bignumber.js";
export const GWEI_FACTOR = Math.pow(10, 9)
export const ETH_FACTOR = Math.pow(10, 18)
/**
 * Convert to BigNumber
 * @param {bigint|string|number} bi 
 * @returns BigNumber
 */
export function toWebBigInt(bi) {
  return new BigNumber(bi);
}

/**
 * Convert to normal number
 * @param {BigNumber} bi 
 * @returns Number
 */
export function toNumber(bi) {
  return bi.toNumber();
}

/**
 * Convert wei to gwei
 * @param {bigint|string|number} bi 
 * @returns BigNumber
 */
export function toGWei(bi) {
  return toWebBigInt(bi).div(toWebBigInt(GWEI_FACTOR));
}
/**
 * Convert wei to Ether
 * @param {bigint|string|number} bi 
 * @returns BigNumber
 */
export function toEther(bi) {
  return toWebBigInt(bi).div(toWebBigInt(ETH_FACTOR));
}

export function toWei(bi, from) {
  const n = toWebBigInt(bi);
  if(from === "ether") return n.multipliedBy(ETH_FACTOR)
  if(from === "gwei") return n.multipliedBy(GWEI_FACTOR)
  return n
}

/** Convert a big int to a smart contract parameter call 
 * @param {BigNumber} bi
 * @return {string}
*/
export function toParam(bi) {
  // return bi.toFormat(0, BigNumber.ROUND_DOWN, {groupSeparator:''})
  return '0x'+bi.toString(16)
}

window.Numberlib = {
  toWebBigInt,
  toNumber,
  toEther,
  toGWei,
  toWei,
  toParam
}