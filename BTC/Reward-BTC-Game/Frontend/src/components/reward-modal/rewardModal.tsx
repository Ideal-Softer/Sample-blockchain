"use client"

import { GetReferral } from "@/api/referral";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { FC } from "react";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Modal from "../modal/modal";

interface RewardModalProps {
  show: boolean;
  handleModal: () => void;
}

const RewardModal:FC<RewardModalProps> = ({ show, handleModal }) => {
	const {data} = useQuery({
    queryKey: ['referral'],
    queryFn:  GetReferral
  })

  return(
		<Modal customClass={'rewards-modal'} show={show} handleModal={handleModal}>
			<div className="refer">
					<h1 className="refer__title">Refer to earn rewards</h1>
					<ul className="refer__list">
						<li className="refer__item">
							<p className="refer__text">Refer id</p>
							<div className="refer__right-content">
								<p>{data}</p>
								<CopyToClipboard text={data} onCopy={() => enqueueSnackbar('Copied', {variant: 'success', anchorOrigin: {horizontal: 'left', vertical: 'top'}})}>
									<img src="/static/svgs/copy.svg" alt="copy icon" />
								</CopyToClipboard>
							</div>
						</li>
						<li className="refer__item">
							<p className="refer__text">Refer link</p>
							<div className="refer__right-content">
								<p>https://....{data}</p>
								<CopyToClipboard text={`${window.location.origin}/?ref=${data}`} onCopy={() => enqueueSnackbar('Copied', {variant: 'success', anchorOrigin: {horizontal: 'left', vertical: 'top'}})}>
									<img src="/static/svgs/copy.svg" alt="copy icon" />
								</CopyToClipboard>
							</div>
						</li>
					</ul>
					<button className="refer__btn">Invite Friends</button>
					<ul className="refer__social-list">
						<li className="refer__social-item">
							<a href="#" className="refer__social-link">
								<img src="/static/svgs/facebook.svg" alt="facebook icon" />
							</a>
						</li>
						<li className="refer__social-item">
							<a href="#" className="refer__social-link">
								<img src="/static/svgs/instagram.svg" alt="instagram icon" />
							</a>
						</li>
						<li className="refer__social-item">
							<a href="#" className="refer__social-link">
								<img src="/static/svgs/twitter.svg" alt="twitter icon" />
							</a>
						</li>
						<li className="refer__social-item">
							<a href="#" className="refer__social-link">
								<img src="/static/svgs/whatsapp.svg" alt="whatsapp icon" />
							</a>
						</li>
						<li className="refer__social-item">
							<a href="#" className="refer__social-link">
								<img src="/static/img/telegram.png" alt="telegram icon" />
							</a>
						</li>
					</ul>
				</div>
		</Modal>
  )
}

export default RewardModal;