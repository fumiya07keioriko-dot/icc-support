import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const STORAGE_KEY = "icc_my_staff_id";

type MySelfContextType = {
  myStaffId: string | null;
  setMyStaffId: (id: string | null) => void;
};

const MySelfContext = createContext<MySelfContextType>({
  myStaffId: null,
  setMyStaffId: () => {},
});

export function MySelfProvider({ children }: { children: ReactNode }) {
  const [myStaffId, setMyStaffIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setMyStaffId = (id: string | null) => {
    setMyStaffIdState(id);
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  return (
    <MySelfContext.Provider value={{ myStaffId, setMyStaffId }}>
      {children}
    </MySelfContext.Provider>
  );
}

export function useMyself() {
  return useContext(MySelfContext);
}
