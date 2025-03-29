import React, { createContext, useContext } from 'react';
import { jiraApi } from '../services/jiraApi';

interface JiraApiContextType {
  login: (username: string, password: string) => Promise<any>;
}

const JiraApiContext = createContext<JiraApiContextType | undefined>(undefined);

export const JiraApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const login = async (username: string, password: string) => {
    return await jiraApi.login(username, password);
  };

  return (
    <JiraApiContext.Provider value={{ login }}>
      {children}
    </JiraApiContext.Provider>
  );
};

export const useJiraApi = () => {
  const context = useContext(JiraApiContext);
  if (context === undefined) {
    throw new Error('useJiraApi must be used within a JiraApiProvider');
  }
  return context;
}; 