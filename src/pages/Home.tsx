import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Typography, Button, Space, Select, message, Table, Tag, Avatar, Switch, Input, Form, Drawer, Divider, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { jiraApi, Sprint, Board, Issue, JiraUser, Status, Transition } from '../services/jiraApi';
import type { ColumnsType } from 'antd/es/table';
import SettingsDrawer from './components/SettingsDrawer';
import IssueDetailDrawer from './components/IssueDetailDrawer';
import { SettingOutlined, SearchOutlined, BarChartOutlined, CheckCircleOutlined, CloseCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { debounce } from 'lodash';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const STATUS_COLORS = {
  'New': 'default',
  'Closed': 'default',
  'Reopened': 'default',
  'To Do': 'default',
  'In Dev': 'processing',
  'Ready to Test': 'warning',
  'Testing': 'warning',
  'Ready for PO Review': 'processing',
  'PO Review Pass': 'success',
  'Released': 'success',
  'PO Review Failed': 'error'
};

const STATUS_LIST = [
  'New',
  'Closed',
  'Reopened',
  'To Do',
  'In Dev',
  'Ready to Test',
  'Testing',
  'Ready for PO Review',
  'PO Review Pass',
  'Released',
  'PO Review Failed'
];

const TEST_STATUSES = [
  'Ready to Test',
  'PO Review',
  'PO Review Failed',
  'PO Review Pass',
  'Released'
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { username, logout, avatarUrls, displayName } = useUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<number | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null);
  const [boardSearchText, setBoardSearchText] = useState('');
  const [sprintSearchText, setSprintSearchText] = useState('');
  const [columns, setColumns] = useState<ColumnsType<Issue>>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showOnlyMe, setShowOnlyMe] = useState(false);
  const [originalIssues, setOriginalIssues] = useState<Issue[]>([]);
  const [totalStoryPoints, setTotalStoryPoints] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [searchForm] = Form.useForm();
  const [searchParams, setSearchParams] = useState({
    issueKey: '',
    summary: '',
    status: undefined as string[] | undefined,
    showOnlyMe: false,
    coding: undefined as string | undefined
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [stats, setStats] = useState({
    completedStoryPoints: 0,
    completedDevHours: 0,
    completedIssues: [] as Issue[],
    incompleteIssues: [] as Issue[]
  });
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statsDrawerVisible, setStatsDrawerVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string>('');
  const [editingSummary, setEditingSummary] = useState<string>('');
  const [editingAssignee, setEditingAssignee] = useState<string>('');
  const [assignableUsers, setAssignableUsers] = useState<JiraUser[]>([]);
  const [assigneeSearchText, setAssigneeSearchText] = useState('');
  const [assigneeModalVisible, setAssigneeModalVisible] = useState(false);
  const [currentEditingRecord, setCurrentEditingRecord] = useState<Issue | null>(null);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [isEditingDeveloper, setIsEditingDeveloper] = useState(false);
  const [assigneeSearchLoading, setAssigneeSearchLoading] = useState(false);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [transitionModalVisible, setTransitionModalVisible] = useState(false);
  const [storyPointsModalVisible, setStoryPointsModalVisible] = useState(false);
  const [editingStoryPoints, setEditingStoryPoints] = useState<string>('');
  const [devHoursModalVisible, setDevHoursModalVisible] = useState(false);
  const [editingDevHours, setEditingDevHours] = useState<string>('');
  const [codingModalVisible, setCodingModalVisible] = useState(false);
  const [editingCoding, setEditingCoding] = useState<string>('');
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      handleAssigneeSearch(value);
    }, 300),
    []
  );

  useEffect(() => {
    // 从本地存储获取保存的看板和 Sprint
    const savedBoard = localStorage.getItem('selectedBoard');
    const savedSprint = localStorage.getItem('selectedSprint');
    
    if (savedBoard) {
      const boardId = parseInt(savedBoard);
      setSelectedBoard(boardId);
      // 加载默认看板后立即加载对应的 Sprint
      fetchSprints(boardId);
    }
    
    if (savedSprint) {
      const sprintId = parseInt(savedSprint);
      setSelectedSprint(sprintId);
    }
  }, []);

  useEffect(() => {
    if (selectedSprint) {
      fetchSprintIssues(selectedSprint, currentPage, pageSize);
    }
  }, [selectedSprint, currentPage, pageSize]);

  useEffect(() => {
    const baseColumns: ColumnsType<Issue> = [
      {
        title: '任务编码',
        dataIndex: ['key'],
        key: 'key',
        width: 180,
        fixed: 'left',
        render: (text: string, record: Issue) => (
          <Space>
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={() => {
                const url = `https://jira.logisticsteam.com/browse/${text}`;
                window.open(url, '_blank');
              }}
              style={{ padding: '0 4px' }}
            />
            <img
              src={record.fields.issuetype.iconUrl}
              alt={record.fields.issuetype.name}
              style={{ width: 16, height: 16 }}
            />
            <Button 
              type="link" 
              onClick={() => {
                setSelectedIssue(record);
                setDetailDrawerVisible(true);
              }}
            >
              {text}
            </Button>
          </Space>
        ),
      },
      {
        title: '任务主题',
        dataIndex: ['fields', 'summary'],
        key: 'summary',
        width: 300,
        ellipsis: true,
        render: (text: string, record: Issue) => (
          <div 
            style={{ 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              width: '100%'
            }}
            onDoubleClick={() => {
              setCurrentEditingRecord(record);
              setEditingSummary(record.fields.summary);
              setSummaryModalVisible(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {text}
          </div>
        ),
      },
      {
        title: '任务所有者',
        dataIndex: ['fields', 'assignee'],
        key: 'assignee',
        width: 150,
        render: (assignee: Issue['fields']['assignee'], record: Issue) => (
          <div 
            style={{ 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              width: '100%'
            }}
            onDoubleClick={() => {
              setCurrentEditingRecord(record);
              setEditingAssignee(assignee?.name || '');
              setIsEditingDeveloper(false);
              setAssigneeModalVisible(true);
              // 加载可分配用户列表
              handleAssigneeSearch('');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {assignee && assignee.avatarUrls ? (
              <Space>
                <Avatar
                  size="small"
                  src={assignee.avatarUrls['48x48']}
                />
                {assignee.displayName}
              </Space>
            ) : '未分配'}
          </div>
        ),
      },
      {
        title: '开发者',
        dataIndex: ['fields', 'customfield_11103'],
        key: 'developer',
        width: 150,
        render: (developers: JiraUser[] | null, record: Issue) => (
          <div 
            style={{ 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              width: '100%'
            }}
            onDoubleClick={() => {
              setCurrentEditingRecord(record);
              setEditingAssignee(developers?.[0]?.name || '');
              setIsEditingDeveloper(true);
              setAssigneeModalVisible(true);
              // 加载可分配用户列表
              handleAssigneeSearch('');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {developers && developers.length > 0 ? (
              <Space>
                <Avatar
                  size="small"
                  src={developers[0].avatarUrls['48x48']}
                />
                {developers[0].displayName}
              </Space>
            ) : '未分配'}
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: ['fields', 'status'],
        key: 'status',
        width: 100,
        render: (status: Issue['fields']['status'], record: Issue) => (
          <div 
            style={{ 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              width: '100%',
              textAlign: 'center'
            }}
            onDoubleClick={() => {
              setCurrentEditingRecord(record);
              setTransitionModalVisible(true);
              // 加载可用的状态转换
              jiraApi.getTransitions(record.key).then(transitions => {
                setTransitions(transitions);
              });
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Tag color={status.color}>{status.name}</Tag>
          </div>
        ),
      },
      {
        title: '优先级',
        dataIndex: ['fields', 'priority'],
        key: 'priority',
        width: 100,
        render: (priority: Issue['fields']['priority']) => (
          <img
            src={priority.iconUrl}
            alt={priority.name}
            style={{ width: 16, height: 16 }}
          />
        ),
      },
      {
        title: 'Story Points',
        dataIndex: ['fields', 'customfield_10002'],
        key: 'storyPoints',
        width: 100,
        render: (points: number | null, record: Issue) => (
          <div 
            style={{ 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              width: '100%',
              textAlign: 'center'
            }}
            onDoubleClick={() => {
              setCurrentEditingRecord(record);
              setEditingStoryPoints(points?.toString() || '');
              setStoryPointsModalVisible(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {points || '-'}
          </div>
        ),
      },
      {
        title: 'Dev Hours',
        dataIndex: ['fields', 'customfield_11602'],
        key: 'devHours',
        width: 100,
        render: (hours: number | null, record: Issue) => (
          <div 
            style={{ 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              width: '100%',
              textAlign: 'center'
            }}
            onDoubleClick={() => {
              setCurrentEditingRecord(record);
              setEditingDevHours(hours?.toString() || '');
              setDevHoursModalVisible(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {hours || '-'}
          </div>
        ),
      },
      {
        title: 'Coding',
        dataIndex: ['fields', 'customfield_12617'],
        key: 'coding',
        width: 100,
        render: (coding: { value: string } | null, record: Issue) => (
          <div 
            style={{ 
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              width: '100%',
              textAlign: 'center'
            }}
            onDoubleClick={() => {
              setCurrentEditingRecord(record);
              setEditingCoding(coding?.value || '');
              setCodingModalVisible(true);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {coding?.value || '-'}
          </div>
        ),
      },
    ];

    setColumns(baseColumns);
  }, [editingKey, editingSummary, editingAssignee]);

  const fetchAllBoards = async () => {
    try {
      setLoading(true);
      let allBoards: Board[] = [];
      let startAt = 0;
      let isLast = false;

      while (!isLast) {
        const response = await jiraApi.getBoards(startAt);
        allBoards = [...allBoards, ...response.values];
        isLast = response.isLast;
        startAt += response.maxResults;
      }

      console.log('All boards:', allBoards);
      setBoards(allBoards);
      
      // 从本地存储获取保存的看板
      const savedBoard = localStorage.getItem('selectedBoard');
      if (savedBoard) {
        const boardId = parseInt(savedBoard);
        if (allBoards.some(board => board.id === boardId)) {
          setSelectedBoard(boardId);
        }
      } else if (allBoards.length > 0) {
        setSelectedBoard(allBoards[0].id);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
      message.error('获取看板列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchSprints = async (boardId: number) => {
    try {
      setLoading(true);
      const response = await jiraApi.getActiveSprints(boardId);
      setSprints(response.values);
      
      // 从本地存储获取保存的 Sprint
      const savedSprint = localStorage.getItem('selectedSprint');
      if (savedSprint) {
        const sprintId = parseInt(savedSprint);
        if (response.values.some(sprint => sprint.id === sprintId)) {
          setSelectedSprint(sprintId);
        }
      } else if (response.values.length > 0) {
        setSelectedSprint(response.values[0].id);
      } else {
        setSelectedSprint(null);
      }
    } catch (error) {
      message.error('获取 Sprint 列表失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalStoryPoints = (issues: Issue[]) => {
    const total = issues.reduce((sum, issue) => {
      const status = issue.fields.status.name;
      const points = issue.fields.customfield_10002 || 0;
      return TEST_STATUSES.includes(status) ? sum + points : sum;
    }, 0);
    setTotalStoryPoints(total);
  };

  const fetchSprintIssues = async (sprintId: number, page: number = 1, size: number = 50) => {
    try {
      setLoading(true);
      const startAt = (page - 1) * size;
      
      // 构建 JQL 查询条件
      let jqlConditions = [];
      
      // 只看我的条件
      if (searchParams.showOnlyMe) {
        jqlConditions.push(`Developer = ${username}`);
      }
      
      // 任务编码查询
      if (searchParams.issueKey) {
        jqlConditions.push(`key = "${searchParams.issueKey}"`);
      }
      
      // 任务主题查询
      if (searchParams.summary) {
        // 转义特殊字符，使用双反斜杠
        const escapedSummary = searchParams.summary
          .replace(/\[/g, '\\\\[')
          .replace(/\]/g, '\\\\]')
          .replace(/\(/g, '\\\\(')
          .replace(/\)/g, '\\\\)')
          .replace(/\{/g, '\\\\{')
          .replace(/\}/g, '\\\\}')
          .replace(/\?/g, '\\\\?')
          .replace(/\*/g, '\\\\*')
          .replace(/\+/g, '\\\\+')
          .replace(/\|/g, '\\\\|')
          .replace(/\^/g, '\\\\^')
          .replace(/\$/g, '\\\\$')
          .replace(/\./g, '\\\\.');
        jqlConditions.push(`summary ~ "${escapedSummary}"`);
      }
      
      // 状态查询
      if (searchParams.status && searchParams.status.length > 0) {
        const statusValues = searchParams.status.map(status => `"${status}"`).join(',');
        jqlConditions.push(`status IN (${statusValues})`);
      }
      
      // 组合所有条件
      const jql = jqlConditions.length > 0 ? jqlConditions.join(' AND ') : undefined;
      
      const response = await jiraApi.getSprintIssues(sprintId, startAt, size, jql);
      setOriginalIssues(response.issues);
      setIssues(response.issues);
      setTotal(response.total);
      calculateTotalStoryPoints(response.issues);
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSettingsOpen = async () => {
    setSettingsVisible(true);
    setSettingsLoading(true);
    try {
      await fetchAllBoards();
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleBoardChange = async (value: number) => {
    setSelectedBoard(value);
    setSelectedSprint(null);
    setIssues([]);
    setSettingsLoading(true);
    try {
      await fetchSprints(value);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSprintChange = (value: number) => {
    setSelectedSprint(value);
  };

  const handleBoardSearch = (value: string) => {
    setBoardSearchText(value);
  };

  const handleSprintSearch = (value: string) => {
    setSprintSearchText(value);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleSearch = async (values: any) => {
    if (!selectedSprint) return;
    
    setSearchParams(values);
    setCurrentPage(1);
    setLoading(true);
    try {
      let jql = `Sprint = ${selectedSprint}`;
      const conditions: string[] = [];

      if (values.issueKey) {
        conditions.push(`issue = ${values.issueKey}`);
      }

      if (values.summary) {
        // 转义特殊字符，使用双反斜杠
        const escapedSummary = values.summary
          .replace(/\[/g, '\\\\[')
          .replace(/\]/g, '\\\\]')
          .replace(/\(/g, '\\\\(')
          .replace(/\)/g, '\\\\)')
          .replace(/\{/g, '\\\\{')
          .replace(/\}/g, '\\\\}')
          .replace(/\?/g, '\\\\?')
          .replace(/\*/g, '\\\\*')
          .replace(/\+/g, '\\\\+')
          .replace(/\|/g, '\\\\|')
          .replace(/\^/g, '\\\\^')
          .replace(/\$/g, '\\\\$')
          .replace(/\./g, '\\\\.');
        conditions.push(`summary ~ "${escapedSummary}"`);
      }

      if (values.status && values.status.length > 0) {
        conditions.push(`status in (${values.status.map((s: string) => `"${s}"`).join(',')})`);
      }

      if (values.showOnlyMe) {
        conditions.push(`Developer = ${username}`);
      }

      if (values.coding) {
        switch (values.coding) {
          case 'empty':
            conditions.push('Coding is EMPTY');
            break;
          case 'not_empty':
            conditions.push('Coding is not EMPTY');
            break;
          case 'yes':
            conditions.push('Coding = "Yes"');
            break;
          case 'no':
            conditions.push('Coding = "No"');
            break;
        }
      }

      if (conditions.length > 0) {
        jql += ` AND ${conditions.join(' AND ')}`;
      }

      const response = await jiraApi.getSprintIssues(selectedSprint, 0, pageSize, jql);
      setIssues(response.issues);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching issues:', error);
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    searchForm.resetFields();
    if (selectedSprint) {
      setLoading(true);
      try {
        const response = await jiraApi.getSprintIssues(selectedSprint, 0, pageSize);
        setOriginalIssues(response.issues);
        setIssues(response.issues);
        setTotal(response.total);
        calculateTotalStoryPoints(response.issues);
        setSearchParams({
          issueKey: '',
          summary: '',
          status: undefined,
          showOnlyMe: false,
          coding: undefined
        });
        setCurrentPage(1);
      } catch (error) {
        message.error('获取任务列表失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const getFilteredIssues = () => {
    if (!issues || issues.length === 0) return [];
    return issues;
  };

  const filteredBoards = boards.filter(board => 
    board.name.toLowerCase().includes(boardSearchText.toLowerCase()) ||
    (board.projectName && board.projectName.toLowerCase().includes(boardSearchText.toLowerCase()))
  );

  const filteredSprints = sprints.filter(sprint =>
    sprint.name.toLowerCase().includes(sprintSearchText.toLowerCase()) ||
    sprint.state.toLowerCase().includes(sprintSearchText.toLowerCase())
  );

  const fetchStats = async () => {
    try {
      if (!issues || issues.length === 0) return;
      
      const completedIssues = issues.filter(issue => 
        issue.fields.status.name === 'Released' || 
        issue.fields.status.name === 'PO Review Pass'
      );
      
      const incompleteIssues = issues.filter(issue => 
        issue.fields.status.name !== 'Released' && 
        issue.fields.status.name !== 'PO Review Pass'
      );
      
      const completedStoryPoints = completedIssues.reduce((sum, issue) => 
        sum + (issue.fields.customfield_10002 || 0), 0
      );
      
      const completedDevHours = completedIssues.reduce((sum, issue) => 
        sum + (issue.fields.customfield_11602 || 0), 0
      );
      
      setStats({
        completedStoryPoints,
        completedDevHours,
        completedIssues,
        incompleteIssues
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (selectedSprint) {
      fetchStats();
    }
  }, [selectedSprint]);

  const handleEdit = (record: Issue) => {
    setEditingKey(record.id);
    setEditingSummary(record.fields.summary);
    setEditingAssignee(record.fields.assignee?.name || '');
  };

  const handleSave = async (record: Issue) => {
    try {
      await jiraApi.updateIssue(record.key, {
        fields: {
          summary: editingSummary,
          assignee: editingAssignee ? { name: editingAssignee } : null
        }
      });
      message.success('保存成功');
      setEditingKey('');
      // 刷新数据
      if (selectedSprint) {
        fetchSprintIssues(selectedSprint, currentPage, pageSize);
      }
    } catch (error) {
      console.error('Error saving issue:', error);
      message.error('保存失败');
    }
  };

  const handleCancel = () => {
    setEditingKey('');
  };

  const handleAssigneeSelect = (user: JiraUser) => {
    if (currentEditingRecord) {
      setEditingAssignee(user.name);
      // 根据是否是开发者字段选择不同的更新字段
      const updateField = isEditingDeveloper ? 'customfield_11103' : 'assignee';
      // 直接调用 API 更新任务所有者或开发者
      jiraApi.updateIssue(currentEditingRecord.key, {
        fields: {
          [updateField]: isEditingDeveloper ? [{ name: user.name }] : { name: user.name }
        }
      }).then(() => {
        message.success('保存成功');
        setEditingKey('');
        setAssigneeModalVisible(false);
        setIsEditingDeveloper(false);
        // 刷新数据
        if (selectedSprint) {
          fetchSprintIssues(selectedSprint, currentPage, pageSize);
        }
      }).catch((error) => {
        console.error('Error saving issue:', error);
        message.error('保存失败');
      });
    }
  };

  const handleSummarySave = () => {
    if (currentEditingRecord) {
      jiraApi.updateIssue(currentEditingRecord.key, {
        fields: {
          summary: editingSummary
        }
      }).then(() => {
        message.success('保存成功');
        setSummaryModalVisible(false);
        // 刷新数据
        if (selectedSprint) {
          fetchSprintIssues(selectedSprint, currentPage, pageSize);
        }
      }).catch((error) => {
        console.error('Error saving issue:', error);
        message.error('保存失败');
      });
    }
  };

  const handleTransitionSelect = (transition: Transition) => {
    if (currentEditingRecord) {
      jiraApi.transitionIssue(currentEditingRecord.key, transition.id)
        .then(() => {
          message.success('状态更新成功');
          setTransitionModalVisible(false);
          // 刷新数据
          if (selectedSprint) {
            fetchSprintIssues(selectedSprint, currentPage, pageSize);
          }
        })
        .catch((error) => {
          console.error('Error transitioning issue:', error);
          message.error('状态更新失败');
        });
    }
  };

  const handleStoryPointsSave = () => {
    if (currentEditingRecord) {
      const points = editingStoryPoints ? parseFloat(editingStoryPoints) : null;
      jiraApi.updateIssue(currentEditingRecord.key, {
        fields: {
          customfield_10002: points
        }
      }).then(() => {
        message.success('保存成功');
        setStoryPointsModalVisible(false);
        // 刷新数据
        if (selectedSprint) {
          fetchSprintIssues(selectedSprint, currentPage, pageSize);
        }
      }).catch((error) => {
        console.error('Error saving story points:', error);
        message.error('保存失败');
      });
    }
  };

  const handleDevHoursSave = () => {
    if (currentEditingRecord) {
      const hours = editingDevHours ? parseFloat(editingDevHours) : null;
      jiraApi.updateIssue(currentEditingRecord.key, {
        fields: {
          customfield_11602: hours
        }
      }).then(() => {
        message.success('保存成功');
        setDevHoursModalVisible(false);
        // 刷新数据
        if (selectedSprint) {
          fetchSprintIssues(selectedSprint, currentPage, pageSize);
        }
      }).catch((error) => {
        console.error('Error saving dev hours:', error);
        message.error('保存失败');
      });
    }
  };

  const handleCodingSave = () => {
    if (currentEditingRecord) {
      jiraApi.updateIssue(currentEditingRecord.key, {
        fields: {
          customfield_12617: editingCoding ? { value: editingCoding } : null
        }
      }).then(() => {
        message.success('保存成功');
        setCodingModalVisible(false);
        // 刷新数据
        if (selectedSprint) {
          fetchSprintIssues(selectedSprint, currentPage, pageSize);
        }
      }).catch((error) => {
        console.error('Error saving coding:', error);
        message.error('保存失败');
      });
    }
  };

  // 修改搜索用户的函数
  const handleAssigneeSearch = async (value: string) => {
    if (!currentEditingRecord) return;
    
    setAssigneeSearchLoading(true);
    try {
      const users = await jiraApi.getAssignableUsers(currentEditingRecord.key, value);
      setAssignableUsers(users);
    } catch (error) {
      console.error('Error searching users:', error);
      message.error('搜索用户失败');
    } finally {
      setAssigneeSearchLoading(false);
    }
  };

  // 修改搜索输入框的处理
  const handleAssigneeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAssigneeSearchText(value);
    debouncedSearch(value);
  };

  // 修改打开模态框的处理
  const handleAssigneeModalOpen = async (record: Issue, isDeveloper: boolean) => {
    setCurrentEditingRecord(record);
    setEditingAssignee(isDeveloper ? record.fields.customfield_11103?.[0]?.name || '' : record.fields.assignee?.name || '');
    setIsEditingDeveloper(isDeveloper);
    setAssigneeModalVisible(true);
    // 加载默认列表
    await handleAssigneeSearch('');
  };

  // 修改关闭模态框的处理
  const handleAssigneeModalClose = () => {
    setAssigneeModalVisible(false);
    setIsEditingDeveloper(false);
    setAssigneeSearchText('');
    setAssignableUsers([]);
    setCurrentEditingRecord(null);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
      }}>
        <Space>
          <Button 
            type="text" 
            icon={<SettingOutlined />}
            onClick={handleSettingsOpen}
          >
            设置
          </Button>
          <Button 
            type="text" 
            icon={<BarChartOutlined />}
            onClick={() => setStatsDrawerVisible(true)}
          >
            统计信息
          </Button>
        </Space>
        <Space>
          <Space>
            <Avatar
              size="small"
              src={avatarUrls?.['48x48'] || ''}
            />
            <Typography.Text>欢迎，{displayName || username}</Typography.Text>
          </Space>
          <Button type="link" onClick={handleLogout}>
            退出登录
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginTop: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {selectedSprint && (
                <div style={{ marginTop: 24 }}>
                  <Form
                    form={searchForm}
                    layout="inline"
                    onFinish={handleSearch}
                    style={{ marginBottom: 16 }}
                  >
                    <Form.Item name="issueKey" label="任务编码">
                      <Input placeholder="输入任务编码" allowClear />
                    </Form.Item>
                    <Form.Item name="summary" label="任务主题">
                      <Input placeholder="输入任务主题" allowClear />
                    </Form.Item>
                    <Form.Item name="status" label="状态">
                      <Select
                        placeholder="选择状态"
                        allowClear
                        mode="multiple"
                        style={{ width: 200 }}
                      >
                        {STATUS_LIST.map(status => (
                          <Select.Option key={status} value={status}>
                            {status}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item name="coding" label="Coding">
                      <Select
                        placeholder="选择 Coding 状态"
                        allowClear
                        style={{ width: 150 }}
                      >
                        <Select.Option value="empty">未设置</Select.Option>
                        <Select.Option value="not_empty">已设置</Select.Option>
                        <Select.Option value="yes">是</Select.Option>
                        <Select.Option value="no">否</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="showOnlyMe" label="只看我" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                          查询
                        </Button>
                        <Button onClick={handleReset}>
                          重置
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>

                  <Table
                    columns={columns}
                    dataSource={issues}
                    rowKey="id"
                    scroll={{ x: 'max-content' }}
                    loading={loading}
                    pagination={{
                      current: currentPage,
                      pageSize: pageSize,
                      total: total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => `共 ${total} 条`
                    }}
                    onChange={handleTableChange}
                  />
                </div>
              )}
            </Space>
          </div>
        </div>
      </Content>
      <SettingsDrawer
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        boards={boards}
        sprints={sprints}
        selectedBoard={selectedBoard}
        selectedSprint={selectedSprint}
        onBoardChange={handleBoardChange}
        onSprintChange={handleSprintChange}
        loading={settingsLoading}
      />
      <IssueDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        issue={selectedIssue}
      />
      <Drawer
        title="统计信息"
        placement="right"
        onClose={() => setStatsDrawerVisible(false)}
        open={statsDrawerVisible}
        width={600}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            marginBottom: 16, 
            display: 'flex', 
            gap: 24,
            padding: '16px',
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <div>
              <Typography.Text strong>当前迭代已完成 Story Points: </Typography.Text>
              <Typography.Text type="success" strong>{stats.completedStoryPoints}</Typography.Text>
            </div>
            <div>
              <Typography.Text strong>当前迭代已完成 Dev Hours: </Typography.Text>
              <Typography.Text type="success" strong>{stats.completedDevHours}</Typography.Text>
            </div>
            <div>
              <Typography.Text strong>开发效率: </Typography.Text>
              <Typography.Text type="success" strong>
                {stats.completedDevHours > 0 ? `${(stats.completedStoryPoints / stats.completedDevHours * 100).toFixed(2)}%` : '-'}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ marginLeft: 8 }}>(建议值: 120%)</Typography.Text>
            </div>
            <div>
              <Typography.Text strong>是否合格: </Typography.Text>
              {stats.completedStoryPoints >= 48 && (stats.completedDevHours > 0 ? (stats.completedStoryPoints / stats.completedDevHours * 100) >= 120 : false) ? (
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                  <Typography.Text type="success" strong>合格</Typography.Text>
                </Space>
              ) : (
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                  <Typography.Text type="danger" strong>不合格</Typography.Text>
                </Space>
              )}
            </div>
          </div>

          <Typography.Title level={5}>已完成任务列表</Typography.Title>
          <Table
            size="small"
            columns={[
              {
                title: '任务编码',
                dataIndex: 'key',
                key: 'key',
                width: 120,
                render: (text: string, record: Issue) => (
                  <Button 
                    type="link" 
                    onClick={() => {
                      setSelectedIssue(record);
                      setDetailDrawerVisible(true);
                    }}
                  >
                    {text}
                  </Button>
                ),
              },
              {
                title: 'Story Points',
                dataIndex: ['fields', 'customfield_10002'],
                key: 'storyPoints',
                width: 100,
                render: (points: number | null) => points || '-',
              },
              {
                title: 'Dev Hours',
                dataIndex: ['fields', 'customfield_11602'],
                key: 'devHours',
                width: 100,
                render: (hours: number | null) => hours || '-',
              },
              {
                title: 'Coding',
                dataIndex: ['fields', 'customfield_12617'],
                key: 'coding',
                width: 100,
                render: (coding: { value: string } | null) => coding?.value || '-',
              },
            ]}
            dataSource={stats.completedIssues || []}
            rowKey="id"
            pagination={false}
            scroll={{ y: 200 }}
          />

          <Divider />

          <Typography.Title level={5}>无法进入统计的任务</Typography.Title>
          <Table
            size="small"
            columns={[
              {
                title: '任务编码',
                dataIndex: 'key',
                key: 'key',
                width: 120,
                render: (text: string, record: Issue) => (
                  <Button 
                    type="link" 
                    onClick={() => {
                      setSelectedIssue(record);
                      setDetailDrawerVisible(true);
                    }}
                  >
                    {text}
                  </Button>
                ),
              },
              {
                title: '任务主题',
                dataIndex: ['fields', 'summary'],
                key: 'summary',
                width: 200,
                ellipsis: true,
              },
              {
                title: '状态',
                dataIndex: ['fields', 'status', 'name'],
                key: 'status',
                width: 120,
                render: (status: string) => (
                  <Tag color={STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'default'}>
                    {status}
                  </Tag>
                ),
              },
              {
                title: 'Story Points',
                dataIndex: ['fields', 'customfield_10002'],
                key: 'storyPoints',
                width: 100,
                render: (points: number | null) => points || '-',
              },
              {
                title: 'Dev Hours',
                dataIndex: ['fields', 'customfield_11602'],
                key: 'devHours',
                width: 100,
                render: (hours: number | null) => hours || '-',
              },
              {
                title: '无法统计原因',
                key: 'reason',
                width: 200,
                render: (_, record: Issue) => {
                  const coding = record.fields.customfield_12617;
                  const status = record.fields.status.name;
                  const reasons = [];

                  if (!coding) {
                    reasons.push('未填写 Coding');
                  }
                  if (!['Ready to Test', 'Testing', 'Ready for PO Review', 'PO Review Pass', 'PO Review Failed', 'Released'].includes(status)) {
                    reasons.push(`状态为 ${status}`);
                  }

                  return reasons.join('，');
                },
              },
            ]}
            dataSource={stats.incompleteIssues || []}
            rowKey="id"
            pagination={false}
            scroll={{ y: 200 }}
          />
        </div>
      </Drawer>
      <Modal
        title="选择新状态"
        open={transitionModalVisible}
        onCancel={() => setTransitionModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {transitions.map(transition => (
            <div
              key={transition.id}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '1px solid #f0f0f0'
              }}
              onClick={() => handleTransitionSelect(transition)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Tag color={transition.to.statusCategory.colorName}>
                {transition.to.name}
              </Tag>
              <span>{transition.name}</span>
            </div>
          ))}
        </div>
      </Modal>
      <Modal
        title="编辑任务主题"
        open={summaryModalVisible}
        onCancel={() => {
          setSummaryModalVisible(false);
          handleCancel();
        }}
        onOk={handleSummarySave}
        width={600}
      >
        <Input.TextArea
          value={editingSummary}
          onChange={(e) => setEditingSummary(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 5 }}
          placeholder="请输入任务主题"
          autoFocus
        />
      </Modal>
      <Modal
        title="编辑 Story Points"
        open={storyPointsModalVisible}
        onCancel={() => setStoryPointsModalVisible(false)}
        onOk={handleStoryPointsSave}
        width={400}
      >
        <Input
          value={editingStoryPoints}
          onChange={(e) => setEditingStoryPoints(e.target.value)}
          placeholder="请输入 Story Points"
          type="number"
          step="0.5"
          min="0"
          autoFocus
        />
      </Modal>
      <Modal
        title="编辑 Dev Hours"
        open={devHoursModalVisible}
        onCancel={() => setDevHoursModalVisible(false)}
        onOk={handleDevHoursSave}
        width={400}
      >
        <Input
          value={editingDevHours}
          onChange={(e) => setEditingDevHours(e.target.value)}
          placeholder="请输入 Dev Hours"
          type="number"
          step="0.5"
          min="0"
          autoFocus
        />
      </Modal>
      <Modal
        title="编辑 Coding"
        open={codingModalVisible}
        onCancel={() => setCodingModalVisible(false)}
        onOk={handleCodingSave}
        width={400}
      >
        <Select
          value={editingCoding}
          onChange={setEditingCoding}
          style={{ width: '100%' }}
          placeholder="请选择 Coding 状态"
          allowClear
          autoFocus
        >
          <Select.Option value="Yes">Yes</Select.Option>
          <Select.Option value="No">No</Select.Option>
        </Select>
      </Modal>

      <Modal
        title={isEditingDeveloper ? "选择开发者" : "选择任务所有者"}
        open={assigneeModalVisible}
        onCancel={handleAssigneeModalClose}
        footer={null}
        width={600}
      >
        <Input.Search
          placeholder="搜索用户"
          allowClear
          value={assigneeSearchText}
          onChange={handleAssigneeSearchChange}
          loading={assigneeSearchLoading}
          onSearch={(value) => handleAssigneeSearch(value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {assignableUsers.length > 0 ? (
            assignableUsers.map(user => (
              <div
                key={user.name}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={() => handleAssigneeSelect(user)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Avatar
                  size="small"
                  src={user.avatarUrls['48x48']}
                />
                <span>{user.displayName}</span>
                <span style={{ color: '#999' }}>({user.name})</span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
              {assigneeSearchLoading ? '加载中...' : '暂无数据'}
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default Home; 