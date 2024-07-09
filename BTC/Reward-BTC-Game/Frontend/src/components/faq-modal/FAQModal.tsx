import { GetProfile } from "@/api/profile";
import GetCookie from '@/hooks/cookies/getCookie';
import { GetrecentFlickers } from "@/api/recent-flickers";
import { useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { FC, useState, useEffect } from "react";
import Modal from "../modal/modal";
import RecentFlickersTable from "../recent-flickers-table/recentFlickerTable";
import BadgeModal from "../badge-modal/badge-modal";
import { create } from "domain";
import { profile } from "console";

interface FaqModalProps {
	show: boolean;
  handleModal: () => void;
}

const FaqModal:FC<FaqModalProps> = ({ show, handleModal }) => {
  return(
		<Modal customClass={'faq-modal'} show={show} handleModal={handleModal}>
			<div className="faq">
				<div className="close">
					<img src="/static/svgs/close.svg" />
				</div>
				<div className="faq-title text-yellow title">
					FAQ
				</div>
				<div className="content">
					<div className="item">
						<div className="text-yellow">
							What tokens can I flip?
						</div>
						<div className="text-white">
							You can flip Solana or select a token from our constantly growing list.
						</div>
						<div className="separator" />
					</div>
					<div className="item">
						<div className="text-yellow">
							What are the fees?
						</div>
						<div className="text-white">
							We charge 3% per flip irrespective of winning or losing. For example, flipping 1 SOL will cost a total for 1.03 SOL.
						</div>
						<div className="separator" />
					</div>
					<div className="item">
						<div className="text-yellow">
						How do I collect my winnings?
						</div>
						<div className="text-white">
						The winning amount will be automatically transferred by us.
						</div>
						<div className="separator" />
					</div>
					<div className="item">
						<div className="text-yellow">
						What's the max amount I can bet?
						</div>
						<div className="text-white">
						Every token has it's own max limit based on our treasury size. You can bet any amount upto the max limit!
						</div>
						<div className="separator" />
					</div>
					<div className="item">
						<div className="text-yellow">
						Why is the balance shown slightly less than my actual wallet balance?
						</div>
						<div className="text-white">
						We have calculated your balance to compensate for 3% fees.
						</div>
						<div className="separator" />
					</div>
					<div className="item">
						<div className="text-yellow">
						What are the onchain addresses?
						</div>
						<div className="text-white">
						Program: <span className="strong">72D3En8GQycjtunxf9mgyR8onzYdPqYFsKp4myUzhaRZ</span> <br />
						Treasury: <span className="strong">ByjcyGru3RTeAheTjoFJi7mL8knNmzHz1twuoqjbjRtF</span>
						</div>
						<div className="separator" />
					</div>
					<div className="item">
						<div className="text-yellow">
							How do I know Flick the Bean is fair?
						</div>
						<div className="text-white">
							All flips can be checked onchain through our program address above or by tracking our flipping wallet: <span className="strong">FFFzSCxKWZZvetfW86JbvMRUJxjkMAwMu35cEe4HDyaN</span><br />
							You can also hit our API to examine the odds yourself.
						</div>
					</div>
				</div>
			</div>
		</Modal>
  )
}

export default FaqModal;