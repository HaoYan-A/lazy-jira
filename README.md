# Lazy Jira

一个基于 Electron + React 的 Jira 任务管理工具，帮助开发团队更高效地管理任务和追踪进度。

## 功能特性

- 🔐 用户认证
  - 支持 Jira 账号登录
  - 自动保存登录状态
  - 登录过期自动跳转

- 📋 任务管理
  - 查看和筛选 Sprint 任务
  - 支持按任务编码、主题、状态等多维度搜索
  - 快速编辑任务主题、所有者、开发者等信息
  - 支持任务状态转换
  - 支持编辑 Story Points、Dev Hours 和 Coding 状态

- 📊 数据统计
  - 显示当前 Sprint 的完成情况
  - 统计已完成任务的 Story Points 和 Dev Hours
  - 计算开发效率指标
  - 展示已完成和未完成任务列表

- ⚙️ 个性化设置
  - 支持选择默认看板和 Sprint
  - 记住用户的选择偏好
  - 支持只看自己的任务

## 开发环境要求

- Node.js >= 16
- npm >= 8

## 安装和启动

1. 克隆项目
```bash
git clone [项目地址]
cd lazy-jira
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 打包应用
```bash
npm run make
```

打包后的应用将在 `out` 目录下生成。

## 项目结构

```
lazy-jira/
├── src/
│   ├── components/     # 可复用组件
│   ├── context/       # React Context
│   ├── pages/         # 页面组件
│   ├── services/      # API 服务
│   ├── App.tsx        # 应用入口
│   └── main.ts        # Electron 主进程
├── assets/            # 静态资源
└── package.json       # 项目配置
```

## 技术栈

- Electron
- React
- TypeScript
- Ant Design
- React Router
- Axios

## 开发说明

1. 开发模式
   - 使用 `npm start` 启动开发服务器
   - 支持热重载
   - 开发工具支持

2. 生产模式
   - 使用 `npm run make` 打包应用
   - 自动处理依赖和资源
   - 生成可执行文件

## 注意事项

1. 首次使用需要配置 Jira 服务器地址
2. 确保有正确的 Jira API 访问权限
3. 建议使用最新版本的 Chrome 浏览器

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License 