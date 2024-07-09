import { FC, useEffect } from "react";
import Modal from "../modal/modal";
// ts-ignore

interface BadgeModalProps {
	badge: {
		name: string,
		count: number
	},
	show: boolean;
    handleModal: () => void;
}


const BadgeModal:FC<BadgeModalProps> = ({ badge, show, handleModal }) => {
	useEffect(() => {
		// console.log('@@@', tableData)
	})
  return(
		<Modal customClass={'badge-modal'} show={show} handleModal={handleModal}>
			<img src="/static/svgs/close.svg" className="close" onClick={handleModal}/>
			<div className="title">
				You got a new badge!
			</div>
			<div className="badge_image">
				<img src={`/static/svgs/${badge.name}.svg`} />
			</div>
			<div className="desc">
				5-game {badge.name.split('_').join(' ')}
			</div>
		</Modal>
  )
}

export default BadgeModal;