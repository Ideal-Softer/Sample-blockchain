import Cookies from 'js-cookie';

const RemoveCookie = (cookieName: string) => {
  Cookies.remove(cookieName);
}

export default RemoveCookie;