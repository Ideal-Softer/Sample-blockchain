import Link from "next/link";
import { FC } from "react";

interface ErrorProps {
  message: string;
  route?: string;
  icon?: string;
}

const Error :FC<ErrorProps> = ({ message, route, icon }) => {
  return (
    <div className="error-container">
      {
        icon && <img src={`/static/${icon}`} alt="" />
      }
      <p>{message}</p>
      {
        route && <Link href={route}>Go back</Link>
      }
    </div>
  )
}

export default Error;