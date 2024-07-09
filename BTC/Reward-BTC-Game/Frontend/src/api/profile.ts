import GetCookie from "@/hooks/cookies/getCookie";
import axios from "axios";

export const GetProfile = async () => {
  const val = GetCookie('userId');
  const userId = parseInt(val != '' ? val : '0');
  return await axios.post('https://flickthebean.onrender.com/profile', {
    userId: userId,
  })
}