import type { Metadata } from 'next';
import React from 'react';
import './../../styles/main.scss';
import ReactQueryProvider from './react-query-provider/reactQueryProvider';



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <ReactQueryProvider>
      {children}
    </ReactQueryProvider>
  )
}
