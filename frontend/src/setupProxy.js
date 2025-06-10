const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      },
      secure: false,
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ message: 'Proxy Error' });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying request to:', req.method, proxyReq.path);
      }
    })
  );
};
