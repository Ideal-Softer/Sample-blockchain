"use client";

import Footer from '@/components/footer/footer';
import Navbar from '@/components/nav/nav';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from 'notistack';
import React, { FC, createContext, useContext, useState } from 'react';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
    },
  }
});


export type LoginContext = {
  isLoggedin: boolean
  setIsLoggedIn:(c: boolean) => void
}

export const Context = createContext<LoginContext>({
  isLoggedin: false,
  setIsLoggedIn: () => {}
});

export const useGlobalContext = () => useContext(Context)

const ReactQueryProvider:FC<ReactQueryProviderProps> = ({ children }) => {
  const [isLoggedin, setIsLoggedIn] = useState<boolean>(false);
  return (
    <Context.Provider value={{isLoggedin, setIsLoggedIn}}>
      <QueryClientProvider client={queryClient}>
        <html lang="en">
          <body>
            <div className="bg-wrapper">
              <Navbar />
              <main className="main-wrapper">
                <SnackbarProvider autoHideDuration={2000}>
                  {children}
                </SnackbarProvider>
              </main>
              <Footer />
            </div>
          </body>
        </html>
      </QueryClientProvider>
    </Context.Provider>
  );
}

export default ReactQueryProvider;