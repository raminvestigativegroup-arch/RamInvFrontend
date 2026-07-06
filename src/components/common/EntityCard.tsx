import React from "react";
import { MoreVertical, LucideIcon, User, ShieldCheck, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface DetailItem {
  icon?: LucideIcon;
  content: React.ReactNode;
}

interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

interface EntityCardProps {
  title: string;
  subtitle?: string;
  avatar?: {
    text?: string;
    src?: string;
  };
  badge?: React.ReactNode | {
    label: string;
    className: string;
  };
  details?: DetailItem[];
  footerLeft?: React.ReactNode;
  footerMiddle?: React.ReactNode;
  footerRight?: React.ReactNode;
  footerContent?: React.ReactNode;
  actions?: React.ReactNode;
  menuItems?: MenuItem[];
  className?: string;
  onClick?: () => void;
}


const EntityCard: React.FC<EntityCardProps> = ({
  title,
  subtitle,
  avatar,
  badge,
  details = [],
  footerLeft,
  footerMiddle,
  footerRight,
  footerContent,
  actions,
  menuItems,
  className = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={` bg-card rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-border ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {avatar && (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
              {avatar.src ? (
                <img
                  src={avatar.src}
                  alt={title}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth < img.naturalHeight) {
                      img.classList.add('w-full', 'h-auto');
                    } else {
                      img.classList.add('h-full', 'w-auto');
                    }
                  }}
                />
              ) : (
                <span className="text-sm uppercase tracking-wider">{avatar.text}</span>
              )}
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground line-clamp-1">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {badge && (
            React.isValidElement(badge) ? (
              badge
            ) : (
              // @ts-ignore
              <span className={badge.className}>{badge.label}</span>
            )
          )}
          {actions || (
            menuItems && menuItems.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {menuItems.map((item, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={item.onClick}
                      className={item.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
                    >
                      {item.icon && <item.icon className="w-4 h-4 mr-2" />}
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-4 h-4" />
              </button>
            )
          )}

        </div>
      </div>

      {/* Body */}
      {details.length > 0 && (
        <div className="space-y-2 mb-4">
          {details.map((detail, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              {detail.icon && <detail.icon className="w-3.5 h-3.5 shrink-0" />}
              <span className="line-clamp-1">{detail.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer (Split) */}
      {(footerLeft || footerMiddle || footerRight) && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground truncate flex-1">{footerLeft}</div>
          {footerMiddle && <div className="flex-1 flex justify-center">{footerMiddle}</div>}
          <div className="shrink-0 flex-1 flex justify-end">{footerRight}</div>
        </div>
      )}

      {/* Footer Content (Full Width) */}
      {footerContent && (
        <div className="mt-3 pt-3 border-t border-border">
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default EntityCard;
