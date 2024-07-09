import axios from "axios";

export const GetrecentFlickers = async (param: string | null) => {
  return await axios.get(`https://flickthebean.onrender.com/${param != null ? '?ref=' + param : ''}`, {
  }).then(function (res) {
    return  res.data.data;
  }).catch(function (error) {
    console.log(error.toJSON());
  });
}