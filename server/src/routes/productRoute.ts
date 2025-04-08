// src/routes/productRoutes.ts
import express from 'express';

import {  importProduct } from '../controllers/productController';

const router = express.Router();



// Route using Cloudinary storage
router.post('/import-excel', importProduct);



export default router;