import { login } from '@/api/login';
import SetCookie from '@/hooks/cookies/setCookie';
import { AppConfig, UserSession, openSignatureRequestPopup, showConnect } from '@stacks/connect';
import bitcore from 'bitcore-lib';
import crypto from 'crypto';
import { enqueueSnackbar } from 'notistack';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

const getSignature = async () => {
  let message = crypto.randomBytes(16).toString('hex');
  let hash = bitcore.crypto.Hash.sha256(Buffer.from(message)).toString('hex');
  let user;

  if (userSession.isUserSignedIn()) {
    // Wrap the signature request in a Promise so we can await it
    const userResult = await new Promise((resolve) => {
      openSignatureRequestPopup({
        message: hash,
        async onFinish(data) {
          user = await login(data.signature, data.publicKey, message, hash);
          SetCookie('userId', user);
          SetCookie('sign', data.signature);
          SetCookie('publicKey', data.publicKey);
          SetCookie('wallet', 'leather');
          resolve(user);  // Resolve the promise with the user data
        },
        onCancel: () => {
          resolve(false);
          enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
        }
      });
    });

    console.log("leather: ", userResult);
    console.log("usersession: ", userSession);
    

    if (userResult) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};


export const handleLeather = async () => {
  // Wrap the asynchronous part in a Promise
  let flag = false;
  const data = await new Promise((resolve) => {
    showConnect({
      appDetails: {
        name: 'My App',
        icon: window.location.origin + '/my-app-logo.svg',
      },
      onFinish: async () => {
        userSession.loadUserData();
        const signatureData = await getSignature();
        flag: true;
        resolve(signatureData);  // Resolve the promise
      },
      onCancel: () => {
        resolve(false);
        flag= false;
        enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
      },
      userSession: userSession,
    });
  });

  console.log('data: ', data);

  if (data) {
    return true;
  } else {
    return false;
  }
};

export const getLeatherSignature = async (value: string) => {
  const hash = bitcore.crypto.Hash.sha256(Buffer.from(value)).toString('hex');
  let sign = '';
  let publicKey = '';

  let res = {
    publicKey: '',
    signature: ''
  }

  if (userSession.isUserSignedIn()) {
    // Wrap the signature request in a Promise so we can await it
    const data = await new Promise((resolve) => {
      openSignatureRequestPopup({
        message: hash,
        async onFinish(data) {
          sign = data.signature;
          publicKey = data.publicKey;
          resolve(true)
        },
        onCancel: () => {
          resolve(false);
          enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
        }
      });
    });

    res.publicKey = publicKey;
    res.signature = sign;
    return res;
  } else {
    return res;
  }
};