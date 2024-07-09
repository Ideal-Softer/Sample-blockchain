import { GetrecentFlickers } from "@/api/recent-flickers";
import { useQuery } from "@tanstack/react-query";
import { FC, useEffect } from "react";
import Modal from "../modal/modal";
import RecentFlickersTable from "../recent-flickers-table/recentFlickerTable";
// ts-ignore
interface tableData {
	bet_amount: string;
	outcome: string;
	timeAgo: string;
	public_key: string;
  }

interface RecentFlickersModalProps {
	tableData: Array<tableData>;
	show: boolean;
  handleModal: () => void;
}


const RecentFlickersModal:FC<RecentFlickersModalProps> = ({ tableData, show, handleModal }) => {
	useEffect(() => {
		// console.log('@@@', tableData)
	})
  return(
		<Modal customClass={'flickers-modal'} show={show} handleModal={handleModal}>
			<RecentFlickersTable tableData={tableData} />
		</Modal>
  )
}

export default RecentFlickersModal;