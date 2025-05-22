const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const { Product, Category } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only (jpeg, jpg, png, webp)!');
    }
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let where = {};
    let order = [];

    // Add category filter
    if (category) {
      where.category_id = category;
    }

    // Add search filter
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    // Add sorting
    if (sort) {
      const [field, direction] = sort.split(':');
      order.push([field, direction.toUpperCase()]);
    }

    const products = await Product.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{ model: Category }]
    });

    res.json({
      products: products.rows,
      totalPages: Math.ceil(products.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category }]
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Admin: Create product
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;
    
    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category_id,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Admin: Update product
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;
    
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.update({
      name,
      description,
      price,
      stock,
      category_id,
      ...(req.file && { image: `/uploads/${req.file.filename}` })
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Admin: Delete product
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router;
