import GetCookie from "@/hooks/cookies/getCookie";
import axios from "axios";

export const GetReferral = async () => {
  try {
    const userId = GetCookie('userId');
    const userIdInNumber = userId != '' ? parseInt(userId) : 0;
    if(userIdInNumber != 0 && typeof userIdInNumber != "string") {
      return await axios.post('https://flickthebean.onrender.com/ref', {
        userId: userIdInNumber,
      }).then(function (res) {
        return res.data.data.referral_code;
      }).catch(function (error) {
        console.log(error.toJSON());
      });
    }
  } catch(error) {

  }
}