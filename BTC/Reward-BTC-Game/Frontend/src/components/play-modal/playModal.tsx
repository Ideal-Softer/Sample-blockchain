"use client";

import { useGlobalContext } from "@/app/react-query-provider/reactQueryProvider";
import { useRouter } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { FC, useState } from "react";
import Modal from "../modal/modal";
import { handleLeather } from "./leather";
import { handleUnisat } from "./unisat";
import { handleXverse } from './xverse';

interface PlayModalProps {
	show: boolean;
	handleModal: () => void;
}

Object.defineProperty(global, "_bitcore", {
	get() {
		return undefined;
	},
	set() { },
});

const PlayModal: FC<PlayModalProps> = ({ show, handleModal }) => {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { isLoggedin, setIsLoggedIn } = useGlobalContext();
	return (
		<Modal customClass={'play-modal'} show={show} handleModal={handleModal}>
			<h1 className="modal__heading text-center">Connect your <br />wallet to play</h1>
			<p className="modal__text text-center">
				If you dont have a wallet, you can select a <br /> provider 
				and create one now
			</p>
			<div className="modal__btn-wrapper">
				<button disabled={loading} className="btn-secondary" onClick={async () => {
					setLoading(true);
					const flag = await handleLeather();
					if (flag) {
						router.push('/flip-coin');
						setIsLoggedIn(true);
						setLoading(false);
						enqueueSnackbar('Logged In', {variant: 'success', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
					} else {
						setLoading(false);
					}
				}}>
					<img src="/static/img/leather-icon.png" alt="leather-icon" /><span>Leather</span>
				</button>
				<button disabled={loading} className="btn-secondary" onClick={async () => {
					setLoading(true);
					const flag = await handleUnisat();
					if (flag) {
						router.push('/flip-coin');
						setIsLoggedIn(true);
						setLoading(false);
						enqueueSnackbar('Logged In', {variant: 'success', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
					} else {
						setLoading(false);
					}
				}}>
					<img src="/static/img/unisat-icon.png" alt="unisat-icon" /><span>UniSat</span>
				</button>
				<button disabled={loading} className="btn-secondary" onClick={async () => {
					setLoading(true);
					const flag = await handleXverse();
					if (flag) {
						router.push('/flip-coin');
						setIsLoggedIn(true);
						setLoading(false);
						enqueueSnackbar('Logged In', {variant: 'success', anchorOrigin: {horizontal: 'left', vertical: 'top'}})
					} else {
						setLoading(false);
					}
				}}>
					<img src="/static/img/xverse-icon.png" alt="xverse-icon" /><span>Xverse</span>
				</button>
			</div>
		</Modal>
	)
}

export default PlayModal;