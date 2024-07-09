import { DepositBTC } from "@/api/deposit";
import GetCookie from "@/hooks/cookies/getCookie";
import { enqueueSnackbar } from "notistack";
import { ChangeEvent, useState, useEffect } from "react";
import { sendBtcTransaction } from "sats-connect";
import {
	useBalanceStore,
} from '../../store'

const Deposit = () => {
  const[amount, setAmount] = useState('');
  const[focus, setFocus] = useState(false);
  const[displayAmount, setDisplayAmount] = useState('');
  const[wallet, setWallet] = useState(GetCookie('wallet'));
  const updateBalance = useBalanceStore(state => state.updateBalance);
  const handleAmount = (e: ChangeEvent<HTMLInputElement>) => {
    console.log('@@@', e.target.value)
    setAmount(e.target.value);
    // @ts-ignore
    setDisplayAmount((e.target.value) / 100000000);
  }
  const handleUnisatTransaction = async () => {
    const despitAmount = amount.includes('.') ? parseFloat(amount) : parseInt(amount);
    const accountAddress = 'bc1pdlee90dye598q502hytgm5nnyxjt46rz9egkfurl5ggyqgx49cssjusy3k';
    if (amount != '') {
      // @ts-ignore
      if(amount < 1000) {
        enqueueSnackbar('Less amount', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
        return;
      }
      try {
        // @ts-ignore
        let txid = await window.unisat.sendBitcoin(accountAddress, despitAmount);
        if(txid) {
          DepositBTC(false, txid);
        }
        console.log(txid)
      } catch (e) {
        enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
      }
    } else {
      enqueueSnackbar('Wallet address missing', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
    }

  }

  const handleXverseTransaction = async () => {
    const despitAmount = amount.includes('.') ? parseFloat(amount) : parseInt(amount);
    const accountAddress = 'bc1pdlee90dye598q502hytgm5nnyxjt46rz9egkfurl5ggyqgx49cssjusy3k';
    const senderAddress = GetCookie('address');
    if (senderAddress != '' && amount != '') {
      // @ts-ignore
      if(amount < 1000) {
        enqueueSnackbar('Less amount', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
        return;
      }
      const sendBtcOptions = {
        payload: {
          network: {
            type: "mainnet",
          },
          recipients: [
            {
              address: accountAddress,
              amountSats: despitAmount,
            },
          ],
          senderAddress: accountAddress,
        },
        onFinish: (response: any) => {
          alert(response);
        },
        onCancel: () =>  enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}}),
      };
      // @ts-ignore
      await sendBtcTransaction(sendBtcOptions);
    } else {
      enqueueSnackbar('Wallet address missing', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
    }

  }

  const handleLeatherTransaction = async () => {
    const despitAmount = amount.includes('.') ? parseFloat(amount) : parseInt(amount);
    const accountAddress = 'bc1pdlee90dye598q502hytgm5nnyxjt46rz9egkfurl5ggyqgx49cssjusy3k';
    if (amount != '') {
      // @ts-ignore
      if(amount < 1000) {
        enqueueSnackbar('Less amount', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
        return;
      }
      try {
        // @ts-ignore
        const resp = await window.btc?.request('sendTransfer', {
          address: accountAddress,
          amount: despitAmount
        });
        console.log(resp.result.txid)
      } catch(e) {
        console.log(e);
        enqueueSnackbar('Dismissed', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
      }
    } else {
      enqueueSnackbar('Wallet address missing', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}});
    }
  }

  useEffect(() => {
    const currentBalance = GetCookie('balance');
		// @ts-ignore
		updateBalance(currentBalance)
  })

  return(
    <>
      <section className="deposit">
        <div className="deposit__header">
          <h3 className="deposit__title">Desposit</h3>
        </div>
        <div className="deposit__panel deposit__margin-bottom">
          <div className="deposit__input-groupt">
            <input 
              step="any" 
              type="text" 
              className="deposit__textfield" 
              onChange={handleAmount}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              value={focus ? amount : displayAmount}
            />
            <div className="deposit__textfield-sufix">BTC</div>
          </div>
        </div>
        <button
          className="deposit__btn"
          onClick={
            wallet == 'unisat' ?
              handleUnisatTransaction :
              wallet == 'xverse' ?
                handleXverseTransaction :
                handleLeatherTransaction
          }
          disabled={amount == '' ? true : false}
        >
          Deposit
        </button>
      </section>
    </>
  )
}

export default Deposit;