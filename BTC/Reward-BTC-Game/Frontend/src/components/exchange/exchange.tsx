import { BTCToBRC, BrcToBTC, GetExchangeBalance } from "@/api/exchange";
import { GetrecentFlickers } from "@/api/recent-flickers";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useState } from "react";
import GetCookie from "@/hooks/cookies/getCookie";
import SetCookie from "@/hooks/cookies/setCookie";
import RecentFlickersModal from "../recent-flickers-modal/recentFlickersModal";
import {
	useBalanceStore,
} from '../../store'

const Exchange = () => {
	const[refetching, setRefetching] = useState(false);
	const[loading, setLoading] = useState(false);
	const router = useRouter();
	const updateBalance = useBalanceStore(state => state.updateBalance);
	const {data, refetch, isError} = useQuery({
		queryKey: ['getBalance'],
		queryFn: GetExchangeBalance
	});
	const {data: recentData} = useQuery({
		queryKey: ['recent'],
		queryFn:  () => GetrecentFlickers(null)
	});

	useEffect(() => {
		const currentBalance = GetCookie('balance');
		// @ts-ignore
		updateBalance(currentBalance)
	})

	useEffect(() => {

	},[refetching]);

	if(isError) {
		enqueueSnackbar("Server Error", {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
	}

  const[showRecentModal, setShowRecentModal] = useState(false);
	const[btcToBrc, setBtcToBrc] = useState(true);
	const[btc, setBtc] = useState('');
	const[brc, setBrc] = useState('');

	const handlePosition = () => {
		setBtcToBrc(!btcToBrc);
	}

  const handleRecentModal = () => {
    setShowRecentModal(!showRecentModal);
  }

	const handleBtcToBrc = async () => {
		try {
			setLoading(true);
			const exchangeAmount = btc.includes('.') ? parseFloat(btc) : parseInt(btc);
			const res = await BTCToBRC(exchangeAmount);
			console.log(res);
			setRefetching(!refetching);
			refetch();
			setBtc('');
			setBrc('');
			setLoading(false);
		} catch(e) {
			enqueueSnackbar("Server Error", {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
		}
  }

	const handleBrcToBtc = async () => {
		try {
			setLoading(true);
			const exchangeAmount = brc.includes('.') ? parseFloat(brc) : parseInt(brc);
			const res = await BrcToBTC(exchangeAmount);
			console.log(res);
			setRefetching(!refetching);
			refetch();
			setLoading(false);
		} catch(e) {
			enqueueSnackbar("Server Error", {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
		}
  }

	const handleFieldBtc = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const btc = value.includes('.') ? parseFloat(value) : parseInt(value);
		const brc = btc * 29411.76;
		console.log("brc: ", brc);
		setBtc(value);
		setBrc(brc.toString());
	}

	const handleFieldBrc = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		const brc = value.includes('.') ? parseFloat(value) : parseInt(value);
		const btc = brc / 29411.76;
		console.log("btc: ", btc);
		setBtc(btc.toString());
		setBrc(value);
	}

  return(
    <>
      <section className="exchange">
					<div className="exchange__header">
						<h3 className="exchange__title"><img src="/static/img/arrow_left.png" alt="settings icon" onClick={() => router.back()}/>Exchange</h3>
						<div>
							{/* <button><img src="/static/svgs/settings.svg" alt="settings icon" /></button> */}
						</div>
					</div>
					{
						btcToBrc ? (
						<div className="exchange__panel exchange__margin-bottom">
							<div className="exchange__left">
								<p className="exchange__subtitle mb-10">You pay</p>
								<p className="exchange__score">
									<input type="number" className="exchange__score-field" value={btc} placeholder="0" onChange={handleFieldBtc} disabled={!btcToBrc}  />
								</p>
								<p className="exchange__total mt-15">$13.04</p>
							</div>
							<div className="exchange__right">
								<select className="exchange__select">
									<option value="btc">Btc</option>
								</select>
								<p className="exchange__subtitle">Balance: {Math.round((parseFloat(data?.data.data.balance.btc_balance) + Number.EPSILON) * 100) / 100} BTC</p>
							</div>
						</div>
						) : (
							<div className={`exchange__panel ${btcToBrc ? 'exchange__margin-top': 'exchange__margin-bottom'}`}>
								<div className="exchange__left">
									<p className="exchange__subtitle mb-10">You pay</p>
									<p className="exchange__score">
										<input type="number" className="exchange__score-field" value={brc} placeholder="0" onChange={handleFieldBrc} disabled={btcToBrc} />
									</p>
									<p className="exchange__total mt-15">$13.04</p>
								</div>
								<div className="exchange__right">
									<select className="exchange__select">
										<option value="btc">Acd</option>
									</select>
									<p className="exchange__subtitle">Balance: {Math.round((parseFloat(data?.data.data.balance.brc_balance) + Number.EPSILON) * 100) / 100} BRC</p>
								</div>
							</div>
						)
					}
					<div className="exchange__arrow-down">
						<button className="exchange__arrow-btn" onClick={handlePosition}>
							<img
								className={`exchange__arrow-img ${!btcToBrc && 'exchange__arrow-img-rotate'}`}
								src="/static/svgs/arrow-down.svg"
								alt="arrow down icon"
							/>
						</button>
					</div>
					{
						!btcToBrc ? (
						<div className="exchange__panel exchange__margin-top">
							<div className="exchange__left">
								<p className="exchange__subtitle mb-10">You pay</p>
								<p className="exchange__score">
									<input type="number" className="exchange__score-field" placeholder="0" value={btc} onChange={handleFieldBtc} disabled={!btcToBrc} />
								</p>
								<p className="exchange__total mt-15">$13.04</p>
							</div>
							<div className="exchange__right">
								<select className="exchange__select">
									<option value="btc">Btc</option>
								</select>
								<p className="exchange__subtitle">Balance: {Math.round((parseFloat(data?.data.data.balance.btc_balance) + Number.EPSILON) * 100) / 100} BTC</p>
							</div>
						</div>
						) : (
							<div className={`exchange__panel ${btcToBrc ? 'exchange__margin-top' : 'exchange__margin-bottom'}`}>
								<div className="exchange__left">
									<p className="exchange__subtitle mb-10">You pay</p>
									<p className="exchange__score">
										<input type="number" className="exchange__score-field" value={brc} placeholder="0" onChange={handleFieldBrc} disabled={btcToBrc} />
									</p>
									<p className="exchange__total mt-15">$13.04</p>
								</div>
								<div className="exchange__right">
									<select className="exchange__select">
										<option value="btc">Acd</option>
									</select>
									<p className="exchange__subtitle">Balance: {Math.round((parseFloat(data?.data.data.balance.brc_balance) + Number.EPSILON) * 100) / 100} BRC</p>
								</div>
							</div>
						)
					}
					{/* <div className="exchange__panel-slim">
						<p className="exchange__subtitle"></p>
						<div className="exchange__total-wrapper">
							<img
								className="exchange__total-icon rotate"
								src="/static/svgs/loader.svg"
								alt="loader icon "
							/>
							<span className="exchange__total">Searching for the best price.</span>
						</div>
					</div> */}
					<div className="exchange__panel-slim">
						<p className="exchange__subtitle">
							<span>0.090 btc</span><span> = </span><span>23,56 acd3</span>
						</p>
						<div className="exchange__total-wrapper">
							<img
								className="exchange__total-icon"
								src="/static/svgs/pump.svg"
								alt="petrol pump icon"
							/>
							<span className="exchange__total">$13.04</span>
						</div>
					</div>
					<button
						onClick={btcToBrc ? handleBtcToBrc : handleBrcToBtc}
						className="exchange__btn"
						disabled={(btc == '' || brc == '')}
					>
						{loading ? (
							<img
								className="exchange__total-icon rotate"
								src="/static/svgs/loader.svg"
								alt="loader icon "
							/>
						) : 'Exchange'}
					</button>
				</section>
				<div className="mt-30">
					<button className="btn-arrow" id="flickersBtn" onClick={handleRecentModal}>
						Recent Flickers
						<img className="btn-arrow__icon" src="/static/svgs/arrow-right.svg" alt="arrow icon" />
					</button>
				</div>

      <RecentFlickersModal 
	  	show={showRecentModal} 
		handleModal={handleRecentModal} 
		tableData={recentData}
	  />
    </>
  )
}

export default Exchange;