import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  LayoutDashboard,
  User,
  BarChart3,
  ClipboardList,
  Store,
  UploadCloud,
  LogOut,
  Headset,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarLink {
  title: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

const Sidebar = ({
  isExpanded,
  setIsExpanded,
  userRole,
}: {
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  userRole: string;
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeHover, setActiveHover] = useState<string | null>(null);

  // Define the links with role-based access
  const links: SidebarLink[] = [
    { title: "Summary Report", path: "/", icon: LayoutDashboard, roles: ["admin"] },
    {
      title: "Non-Buying Customers",
      path: "/non-buying-customers",
      icon: User,
      roles: ["admin"],
    },
    {
      title: "Monthly Non-Buying",
      path: "/non-buying-monthly-customers",
      icon: ClipboardList,
      roles: ["admin"],
    },
    {
      title: "Order History",
      path: "/telecaller-remarks-orders",
      icon: ClipboardList,
      roles: ["tellecaller"],
    },
    { title: "Customer Report", path: "/customer-report", icon: BarChart3, roles: ["admin"] },
    { title: "Store Sales Report", path: "/store-sales-report", icon: Store, roles: ["admin"] },
    { title: "Upload", path: "/upload", icon: UploadCloud, roles: ["admin"] },
    { title: "User Creation", path: "/user", icon: User, roles: ["admin"] },
    { title: "Tellecalling", path: "/tellecalling", icon: User, roles: ["tellecaller"] },
    { title: "Tellecaller", path: "/telecalling-dashboard", icon: Headset, roles: ["admin"] },
  ];

  // Filter links based on the user's role
  const filteredLinks = links.filter((link) => link.roles.includes(userRole));

  const isActivePath = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Variants for animations
  const sidebarVariants = {
    expanded: { width: "16rem" },
    collapsed: { width: "5rem" },
  };

  const mobileMenuVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: "-100%", opacity: 0 },
  };

  const itemVariants = {
    hover: { scale: 1.03, x: 5 },
    initial: { scale: 1, x: 0 },
  };

  const logoTextVariants = {
    visible: { opacity: 1, x: 0 },
    hidden: { opacity: 0, x: -20 },
  };

  const titleVariants = {
    visible: { opacity: 1, x: 0 },
    hidden: { opacity: 0, x: -10 },
  };

  return (
    <>
      {/* Mobile Menu Button with animation */}
      <motion.button
        type="button"
        className="fixed z-50 p-2 bg-white rounded-lg shadow-lg top-4 left-4 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        whileTap={{ scale: 0.9 }}
        whileHover={{ backgroundColor: "#f0f9ff" }}
      >
        <Menu size={24} className="text-blue-800" />
      </motion.button>

      {/* Mobile Overlay with fade animation */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop (animated width) and Mobile (slide in/out) */}
      <motion.aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-xl z-50 ${
          isMobileOpen ? "block" : "hidden md:block"
        }`}
        variants={sidebarVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
        initial={false}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Logo and Toggle Button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-700/50">
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.h2
                key="logo-text"
                variants={logoTextVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
                transition={{ duration: 0.2 }}
              >
                WekeyarPlus
              </motion.h2>
            )}
          </AnimatePresence>
          
          <motion.button
            className="hidden md:flex items-center justify-center p-1 rounded-full bg-blue-700 hover:bg-blue-600 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isExpanded ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </motion.button>
        </div>

        {/* Navigation with staggered animations */}
        <nav className="p-3 space-y-1.5 mt-2">
          {filteredLinks.map(({ title, path, icon: Icon }, index) => (
            <motion.div
              key={path}
              variants={itemVariants}
              initial="initial"
              whileHover="hover"
              animate={activeHover === path ? "hover" : "initial"}
              onHoverStart={() => setActiveHover(path)}
              onHoverEnd={() => setActiveHover(null)}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              custom={index}
            >
              <Link
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all overflow-hidden ${
                  isActivePath(path)
                    ? "bg-gradient-to-r from-white to-blue-100 text-blue-800 font-semibold shadow-md"
                    : "hover:bg-blue-700/60"
                }`}
              >
                <Icon size={20} className={isActivePath(path) ? "text-blue-700" : ""} />
                <AnimatePresence mode="wait">
                  {isExpanded && (
                    <motion.span
                      variants={titleVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.2, delay: 0.05 }}
                      className={`whitespace-nowrap overflow-hidden text-sm font-medium`}
                    >
                      {title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          ))}

          {/* Logout Button with animation */}
          <motion.div
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="mt-4 pt-4 border-t border-blue-700/30"
          >
            <button
              className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-all ${
                isExpanded ? "bg-red-500/10 hover:bg-red-600/20" : "hover:bg-red-600/20"
              }`}
              onClick={handleLogout}
            >
              <LogOut size={20} className="text-red-400" />
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.span
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium text-red-300"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </nav>
        
        {/* Footer with fade-in animation */}
        <motion.div 
          className="absolute bottom-4 left-0 right-0 text-xs text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-blue-200/70"
              >
                Powered by Nexus InfoTech
              </motion.p>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-1"
              >
                NIT
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.aside>
    </>
  );
};

export default Sidebar;