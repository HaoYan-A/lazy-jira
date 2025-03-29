import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  username: string;
  displayName: string;
  emailAddress: string;
  avatarUrls: {
    '48x48': string;
  };
  setUsername: (username: string) => void;
  setUserInfo: (info: {
    username: string;
    displayName: string;
    emailAddress: string;
    avatarUrls: {
      '48x48': string;
    };
  }) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [avatarUrls, setAvatarUrls] = useState<{ '48x48': string }>({ '48x48': '' });

  useEffect(() => {
    // 从本地存储恢复用户信息
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { username, displayName, emailAddress, avatarUrls } = JSON.parse(userInfo);
      setUsername(username);
      setDisplayName(displayName);
      setEmailAddress(emailAddress);
      setAvatarUrls(avatarUrls);
    }
  }, []);

  const setUserInfo = (info: {
    username: string;
    displayName: string;
    emailAddress: string;
    avatarUrls: {
      '48x48': string;
    };
  }) => {
    setUsername(info.username);
    setDisplayName(info.displayName);
    setEmailAddress(info.emailAddress);
    setAvatarUrls(info.avatarUrls);
  };

  const logout = () => {
    setUsername('');
    setDisplayName('');
    setEmailAddress('');
    setAvatarUrls({ '48x48': '' });
    localStorage.removeItem('userInfo');
  };

  return (
    <UserContext.Provider value={{ 
      username, 
      displayName,
      emailAddress,
      avatarUrls,
      setUsername, 
      setUserInfo,
      logout 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 