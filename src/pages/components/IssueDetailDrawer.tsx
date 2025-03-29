import React from 'react';
import { Drawer, Typography, Descriptions, Tag, Space, Avatar, Divider } from 'antd';
import { Issue } from '../../services/jiraApi';

const { Title, Text } = Typography;

interface IssueDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  issue: Issue | null;
}

const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  visible,
  onClose,
  issue
}) => {
  if (!issue) return null;

  // 解析 Jira 格式文本
  const parseJiraText = (text: string) => {
    if (!text) return null;

    // 处理颜色标记
    text = text.replace(/\{color:#([0-9a-fA-F]{6})\}(.*?)\{color\}/g, (match, color, content) => {
      return `<span style="color: #${color}">${content}</span>`;
    });

    // 处理图片标记
    text = text.replace(/\{color:#([0-9a-fA-F]{6})\}!([^!]+)!\{color\}/g, (match, color, imageName) => {
      return `<img src="/api/rest/api/3/attachment/content/${imageName}" style="max-width: 100%;" />`;
    });

    // 处理加粗文本
    text = text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');

    // 处理斜体文本
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

    // 处理换行
    text = text.replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <Drawer
      title="任务详情"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
    >
      <div style={{ marginBottom: 24 }}>
        <Space>
          <img
            src={issue.fields.issuetype.iconUrl}
            alt={issue.fields.issuetype.name}
            style={{ width: 16, height: 16 }}
          />
          <Title level={4} style={{ margin: 0 }}>{issue.key.split('-').pop()}</Title>
        </Space>
      </div>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="任务编码" style={{ width: '100px' }}>{issue.key.split('-').pop()}</Descriptions.Item>
        <Descriptions.Item label="任务类型">{issue.fields.issuetype.name}</Descriptions.Item>
        <Descriptions.Item label="任务主题">{issue.fields.summary}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={issue.fields.status.color || 'default'}>
            {issue.fields.status.name}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="优先级">
          <Space>
            <img
              src={issue.fields.priority.iconUrl}
              alt={issue.fields.priority.name}
              style={{ width: 16, height: 16 }}
            />
            <Text>{issue.fields.priority.name}</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="任务所有者">
          {issue.fields.assignee ? (
            <Space>
              <Avatar
                size="small"
                src={issue.fields.assignee.avatarUrls?.['48x48']}
              />
              <Text>{issue.fields.assignee.displayName}</Text>
            </Space>
          ) : (
            <Text type="secondary">未分配</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="开发者">
          {issue.fields.customfield_11103?.[0] ? (
            <Space>
              <Avatar
                size="small"
                src={issue.fields.customfield_11103[0].avatarUrls?.['48x48']}
              />
              <Text>{issue.fields.customfield_11103[0].displayName}</Text>
            </Space>
          ) : (
            <Text type="secondary">未分配</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Story Points">
          {issue.fields.customfield_10002 || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Dev Hours">
          {issue.fields.customfield_11602 || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Coding">
          {issue.fields.customfield_12617 ? issue.fields.customfield_12617.value : '-'}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">任务描述</Divider>
      <div style={{ 
        padding: '16px',
        background: '#f5f5f5',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap'
      }}>
        {parseJiraText(issue.fields.description || '') || '暂无描述'}
      </div>
    </Drawer>
  );
};

export default IssueDetailDrawer; 