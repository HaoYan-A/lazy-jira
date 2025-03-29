import axios from 'axios';
import { message } from 'antd';

const JIRA_API_BASE = '/api/rest/agile/1.0';

// 添加响应拦截器
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 清除本地存储的用户信息
      localStorage.removeItem('userInfo');
      localStorage.removeItem('selectedBoard');
      localStorage.removeItem('selectedSprint');
      
      // 显示错误消息
      message.error('登录已过期，请重新登录');
      
      // 跳转到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Board {
  id: number;
  name: string;
  projectName?: string;
}

export interface BoardResponse {
  values: Board[];
  maxResults: number;
  startAt: number;
  isLast: boolean;
}

export interface Sprint {
  id: number;
  name: string;
  state: string;
}

export interface SprintResponse {
  values: Sprint[];
}

export interface JiraUser {
  displayName: string;
  avatarUrls: {
    '48x48': string;
  };
}

interface CustomFieldOption {
  self: string;
  value: string;
  id: string;
}

export interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      color?: string;
    };
    assignee: JiraUser | null;
    priority: {
      name: string;
      iconUrl: string;
    };
    issuetype: {
      name: string;
      iconUrl: string;
    };
    customfield_11103: JiraUser[] | null;
    customfield_10002: number | null;
    customfield_11602: number | null;
    customfield_12617: CustomFieldOption | null;
    created: string;
    updated: string;
    description?: string;
  };
}

export interface SprintIssuesResponse {
  issues: Issue[];
  total: number;
  isLast: boolean;
  maxResults: number;
}

export interface Status {
  id: string;
  name: string;
  statusCategory: {
    key: string;
    name: string;
  };
}

export interface StatusResponse {
  values: Status[];
}

export const jiraApi = {
  // 获取所有看板
  getBoards: async (startAt: number = 0, maxResults: number = 50): Promise<BoardResponse> => {
    const response = await axios.get(`${JIRA_API_BASE}/board`, {
      params: {
        startAt,
        maxResults
      }
    });
    return response.data;
  },

  // 获取所有 Sprint
  getSprints: async (boardId: number): Promise<SprintResponse> => {
    const response = await axios.get(`${JIRA_API_BASE}/board/${boardId}/sprint`);
    return response.data;
  },

  // 获取当前活跃的 Sprint
  getActiveSprints: async (boardId: number): Promise<SprintResponse> => {
    const response = await axios.get(`${JIRA_API_BASE}/board/${boardId}/sprint`, {
      params: {
        state: 'active'
      }
    });
    return response.data;
  },

  // 获取 Sprint 下的所有任务
  getSprintIssues: async (sprintId: number, startAt: number = 0, maxResults: number = 50, jql?: string): Promise<SprintIssuesResponse> => {
    const params: any = {
      fields: 'summary,status,assignee,priority,issuetype,customfield_11103,customfield_10002,customfield_11602,customfield_12617',
      startAt,
      maxResults
    };

    if (jql) {
      params.jql = jql;
    }

    const response = await axios.get(`${JIRA_API_BASE}/sprint/${sprintId}/issue`, { params });
    return response.data;
  },

  login: async (username: string, password: string) => {
    try {
      const auth = btoa(`${username}:${password}`);
      const response = await axios.get('/api/rest/auth/1/session', {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': '*/*'
        }
      });

      if (response.status === 200) {
        return response.data;
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  // 获取所有状态
  getStatuses: async (): Promise<StatusResponse> => {
    const response = await axios.get('/api/rest/api/3/status');
    return response.data;
  }
};