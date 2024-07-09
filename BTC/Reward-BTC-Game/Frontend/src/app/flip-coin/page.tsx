"use client"

import Error from "@/components/error/error";
import FlipCoinContent from "@/components/flip-coin-content/flipCoinContent";
import GetCookie from "@/hooks/cookies/getCookie";
import { useEffect, useState } from "react";

export default function FlipCoin() {
  const[isError, setIsError] = useState(false);
  const[show, setShow] = useState(false);
  const userId = GetCookie('userId');
  useEffect(() => {
    setTimeout(() => {
      setShow(true)
    }, 500);
		if (userId == '') {
      setIsError(true);
		} else {
      setIsError(false);
    }
  }, [])
  return (
    <>
      {
        show ? (
          isError ? (
            <Error
              message={'Please login first to access this page'}
              route={'/'}
              icon={'svgs/stop.svg'}
            />
          ) : (
            <FlipCoinContent />
          )
        ) : null
      }
    </>
  )
}
