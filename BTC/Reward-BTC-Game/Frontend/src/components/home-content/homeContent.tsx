import { GetrecentFlickers } from "@/api/recent-flickers";
import { useGlobalContext } from "@/app/react-query-provider/reactQueryProvider";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { FC, useEffect, useState } from "react";
import PlayModal from "../play-modal/playModal";
import RecentFlickersTable from "../recent-flickers-table/recentFlickerTable";
import RecentFlickersModal from "../recent-flickers-modal/recentFlickersModal";
import { useRouter } from "next/navigation";

const HomeContent:FC = () => {
  const[showRecentModal, setShowRecentModal] = useState(false);
  const[showModal, setShowModal] = useState(false);
  const searchParams = useSearchParams();
  const { isLoggedin, setIsLoggedIn } = useGlobalContext();
  const search = searchParams.get('ref');
  const router = useRouter();

  const {data, isLoading, isRefetching} = useQuery({
    queryKey: ['recent'],
    queryFn:  () => GetrecentFlickers(search)
  });


  useEffect(() => {
		setIsLoggedIn(true);
    router.push('/flip-coin');
    console.log("component mounted", search);
  }, [])

  if(isLoading) {
    console.log("Loading");
  }
  if (data) {
    console.log(data);
  }

  if(isRefetching) {
    console.log('isRefetching');
    
  }

  const handleModal = () => {
    setShowModal(!showModal)
  }
  return(
    <div>
      <div className="home-content">
        <section>
          <h1 className="heading-primary">
            <img src="/static/img/border.png" alt="border"/>
            <img src="/static/img/landing.png" alt="landing"/>
          </h1>
        </section>
        <section className="center-area">
          <span>
            #1 place to <br /> tug the nug and <br /> coin flip
          </span>
          <div className="start_button" onClick={handleModal}></div>
          <RecentFlickersTable tableData={data} />
        </section>
      </div>
      <PlayModal show={showModal} handleModal={handleModal} />
    </div>
  )
}

export default HomeContent;