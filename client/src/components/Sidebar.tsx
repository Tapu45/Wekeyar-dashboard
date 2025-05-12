import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Menu,
  LayoutDashboard,
  User,
  BarChart3,
  ClipboardList,
  Store,
  UploadCloud,
  LogOut,
  Headset,
  FileCheck2,
  CloudUpload,
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
  const [logoHovered, setLogoHovered] = useState(false);

  // Define the links with role-based access
  const links: SidebarLink[] = [
    { title: "Summary Report", path: "/", icon: LayoutDashboard, roles: ["admin", "tellecaller"] },
    {
      title: "Non-Buying Customers",
      path: "/non-buying-customers",
      icon: User,
      roles: ["admin", "tellecaller"],
    },
    {
      title: "Monthly Non-Buying",
      path: "/non-buying-monthly-customers",
      icon: ClipboardList,
      roles: ["admin", "tellecaller"],
    },
    // {
    //   title: "Order History",
    //   path: "/telecaller-remarks-orders",
    //   icon: ClipboardList,
    //   roles: ["tellecaller"],
    // },
    { title: "Customer Report", path: "/customer-report", icon: BarChart3, roles: ["admin", "tellecaller"] },
    { title: "Store Sales Report", path: "/store-sales-report", icon: Store, roles: ["admin", "tellecaller"] },
    { title: "Upload", path: "/upload", icon: UploadCloud, roles: ["admin"] },
    { title: "product upload", path: "/productmaster-upload", icon: CloudUpload, roles: ["admin"] },
    {
      title: "Upload Status",
      path: "/upload-status",
      icon: FileCheck2,
      roles: ["admin"],
    },
    { title: "User Creation", path: "/user", icon: User, roles: ["admin"] },
    // { title: "Tellecalling", path: "/tellecalling", icon: User, roles: ["tellecaller"] },
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

  // Enhanced animation variants
  const sidebarVariants = {
    expanded: { 
      width: "16rem",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 26,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    },
    collapsed: { 
      width: "5rem",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 26,
        when: "afterChildren",
        staggerChildren: 0.05
      }
    },
  };

  const mobileMenuVariants = {
    open: { 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    closed: { 
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        when: "afterChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hover: { 
      scale: 1.03, 
      x: 5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    },
    initial: { 
      scale: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const navItemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      filter: "blur(8px)" 
    },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)",
      transition: { 
        delay: i * 0.05,
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }),
    exit: { 
      opacity: 0, 
      y: -20, 
      filter: "blur(8px)",
      transition: { 
        duration: 0.2
      }
    }
  };

  const logoTextVariants = {
    visible: { 
      opacity: 1, 
      x: 0,
      textShadow: "0 0 8px rgba(255,255,255,0.0)",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hovered: {
      textShadow: "0 0 8px rgba(255,255,255,0.4)",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hidden: { 
      opacity: 0, 
      x: -20,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const titleVariants = {
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hidden: { 
      opacity: 0, 
      x: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  return (
    <>
      {/* Mobile Menu Button with enhanced animation */}
      <motion.button
        type="button"
        className="fixed z-50 p-2 bg-white rounded-lg shadow-lg top-4 left-4 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        whileTap={{ scale: 0.9, rotate: isMobileOpen ? -90 : 0 }}
        whileHover={{ 
          backgroundColor: "#f0f9ff", 
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          y: -2
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Menu size={24} className="text-blue-800" />
      </motion.button>

      {/* Enhanced Mobile Overlay with blur and fade animation */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ 
              opacity: 1, 
              backdropFilter: "blur(4px)",
              transition: {
                opacity: { duration: 0.3 },
                backdropFilter: { duration: 0.4 }
              }
            }}
            exit={{ 
              opacity: 0, 
              backdropFilter: "blur(0px)",
              transition: {
                opacity: { duration: 0.3 },
                backdropFilter: { duration: 0.2 }
              }
            }}
            className="fixed inset-0 bg-black/40 md:hidden z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Enhanced Desktop and Mobile Animations */}
      <motion.aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-blue-800 via-blue-900 to-blue-950 text-white shadow-2xl z-50 ${
          isMobileOpen ? "block" : "hidden md:block"
        }`}
        variants={isMobileOpen ? mobileMenuVariants : sidebarVariants}
        animate={isMobileOpen ? "open" : isExpanded ? "expanded" : "collapsed"}
        initial={isMobileOpen ? "closed" : false}
        style={{ 
          boxShadow: "0 0 25px rgba(30, 64, 175, 0.35)", 
        }}
      >
        {/* Enhanced Logo and Toggle Button */}
        <div className="relative flex items-center justify-between h-16 px-4 border-b border-blue-700/30 overflow-hidden">
          {/* Animated background shine effect */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute -inset-40 opacity-20 bg-gradient-radial from-blue-300 to-transparent" 
              initial={{ x: "-100%", opacity: 0.1 }}
              animate={{ 
                x: "200%", 
                opacity: [0.1, 0.2, 0.1],
                transition: { 
                  repeat: Infinity, 
                  duration: 8, 
                  ease: "linear",
                }
              }}
            />
          </div>
          
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.h2
                key="logo-text"
                variants={logoTextVariants}
                initial="hidden"
                animate={logoHovered ? "hovered" : "visible"}
                exit="hidden"
                onHoverStart={() => setLogoHovered(true)}
                onHoverEnd={() => setLogoHovered(false)}
                className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent select-none"
              >
                WekeyarPlus
              </motion.h2>
            )}
          </AnimatePresence>
          
          <motion.button
            className="relative hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-600 z-10"
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 0 12px rgba(255,255,255,0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 17 
            }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ duration: 0.3, ease: "anticipate" }}
            >
              <ChevronLeft size={18} />
            </motion.div>
          </motion.button>
        </div>

        {/* Enhanced Navigation with staggered animations */}
        <nav className="p-3 space-y-2 mt-3 overflow-y-auto max-h-[calc(100vh-9rem)]">
          <AnimatePresence mode="wait">
            {filteredLinks.map(({ title, path, icon: Icon }, index) => (
              <motion.div
                key={path}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={index}
                layout
              >
                <motion.div
                  variants={itemVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  animate={activeHover === path ? "hover" : "initial"}
                  onHoverStart={() => setActiveHover(path)}
                  onHoverEnd={() => setActiveHover(null)}
                >
                  <Link
                    to={path}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all overflow-hidden ${
                      isActivePath(path)
                        ? "bg-gradient-to-r from-white to-blue-100 text-blue-800 font-semibold shadow-lg"
                        : "hover:bg-blue-700/60"
                    }`}
                  >
                    {/* Subtle hover effect */}
                    {!isActivePath(path) && (
                      <motion.div 
                        className="absolute inset-0 bg-blue-500/0" 
                        initial={{ opacity: 0 }}
                        whileHover={{ 
                          opacity: 1,
                          background: "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.5) 0%, rgba(29, 78, 216, 0) 75%)",
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    
                    {/* Active indicator line */}
                    {isActivePath(path) && (
                      <motion.div 
                        className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-md"
                        layoutId="activeIndicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    
                    <motion.div
                      whileHover={{ rotate: isActivePath(path) ? 0 : 5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      <Icon 
                        size={20} 
                        className={isActivePath(path) ? "text-blue-700" : ""} 
                      />
                    </motion.div>
                    
                    <AnimatePresence mode="wait">
                      {isExpanded && (
                        <motion.span
                          variants={titleVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className={`whitespace-nowrap overflow-hidden text-sm font-medium`}
                        >
                          {title}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Enhanced Logout Button with animation */}
          <motion.div
            variants={navItemVariants}
            initial="hidden"
            animate="visible"
            custom={filteredLinks.length}
            className="mt-4 pt-4 border-t border-blue-700/30"
          >
            <motion.div
              variants={itemVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <button
                className={`relative flex items-center w-full gap-3 px-4 py-3 rounded-lg overflow-hidden ${
                  isExpanded ? "hover:bg-red-600/20" : "hover:bg-red-600/20"
                }`}
                onClick={handleLogout}
              >
                {/* Hover glow effect */}
                <motion.div 
                  className="absolute inset-0 bg-red-500/0" 
                  initial={{ opacity: 0 }}
                  whileHover={{ 
                    opacity: 1,
                    background: "radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0) 70%)",
                  }}
                  transition={{ duration: 0.3 }}
                />
                
                <motion.div
                  whileHover={{ rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <LogOut size={20} className="text-red-400" />
                </motion.div>
                
                <AnimatePresence mode="wait">
                  {isExpanded && (
                    <motion.span
                      variants={titleVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="text-sm font-medium text-red-300"
                    >
                      Logout
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          </motion.div>
        </nav>
        
        {/* Enhanced Footer with subtle animations */}
        <motion.div 
          className="absolute bottom-4 left-0 right-0 text-xs text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    delay: 0.2,
                    duration: 0.4,
                    ease: "easeOut"
                  }
                }}
                exit={{ opacity: 0, y: 5 }}
                className="relative overflow-hidden"
              >
                <motion.p className="text-blue-200/70 relative z-10">
                  Powered by Nexus InfoTech
                </motion.p>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ 
                    x: "100%",
                    transition: {
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 3,
                      ease: "linear"
                    }
                  }}
                />
              </motion.div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-1 text-blue-200/70"
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