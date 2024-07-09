import {create} from "zustand";

interface BalanceStore {
    balance: number;
    updateBalance: (newBalance: number) => void;
}

export const useBalanceStore = create<BalanceStore>((set) => ({
    balance: 0,
    updateBalance: (newBalance) => set({ balance: newBalance }),
}));