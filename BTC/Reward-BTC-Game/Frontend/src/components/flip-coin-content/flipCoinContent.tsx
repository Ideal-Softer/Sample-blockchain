import { GetNonce, gameReveal } from "@/api/game";
import { GetProfile } from "@/api/profile";
import { GetrecentFlickers } from "@/api/recent-flickers";
import GetCookie from "@/hooks/cookies/getCookie";
import SetCookie from "@/hooks/cookies/setCookie";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { FC, useEffect, useState } from "react";
import AddFundModal from "../add-fund-modal/addFundModal";
import { getLeatherSignature } from "../play-modal/leather";
import { signMessage } from "../play-modal/unisat";
import { getXverseSign } from "../play-modal/xverse";
import RecentFlickersModal from "../recent-flickers-modal/recentFlickersModal";
import {
	useBalanceStore,
} from '../../store'
import { stat } from "fs";
interface FlipCoinContentProps {
}

interface dataProps {
	outcome: string,
	public_key: string,
	bet_amount: string,
	timeAgo: string
}

const FlipCoinContent:FC<FlipCoinContentProps> = ({  }) => {
	const [data, setData] = useState<dataProps[]>([]);
  	const[showRecentModal, setShowRecentModal] = useState(false);
  	const[showAddFundModal, setShowAddFundModal] = useState(false);
	const[gameResult, setGameResult] = useState(0);
	const[acd, setAcd] = useState(0.1);
	const[loading, setLoading] = useState(false);
	const[balance, setBalance] = useState(0);
	const[points, setPoints] = useState(0);
	const[status, setStatus] = useState('heads');
	const[start, setStart] = useState(false);
	const[idx, setIdx] = useState(0);
	const[startAnimation, setStartAnimation] = useState('coin_start.gif');
	const updateBalance = useBalanceStore(state => state.updateBalance);

	useEffect(() => {
		if(loading) {
			setTimeout(() => {
				setStartAnimation('coin_loop.gif')
			}, 100);
		} 

		const currentBalance = GetCookie('balance');
		if (currentBalance != '') {
			setBalance(Math.round((parseFloat(currentBalance) + Number.EPSILON) * 100) / 100);
		}
	}, [loading])

	useEffect(() => {
		updateBalance(balance)
	}, [balance])

	useEffect(() => {
		const intervalId = setInterval(async () => {
			setIdx((beforeIdx) => {
				return (beforeIdx + 1) % 3
			});
		}, 200)

		const fetchIntervalId = setInterval(async () => {
			const recentData = await GetrecentFlickers(null)
			setData(recentData)
		}, 5000);

		return () => {
			clearInterval(intervalId);
			clearInterval(fetchIntervalId);
		}
	}, [])

	useEffect(() => {
		(async () => {
			const profileData = await GetProfile();
			if(profileData.status == 200)
				setPoints(profileData.data.data.points)
		})();	
	}, [loading])

  const handleAddFundModal = () => {
    setShowAddFundModal(!showAddFundModal);
  }

  const handleRecentModal = () => {
    setShowRecentModal(!showRecentModal);
  }

	const handleAcd = (val: number) => {
    setAcd(val);
		setGameResult(0);
  }

	const startGame = async (choice: boolean) => {
		setStart(true);
		setGameResult(0);
		setLoading(true);
		let {commitment, gameNonce}  = await GetNonce();
		SetCookie('commitment', commitment);
		SetCookie('gameNonce', gameNonce);
		const wallet = GetCookie('wallet');
		let winAnimations = [1,4,8,10,12,14,15,16,18,19,21];
		let lostAnimations = [23,22,20,13,11,9,6,5,3];
		const winRandom = winAnimations[Math.floor(Math.random() * winAnimations.length)];
		const lostRandom = lostAnimations[Math.floor(Math.random() * lostAnimations.length)];

		if (wallet == 'xverse') {
			const { publicKey, signature } = await getXverseSign(gameNonce);
			if (publicKey != '' && signature != '') {
				const { gameResponse, newBalance } = await gameReveal(gameNonce, choice, acd, publicKey, signature);
				if (gameResponse != undefined && newBalance != '0.00') {
					setTimeout(() => {
						setStartAnimation(`coin_${gameResponse ? winRandom : lostRandom}.gif`);
						setBalance(Math.round((parseFloat(newBalance) + Number.EPSILON) * 100) / 100);
					}, 1000);
					setTimeout(() => {
						setLoading(false);
						setGameResult(gameResponse ? 1 : 2);
					}, 3600);
					SetCookie('balance', newBalance);
				} else {
					setLoading(false);
					setGameResult(0);
					enqueueSnackbar('Balance too low', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
				}
			} else {
				setLoading(false);
			}
		} else if(wallet == 'unisat') {
			const { publicKey, signature } = await signMessage(gameNonce)

			if (publicKey != '' && signature != '') {
				const { gameResponse, newBalance } = await gameReveal(gameNonce, choice, acd, publicKey, signature);
				if (gameResponse != undefined && newBalance != '0.00') {
					setTimeout(() => {
						setStartAnimation(`coin_${gameResponse ? winRandom : lostRandom}.gif`);
						setBalance(Math.round((parseFloat(newBalance) + Number.EPSILON) * 100) / 100);
					}, 1000);
					setTimeout(() => {
						setLoading(false);
						setGameResult(gameResponse ? 1 : 2);
					}, 3600);
					SetCookie('balance', newBalance);
				} else {
					setLoading(false);
					setGameResult(0);
					enqueueSnackbar('Balance too low', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
				}
			} else {
				setLoading(false);
			}
		} else if(wallet ==  'leather') {
			const { publicKey, signature } = await getLeatherSignature(gameNonce);

			if (publicKey != '' && signature != '') {
				const { gameResponse, newBalance } = await gameReveal(gameNonce, choice, acd, publicKey, signature);
				if (gameResponse != undefined && newBalance != '0.00') {
					setTimeout(() => {
						setStartAnimation(`coin_${gameResponse ? winRandom : lostRandom}.gif`);
						setBalance(Math.round((parseFloat(newBalance) + Number.EPSILON) * 100) / 100);
					}, 1000);
					setTimeout(() => {
						setLoading(false);
						setGameResult(gameResponse ? 1 : 2);
					}, 3600);
					SetCookie('balance', newBalance);
				} else {
					setLoading(false);
					setGameResult(0);
					enqueueSnackbar('Balance too low', {variant: 'error', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
				}
			} else {
				setLoading(false);
			}
		}
		setStart(false);
	}

  return(
    <>
      <div>
					{/* <p className="secondary-heading text-center m-0 mb-10">Flip Responsibly!</p>
					<h1 className="heading-primary">
						#1 PLACE TO <br /><span className="heading-primary__thick">BEAN</span> FLICK AND
						<span className="heading-primary__thick">COIN</span> FLIP
					</h1> */}
				</div>
				<section className="btns-wrapper">
					{/* <button className="btn-outline btn-outline--big mb-20">Switch to 2x mode</button> */}
					<div className="result mb-20 h-100">
						{
							loading && (
								<img className="coin-start-animation" src={`/static/animations/${startAnimation}`} alt="" />
							)
						}
						{
							gameResult == 1 ? (
								<>
									<img className="coin-start-animation" src={`/static/animations/${startAnimation}`} alt="" />
									<h2 className="result__title">YOU WON!</h2>
									<div className="result__subtitle text-success">+{acd} ACD3</div>
								</>
							) : gameResult == 2 ? (
								<>
									<img className="coin-start-animation" src={`/static/animations/${startAnimation}`} alt="" />
									<h2 className="result__title">YOU LOST</h2>
									<div className="result__subtitle text-alert">-{acd} ACD3</div>
								</>
							) : (<></>)
						}
					</div>
					{/* <div className="result mb-20 h-100">
						<h2 className="result__title">YOU LOST</h2>
						<div className="result__subtitle text-alert">-0.25 ACD3</div>
					</div> */}
					<div className="btns-inner-wrapper">
						{/* <div className="score-area">
							<div className="score-area__text">Token used <span className="fw-bold">ACD3</span></div>
							<div className="score-area__text">Total balance: {balance} ACD3</div>
						</div> */}
						<div className="btns-control">
							<div className="btns-control-left">
								<div className="btns-row mt-30">
									<button className={`btn-item btn-heads_tails ${status == 'heads' && 'btn-heads_tails-active'}`} id="head-btn" disabled={loading} onClick={() => {setStatus('heads')}}>
										<img style={status != 'heads' ? {width: '51px', height: '62px'} : {width: '116px', height: '142px', top: '-20px'}} className="btn-white__avatar" src={`/static/svgs/heads${status == 'heads' ? '_active' : '_inactive'}.svg`} alt="head icon" />
										<span>Heads</span>
									</button>
									<button className={`btn-item btn-heads_tails ${status == 'tails' && 'btn-heads_tails-active'}`} disabled={loading} onClick={() => {setStatus("tails")}}>
										<img style={status != 'tails' ? {width: '51px', height: '62px'} : {width: '116px', height: '142px', top: '-20px'}} className="btn-white__avatar" src={`/static/svgs/tails${status == 'tails' ? '_active' : '_inactive'}.svg`} alt="tail icon" />
										<span>Tails</span>
									</button>
								</div>
								<div className="btns-grid mt-30">
									<button disabled={loading} className={`btn-item ${acd == 0.1 && 'btn-item-active' }`} onClick={() => handleAcd(0.1)}>
										<span>0.1</span>
									</button>
									<button disabled={loading} className={`btn-item ${acd == 0.25 && 'btn-item-active' }`} onClick={() => handleAcd(0.25)}>
										<span>0.25</span>
									</button>
									<button disabled={loading} className={`btn-item ${acd == 0.5 && 'btn-item-active' }`} onClick={() => handleAcd(0.5)}>
										<span>0.5</span>
									</button>
									<button disabled={loading} className={`btn-item ${acd == 1 && 'btn-item-active' }`} onClick={() => handleAcd(1)}>
										<span>1</span>
									</button>
									<button disabled={loading} className={`btn-item ${acd == 2 && 'btn-item-active' }`} onClick={() => handleAcd(2)}>
										<span>2</span>
									</button>
									<button disabled={loading} className={`btn-item ${acd == 3 && 'btn-item-active' }`} onClick={() => handleAcd(3)}>
										<span>3</span>
									</button>
								</div>
							</div>
							<div className="btns-control-right">
								<div className={`switch ${start ? 'active' : ''}`} onClick={() => {
									if(status == 'heads') {
										startGame(true);
									}

									if(status == 'tails') {
										startGame(false);
									}
								}}>
									<img className="switch-fix" src="/static/img/switch_fix.png" alt="switch"/>
									<img className="switch-node" src="/static/img/switch_node.png" alt="switch"/>
									<img className="switch-ball" src="/static/img/switch_ball.png" alt="switch"/>
								</div>
								<img src={`/static/img/arrow_${(idx+1)}.png`} alt="switch"/>
							</div>
						</div>
						<div className="btns-display">
							<div className="btns-display-points">
								<div className="btns-display-points-title">
									XP points
								</div>
								<div className="btns-display-points-value">
									{
										("000000").substring(0, 6-points.toString().length)
									}
									<span>{points}</span>
								</div>
							</div>
							<div className="btns-display-recent">
								<div className="btns-display-recent-title">
									<span>Recent flickers</span>
									<span onClick={handleRecentModal}>See all</span>
								</div>
								{
									data.length ? <div className="btns-display-recent-value">
									{
										data.map(item => <div className="btns-display-recent-value-row">
											<div className="amount">
												<span className="balance">
													{item?.public_key.slice(0, 5)}...{item?.public_key.slice(-5)}	
												</span> just flipped <span className="bold">{Math.round((parseFloat(item.bet_amount) + Number.EPSILON) * 100) / 100} ACD3</span> and <span className={item.outcome}>{item.outcome}</span>
											</div>
										</div>)
									}
									</div> : 'Loading Data'
								}
							</div>
						</div>
						{/* <div className="text-center mt-30">
							<p>
								3% fees apply for every flip. Refer to <span className="fw-bold">FAQ</span> for more
								information.
							</p>
						</div> */}
						{/* <div className="btn-arrow-row">
							<button className="btn-arrow" onClick={handleRecentModal}>
								Recent Flickers
								<img className="btn-arrow__icon" src="static/svgs/arrow-right.svg" alt="arrow icon" />
							</button>
						</div> */}
					</div>
					
          <RecentFlickersModal show={showRecentModal} handleModal={handleRecentModal} tableData={data}/>
          <AddFundModal show={showAddFundModal} handleModal={handleAddFundModal} />
				</section>
    </>
  )
}

export default FlipCoinContent;