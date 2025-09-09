// routes/receipts.js
import { Router } from "express";
import { pool } from "../db.js";
import { sendMail } from "../utils/mailer.js";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const r = Router();

// Generate receipt HTML template
function generateReceiptHTML(order, items, products) {
  const orderDate = new Date(order.order_date).toLocaleDateString('he-IL');
  const currentDate = new Date().toLocaleDateString('he-IL');
  
  const itemsHTML = items.map(item => {
    const product = products.find(p => p.product_id === item.product_id);
    const itemTotal = (item.quantity * item.price).toFixed(2);
    
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${product?.product_name || 'מוצר לא ידוע'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.color}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.size}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₪${item.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₪${itemTotal}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>קבלה - הזמנה #${order.order_id}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
          direction: rtl;
        }
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 32px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        .receipt-title {
          font-size: 24px;
          color: #333;
          margin-bottom: 20px;
        }
        .order-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        .info-section {
          flex: 1;
        }
        .info-label {
          font-weight: bold;
          color: #666;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 18px;
          color: #333;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th {
          background-color: #007bff;
          color: white;
          padding: 15px 10px;
          text-align: center;
          font-weight: bold;
        }
        .items-table th:first-child,
        .items-table th:last-child {
          text-align: right;
        }
        .total-section {
          text-align: left;
          border-top: 2px solid #007bff;
          padding-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 18px;
        }
        .total-final {
          font-weight: bold;
          font-size: 24px;
          color: #007bff;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-pending { background-color: #ffc107; color: #856404; }
        .status-paid { background-color: #28a745; color: white; }
        .status-shipped { background-color: #007bff; color: white; }
        .status-cancelled { background-color: #dc3545; color: white; }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="company-name">HYMODA</div>
          <div class="receipt-title">קבלת רכישה</div>
        </div>
        
        <div class="order-info">
          <div class="info-section">
            <div class="info-label">מספר הזמנה:</div>
            <div class="info-value">#${order.order_id}</div>
          </div>
          <div class="info-section">
            <div class="info-label">תאריך הזמנה:</div>
            <div class="info-value">${orderDate}</div>
          </div>
          <div class="info-section">
            <div class="info-label">לקוח:</div>
            <div class="info-value">${order.username}</div>
          </div>
          <div class="info-section">
            <div class="info-label">סטטוס:</div>
            <div class="info-value">
              <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>מוצר</th>
              <th>צבע</th>
              <th>מידה</th>
              <th>כמות</th>
              <th>מחיר יחידה</th>
              <th>סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>סה"כ לתשלום:</span>
            <span>₪${Number(order.total_amount).toFixed(2)}</span>
          </div>
          <div class="total-row total-final">
            <span>סה"כ כולל מע"מ:</span>
            <span>₪${Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>תודה שבחרת ב-HYMODA!</p>
          <p>קבלה זו הופקה בתאריך: ${currentDate}</p>
          <p>לשאלות ופניות: support@hymoda.com | 03-1234567</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate PDF receipt
r.get("/:orderId/pdf", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Get order details
    const [[order]] = await pool.query(
      `SELECT o.*, u.username, u.email
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get order items with prices
    const [items] = await pool.query(
      `SELECT oi.*, pv.price
       FROM order_items oi
       JOIN product_variations pv ON pv.product_id = oi.product_id 
         AND pv.color = oi.color AND pv.size = oi.size
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Get product details
    const [products] = await pool.query(
      `SELECT DISTINCT p.*
       FROM products p
       JOIN order_items oi ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Generate HTML
    const html = generateReceiptHTML(order, items, products);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${orderId}.pdf"`);
    res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// Send receipt via email
r.post("/:orderId/email", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { email: customEmail } = req.body;
    
    // Get order details
    const [[order]] = await pool.query(
      `SELECT o.*, u.username, u.email
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get order items with prices
    const [items] = await pool.query(
      `SELECT oi.*, pv.price
       FROM order_items oi
       JOIN product_variations pv ON pv.product_id = oi.product_id 
         AND pv.color = oi.color AND pv.size = oi.size
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Get product details
    const [products] = await pool.query(
      `SELECT DISTINCT p.*
       FROM products p
       JOIN order_items oi ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Generate HTML
    const html = generateReceiptHTML(order, items, products);

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Send email with PDF attachment
    const recipientEmail = customEmail || order.email;
    
    await sendMail({
      to: recipientEmail,
      subject: `קבלת רכישה - הזמנה #${orderId} | HYMODA`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>שלום ${order.username},</h2>
          <p>מצורפת קבלת הרכישה עבור הזמנה מספר #${orderId}.</p>
          <p><strong>פרטי ההזמנה:</strong></p>
          <ul>
            <li>מספר הזמנה: #${orderId}</li>
            <li>תאריך: ${new Date(order.order_date).toLocaleDateString('he-IL')}</li>
            <li>סכום כולל: ₪${Number(order.total_amount).toFixed(2)}</li>
            <li>סטטוס: ${order.status}</li>
          </ul>
          <p>תודה שבחרת ב-HYMODA!</p>
          <p>צוות HYMODA</p>
        </div>
      `,
      attachments: [{
        filename: `receipt-${orderId}.pdf`,
        content: pdf,
        contentType: 'application/pdf'
      }]
    });

    res.json({ 
      success: true, 
      message: `Receipt sent to ${recipientEmail}` 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Get receipt preview (HTML)
r.get("/:orderId/preview", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Get order details
    const [[order]] = await pool.query(
      `SELECT o.*, u.username, u.email
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get order items with prices
    const [items] = await pool.query(
      `SELECT oi.*, pv.price
       FROM order_items oi
       JOIN product_variations pv ON pv.product_id = oi.product_id 
         AND pv.color = oi.color AND pv.size = oi.size
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Get product details
    const [products] = await pool.query(
      `SELECT DISTINCT p.*
       FROM products p
       JOIN order_items oi ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Generate and return HTML
    const html = generateReceiptHTML(order, items, products);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({ error: "Failed to generate preview" });
  }
});

export default r;
