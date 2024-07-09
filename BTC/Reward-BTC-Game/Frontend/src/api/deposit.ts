import GetCookie from "@/hooks/cookies/getCookie";
import axios from "axios";

export const DepositBTC = async (exchange: boolean, txnId: string) => {
  const val = GetCookie('userId');
  const userId = parseInt(val != '' ? val : '0');
  return await axios.post('https://flickthebean.onrender.com/exchange/btc_to_brc', {
    userId: userId,
    transactionId: txnId,
    exchange: exchange
  })
}