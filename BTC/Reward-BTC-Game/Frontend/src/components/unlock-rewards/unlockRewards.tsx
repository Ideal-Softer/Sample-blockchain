"use client"

import { FC, useState } from "react";
import RewardModal from "../reward-modal/rewardModal";

interface UnlockRewardsProps {

}

const UnlockRewards:FC<UnlockRewardsProps> = () => {
  const[showRewardModal, setShowRewardModal] = useState(false);

  const handleRewardModal = () => {
    setShowRewardModal(!showRewardModal);
  }
  return(
    <div className="footer__container">
      <button className="btn-reward position-b-r" onClick={handleRewardModal}>
        <img
          className="btn-reward__icon"
          src="/static/svgs/unlock-rewards.svg"
          alt="gift box icon"
        />
        <div className="btn-reward__content">
          <p className="btn-reward__title">UNLOCK REWARDS</p>
          <p className="btn-reward__subtitle">INVITE YOUR FRIENDS</p>
        </div>
      </button>
      <RewardModal show={showRewardModal} handleModal={handleRewardModal} />
    </div>
  )
}

export default UnlockRewards;