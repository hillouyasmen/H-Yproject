require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

// تأكد أن مجلد الرفع موجود
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ميدلوير أساسي
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' })); // رفع الحد لمنع errors عند رفع صور كبيرة
app.use(express.urlencoded({ extended: true }));

// الملفات الثابتة
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images'))); // مهم لصور المنتجات
app.use(express.static(path.join(__dirname, 'public')));

// راوتات API الأساسية
app.use('/api/auth', require('./routes/users'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/checkout', require('./routes/checkout'));

// راوت رفع الصور (يجب أن يكون هنا وليس بعد الكاتش-أول)
app.use('/api/upload', require('./routes/upload'));

// Debug routes (اختياري)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', require('./routes/db-check'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// test API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// ملفات React (للنشر)
app.use(express.static(path.join(__dirname, '../client/build')));

// يجب أن يكون آخر شيء (catch-all)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// إغلاق السيرفر في حال حدوث أخطاء غير معالجة
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
