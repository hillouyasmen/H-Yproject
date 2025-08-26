const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
      onProxyReq: (proxyReq) => {
        // Add any necessary headers
        proxyReq.setHeader('Connection', 'keep-alive');
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ message: 'Proxy error occurred' });
      },
    })
  );
};
