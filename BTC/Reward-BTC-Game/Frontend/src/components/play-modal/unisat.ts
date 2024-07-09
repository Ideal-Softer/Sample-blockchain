import { login } from '@/api/login';
import GetCookie from '@/hooks/cookies/getCookie';
import SetCookie from '@/hooks/cookies/setCookie';
import bitcore from 'bitcore-lib';
import crypto from 'crypto';
import { enqueueSnackbar } from 'notistack';


export const handleUnisat = async () => {
  // @ts-ignore
  let uniSat = window.unisat;
  let cookie = GetCookie('userId');

  if (typeof uniSat !== 'undefined' && cookie == '') {
    try {
      const address = await uniSat.requestAccounts();
      SetCookie('address', address[0])
      return getSignature();
    } catch (e) {
      console.log('connect failed');
    }
  } else {
    return true;
  }
}

export const getSignature = async () => {
  console.log("this is working");
  
  const message = crypto.randomBytes(16).toString('hex');
  const hash = bitcore.crypto.Hash.sha256(Buffer.from(message)).toString('hex');
  let publicKey = '';
  let sign = '';

  // @ts-ignore
  let uniSat =  window.unisat;
  try {
    sign = await uniSat.signMessage(hash);
    publicKey = await uniSat.getPublicKey();

    let userId = '';
    userId = await login(sign, publicKey, message, hash);
    if(userId != '') {
      SetCookie('userId', userId);
      SetCookie('sign', sign);
      SetCookie('publicKey', publicKey);
      SetCookie('wallet', 'unisat');
      return true;
    }
  } catch (e) {
    console.log(e);
    enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
  }
}

export const signMessage = async (value: string) => {
  const hash = bitcore.crypto.Hash.sha256(Buffer.from(value)).toString('hex');
  let publicKey = '';
  let sign = '';

  // @ts-ignore
  let uniSat = window.unisat;
  try {
    sign = await uniSat.signMessage(hash);
    publicKey = await uniSat.getPublicKey();
    let userId = '';
    if(sign && publicKey && GetCookie('userId') == '') {
      userId = await login(sign, publicKey, value, hash);
      SetCookie('userId', userId);
    }
    if (userId || GetCookie('userId') != '') {
      return { publicKey: publicKey, signature: sign };
    }else{
      return { publicKey: "", signature:""};
    }
  } catch (e) {
    console.log(e);
    enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
    return { publicKey: "", signature:""}
  }
}