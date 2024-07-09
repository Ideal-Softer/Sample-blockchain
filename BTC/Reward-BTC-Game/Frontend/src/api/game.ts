import GetCookie from "@/hooks/cookies/getCookie";
import axios from "axios";
import { handleUnisat } from "../components/play-modal/unisat";


export const GetNonce = async () => {
  const val = GetCookie('userId');
  const userId = parseInt(val != '' ? val : '0');
  if(userId !=  0) {
    return await axios.post('https://flickthebean.onrender.com/game/commitment', {
      userId: userId,
    }).then(function (res) {
      console.log("commitment: ", res);
      
      return res.data.data;
    }).catch(function (error) {
      console.log(error.toJSON());
    });
  } else {
    await handleUnisat()
  }
}

export const gameReveal = async (gameNonce: string, choice: boolean, amount: number, publicKey: string, sign: string) => {
  return await axios.post('https://flickthebean.onrender.com/game/reveal', {
    gameNonceReceived: gameNonce,
    choice: choice,
    amount: amount,
    userPublicKey: publicKey,
    signedMessage: sign
  }).then(function (res) {
    console.log("reveal: ", res);
    return { gameResponse: res.data.didWin, newBalance: res.data.newBalance }
  }).catch(function (error) {
    console.log(error.toJSON());
    return  { gameResponse: false, newBalance: "0.00" }
  });
}