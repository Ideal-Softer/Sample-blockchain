import Cookies from 'js-cookie';

const GetCookie = (cookieName: string) => {
  const val = Cookies.get(cookieName) ? Cookies.get(cookieName) : '';
  return val ? val : '';
}

export default GetCookie;