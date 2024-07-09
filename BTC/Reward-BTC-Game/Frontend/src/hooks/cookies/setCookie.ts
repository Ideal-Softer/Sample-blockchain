import Cookies from 'js-cookie';

const SetCookie = (cookieName: string, cookieValue: string) => {
  Cookies.set(cookieName, cookieValue, {
    expires: 1,
    secure: true,
    sameSite: 'Strict',
    path: '/'
  })
}

export default SetCookie;