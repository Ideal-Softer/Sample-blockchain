import SetCookie from "@/hooks/cookies/setCookie";
import axios from "axios";

export const login = async (sign: string, publicKey: string, message: string, hash:string) => {
  return await axios.post('https://flickthebean.onrender.com/login', {
    hash: hash,
    value: message,
    userPublicKey: publicKey,
    signedMessage: sign,
    userName: "name"
  }).then(function (res) {
    console.log(res);
    SetCookie('balance', res.data.data.balance);
    return  res.data.data.userId && res.data.data.userId;
  }).catch(function (error) {
    console.log(error.toJSON());
  });
}