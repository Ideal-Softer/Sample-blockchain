import GetCookie from "@/hooks/cookies/getCookie";
import axios from "axios";

export const GetExchangeBalance = async () => {
  const val = GetCookie('userId');
  const userId = parseInt(val != '' ? val : '0');
  return await axios.post('https://flickthebean.onrender.com/exchange/balance', {
    userId: userId,
  })
}

export const BrcToBTC = async (amount: number) => {
  const val = GetCookie('userId');
  const userId = parseInt(val != '' ? val : '0');
  return await axios.post('https://flickthebean.onrender.com/exchange/brc_to_btc', {
    amount: amount,
    userId: userId,
  })
}

export const BTCToBRC = async (amount: number) => {
  const val = GetCookie('userId');
  const userId = parseInt(val != '' ? val : '0');
  return await axios.post('https://flickthebean.onrender.com/exchange/btc_to_brc', {
    amount: amount,
    userId: userId,
  })
}