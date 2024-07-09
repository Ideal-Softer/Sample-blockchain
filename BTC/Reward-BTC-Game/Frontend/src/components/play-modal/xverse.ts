import { login } from '@/api/login';
import SetCookie from '@/hooks/cookies/setCookie';
import bitcore from 'bitcore-lib';
import crypto from 'crypto';
import { enqueueSnackbar } from 'notistack';
import { getAddress, signMessage } from 'sats-connect';


export const handleXverse = async () => {
  let message = crypto.randomBytes(16).toString('hex');
  let hash = bitcore.crypto.Hash.sha256(Buffer.from(message)).toString('hex');
  let address = '';
  let publicKey = '';

  const getAddressOptions = {
    payload: {
      purposes: ['payment'],
      message: hash,
      network: {
        type: 'Mainnet'
      },
    },
    onFinish: (response: any) => {
      address = response.addresses[0].address;
      publicKey = response.addresses[0].publicKey;
    },
    onCancel: () => enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}}),
  };

  // @ts-ignore
  await getAddress(getAddressOptions);

  // Now use the separate function to sign the message
  const sign = await signMessageFunc(address, hash);

  if (sign != '') {
    const userId = await login(sign, publicKey, message, hash);
    console.log("xverse: ", userId);
    SetCookie('userId', userId);
    SetCookie('sign', sign);
    SetCookie('publicKey', publicKey);
    SetCookie('wallet', 'xverse');
    SetCookie('address', address)
    // TODO improve this
    if (userId) {
      return true;
    }
  } else {
    return false;
  }

};

export const signMessageFunc = async (address: any, hash: any) => {
  let sign = '';


  const signMessageOptions = {
    payload: {
      network: {
        type: "Mainnet",
      },
      address: address,
      message: hash,
    },
    onFinish: (response: any) => {
      // signature
      sign = response;
    },
    onCancel: () => enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}}),
  };
  try {
    // @ts-ignore
    await signMessage(signMessageOptions);
    console.log('sign: ', sign);
  } catch(error) {
    console.log(error);
  }

  return sign;
};


export const getXverseSign = async (value: string) => {
  const hash = bitcore.crypto.Hash.sha256(Buffer.from(value)).toString('hex');
  let address = '';
  let publicKey = '';

  const getAddressOptions = {
    payload: {
      purposes: ['payment'],
      message: hash,
      network: {
        type: 'Mainnet'
      },
    },
    onFinish: (response: any) => {
      address = response.addresses[0].address;
      publicKey = response.addresses[0].publicKey;
    },
    onCancel: () => enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}}),
  };

  try {
    // @ts-ignore
    await getAddress(getAddressOptions);

    // Now use the separate function to sign the message
    const sign = await signMessageFunc(address, hash);


    // TODO improve this
    if (publicKey != undefined && sign != undefined) {
      return { publicKey: publicKey, signature: sign }
    } else {
      return { publicKey: '', signature: '' }
    }
  } catch(error) {
    console.log(error);
    return { publicKey: '', signature: '' }
  }
};