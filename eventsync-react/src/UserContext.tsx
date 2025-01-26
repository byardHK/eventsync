// UserContext.tsx was written with the help of generative AI 

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserDetails{
    firstName: string | null;
    lastName: string | null;
    email: string | null;
}

interface UserContextType {
    userDetails: UserDetails;
    setUserDetails: React.Dispatch<React.SetStateAction<UserDetails>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider1: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userDetails, setUserDetails] = useState<UserDetails>({
        firstName: null,
        lastName: null,
        email: null
    })

    return (
        <UserContext.Provider value={{ userDetails, setUserDetails }}>
          {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};