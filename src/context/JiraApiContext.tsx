import React, { createContext, useContext } from 'react';
import { jiraApi } from '../services/jiraApi';

const JiraApiContext = createContext(jiraApi);

export const JiraApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <JiraApiContext.Provider value={jiraApi}>
      {children}
    </JiraApiContext.Provider>
  );
};

export function useJiraApi() {
  const context = useContext(JiraApiContext);
  if (!context) {
    throw new Error('useJiraApi must be used within a JiraApiProvider');
  }
  return context;
} 