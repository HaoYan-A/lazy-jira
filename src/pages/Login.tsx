import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useJiraApi } from '../context/JiraApiContext';

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUsername } = useUser();
  const jiraApi = useJiraApi();
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (values: LoginForm) => {
    try {
      setLoading(true);
      const response = await jiraApi.login(values.username, values.password);
      if (response) {
        // 保存用户信息到本地存储，包括密码
        localStorage.setItem('userInfo', JSON.stringify({
          username: values.username,
          password: values.password,
          displayName: response.displayName,
          emailAddress: response.emailAddress,
          avatarUrls: response.avatarUrls
        }));
        setUsername(values.username);
        message.success('登录成功');
        navigate('/');
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#f0f2f5'
    }}>
      <div style={{ 
        width: 400, 
        padding: 24, 
        background: 'white', 
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Lazy Jira</h1>
        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login; 