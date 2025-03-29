const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 代理配置
const proxyOptions = {
  target: 'https://jira.logisticsteam.com',
  changeOrigin: true,
  secure: false,
  onProxyReq: (proxyReq, req, res) => {
    // 只保留必要的请求头
    proxyReq.setHeader('Accept', '*/*');
  },
  onProxyRes: (proxyRes, req, res) => {
    // 处理响应头
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  }
};

// 设置代理 - 代理所有请求
app.use('/', createProxyMiddleware(proxyOptions));

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
}); 