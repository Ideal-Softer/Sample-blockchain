import { FC, useEffect } from "react";

interface tableData {
  bet_amount: string;
  outcome: string;
  timeAgo: string;
  public_key: string;
}

interface RecentFlickersTableProps {
  tableData: Array<tableData>;
  classname?: string;
}

const RecentFlickersTable:FC<RecentFlickersTableProps> = ({ tableData, classname }) => {
  useEffect(() => {
  //  console.log('@@@', tableData) 
  })
  return(
    <ul className={`primary-list primary-list--${classname ? classname : 'home'}`}>
      <li className="primary-list__header">
        <div className="primary-list__header__col">Most recent been flickers</div>
        <div className="primary-list__header__col-2">See all</div>
      </li>
      <li>
        <ul>
        {
          tableData ? tableData.map((item, index) => (
            <li className="primary-list__item" key={index}>
              <div className="primary-list__col">{item?.public_key.slice(0, 5)}...{item?.public_key.slice(-5)}</div>
              <div className="primary-list__col-2">flipped <span>{Math.round((parseFloat(item.bet_amount) + Number.EPSILON) * 100) / 100} ACD3</span> and <span style={{color: item.outcome == 'lost' ? '#EF4343' : '#5BEF43'}}>{item.outcome}</span></div>
              <div className="primary-list__col-3">{item.timeAgo}</div>
            </li>
          )) : <p style={{ textAlign: 'center', marginTop: 50 }}>Loading Data</p>
        }  
        </ul>  
      </li>
      
      <div>
      </div>
    </ul>
  )
}

export default RecentFlickersTable;