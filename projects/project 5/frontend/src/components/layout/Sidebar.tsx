import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useUserMode } from "../../context/UserModeContext";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Wallet,
  ArrowDownLeft,
  Laptop,
  Settings,
  Users,
  Instagram,
  Youtube,
  PlaySquare,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  isLabel?: boolean;
  badge?: number;
  children?: Omit<MenuItem, "children">[];
  requiredMode?: "taskGiver" | "taskDoer";
}

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className = "",
  isMobile = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { userMode } = useUserMode();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Get collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
    },

    {
      id: "new-order",
      label: t("newOrder"),
      icon: ShoppingCart,
      href: "/new-order",
      requiredMode: "taskGiver",
    },
    {
      id: "my-orders",
      label: t("myOrders"),
      icon: ClipboardList,
      href: "/my-orders",
      badge: 3,
      requiredMode: "taskGiver",
    },
    {
      id: "add-balance",
      label: t("addBalance"),
      icon: Wallet,
      href: "/add-balance",
      requiredMode: "taskGiver",
    },
    {
      id: "withdraw-balance",
      label: t("withdrawBalance"),
      icon: ArrowDownLeft,
      href: "/withdraw-balance",
    },
    {
      id: "social-accounts",
      label: t("socialMediaAccounts"),
      icon: Users,
      children: [
        {
          id: "instagram-accounts",
          label: t("instagramAccounts"),
          icon: Instagram,
          href: "/my-accounts/instagram",
        },
        {
          id: "youtube-accounts",
          label: t("youtubeChannels"),
          icon: Youtube,
          href: "/my-accounts/youtube",
        },
      ],
    },
    {
      id: "tasks",
      label: t("tasks"),
      icon: PlaySquare,
      href: "/tasks",
    },
    {
      id: "devices",
      label: t("deviceSettings"),
      icon: Laptop,
      children: [
        {
          id: "add-devices",
          label: t("addDevices"),
          icon: Laptop,
          href: "/add-devices",
        },
        {
          id: "my-devices",
          label: t("myDevices"),
          icon: Settings,
          href: "/my-devices",
        },
      ],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    // If item has a required mode, check if it matches current mode
    if (item.requiredMode && item.requiredMode !== userMode) {
      return false;
    }

    // If item has children, filter them based on required mode
    if (item.children) {
      const filteredChildren = item.children.filter(
        (child) => !child.requiredMode || child.requiredMode === userMode
      );

      // Only show parent if it has visible children
      return filteredChildren.length > 0;
    }

    return true;
  });

  const renderMenuItem = (item: MenuItem) => {
    const isActive = location.pathname === item.href;
    const isExpanded = expandedGroup === item.id;
    const hasChildren = item.children && item.children.length > 0;

    // Filter children based on user mode
    const visibleChildren = item.children?.filter(
      (child) => !child.requiredMode || child.requiredMode === userMode
    );

    if (hasChildren && (!visibleChildren || visibleChildren.length === 0)) {
      return null;
    }

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              setExpandedGroup(isExpanded ? null : item.id);
            } else if (item.href) {
              navigate(item.href);
              if (isMobile && onClose) {
                onClose();
              }
            }
          }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 transition-all rounded-lg group ${
            isActive ? "bg-blue-50 text-blue-600" : ""
          }`}>
          <div
            className={`flex-shrink-0 ${
              isActive
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-gray-600"
            }`}>
            {<item.icon className='w-5 h-5' />}
          </div>

          {!isCollapsed && (
            <>
              <span className='flex-1 text-sm font-medium whitespace-nowrap'>
                {item.label}
              </span>
              {hasChildren && visibleChildren && visibleChildren.length > 0 && (
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              )}
              {item.badge && (
                <span className='px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full'>
                  {item.badge}
                </span>
              )}
            </>
          )}
        </button>

        {/* Submenu */}
        {!isCollapsed && hasChildren && isExpanded && visibleChildren && (
          <div className='ml-4 mt-1 space-y-1 border-l-2 border-gray-100'>
            {visibleChildren.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  if (child.href) {
                    navigate(child.href);
                    if (isMobile && onClose) {
                      onClose();
                    }
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 transition-all rounded-lg ${
                  location.pathname === child.href
                    ? "bg-blue-50 text-blue-600"
                    : ""
                }`}>
                <child.icon className='w-4 h-4' />
                <span className='text-sm font-medium'>{child.label}</span>
                {child.badge && (
                  <span className='ml-auto px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full'>
                    {child.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const sidebarClasses = isMobile
    ? "fixed inset-0 bg-white z-50"
    : `fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
        isCollapsed ? "w-16" : "w-64"
      }`;

  return (
    <aside className={`${sidebarClasses} ${className}`}>
      <div className='flex flex-col h-full'>
        {/* Header */}
        <div className='h-16 flex items-center justify-between px-4 border-b border-gray-200'>
          {isMobile ? (
            <div className='flex items-center justify-between w-full'>
              <span className='text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                {t("Social Developer")}
              </span>
              <button
                onClick={onClose}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'>
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>
          ) : (
            <>
              {!isCollapsed && (
                <span className='text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                  {t("Social Developer")}
                </span>
              )}
              <button
                onClick={toggleCollapse}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                title={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}>
                {isCollapsed ? (
                  <PanelLeftOpen className='w-5 h-5 text-gray-500' />
                ) : (
                  <PanelLeftClose className='w-5 h-5 text-gray-500' />
                )}
              </button>
            </>
          )}
        </div>

        {/* Menu Items */}
        <nav className='flex-1 overflow-y-auto py-4 px-2 space-y-1'>
          {filteredMenuItems.map(renderMenuItem)}
        </nav>
      </div>
    </aside>
  );
};
