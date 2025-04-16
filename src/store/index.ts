import { create } from 'zustand';
import { Job, Application, User } from '../types';

interface Store {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}



export const useStore = create<Store>((set) => ({
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}));


export default useStore;