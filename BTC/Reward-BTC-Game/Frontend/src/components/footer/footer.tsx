"use client";

import { useGlobalContext } from "@/app/react-query-provider/reactQueryProvider";
import GetCookie from "@/hooks/cookies/getCookie";
import { usePathname } from "next/navigation";
import { FC, useEffect } from "react";
import UnlockRewards from "../unlock-rewards/unlockRewards";

interface FooterProps {
}

const Footer:FC<FooterProps> = () => {
  const router = usePathname();
  const { isLoggedin, setIsLoggedIn } = useGlobalContext();
  console.log("isLogged In",isLoggedin);
  console.log("path",router);
  useEffect(() => {
    const userId = GetCookie('userId');
    if(userId != '') {
      setIsLoggedIn(true);
    }
  }, [])
  return(
  <footer className="footer">
    {/* { isLoggedin && <UnlockRewards /> } */}
    <h3 className="footer__heading">
      3% fees apply for every flip. Refer to <a href="#" className="footer__heading-number">FAQ</a> for more information.
    </h3>
    <h3 className="footer__subheading">Game powered by https://ordinals.com/   <br /> <span>All rights reserved to Flick the Bean</span></h3>
  </footer>
    
  )
}

export default Footer;