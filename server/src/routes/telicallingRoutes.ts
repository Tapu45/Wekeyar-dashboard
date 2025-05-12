import express from "express";
import {
  getTelecallingCustomers,
  getProducts,
  saveTelecallingOrder,
  getTelecallersWithOrderCount,
  getAllTelecallingOrders,
  getNewProducts,
  updateCustomerRemarks,
  getTelecallerRemarksOrders,
  addNewTelecallingCustomer, // Import the new controller function
} from "../controllers/tellicallingController";
import { authenticateUser } from "../authMiddleware";

const router = express.Router();

// Route to fetch all telecalling customers
router.get("/customers", getTelecallingCustomers);

// Route to fetch all products
router.get("/products", getProducts);

// Route to save a telecalling order
router.post("/orders", authenticateUser, saveTelecallingOrder);

// Route to get all telecallers with the number of orders they placed
router.get("/telecallers-with-orders", getTelecallersWithOrderCount);

// Route to get all telecalling orders with order details and telecaller information
router.get("/telecalling-orders", getAllTelecallingOrders);

// Route to get all new products
router.get("/new-products", getNewProducts);

// Route to update customer remarks
router.patch("/customers/:id/remarks", authenticateUser, updateCustomerRemarks);

router.get(
  "/telecaller/remarks-orders",
  authenticateUser, // Middleware to authenticate the telecaller
  getTelecallerRemarksOrders
);

router.post("/customers/new", addNewTelecallingCustomer);

export default router;