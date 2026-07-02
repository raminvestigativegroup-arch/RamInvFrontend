import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { API_BASE_URL } from "@/config/api";

const resolveImageUrl = (pathOrData: string | undefined | null) => {
  if (!pathOrData) return undefined;
  if (pathOrData.startsWith("data:") || pathOrData.startsWith("http:") || pathOrData.startsWith("https:")) {
    return pathOrData;
  }
  const cleanPath = pathOrData.replace(/\\/g, "/");
  const host = API_BASE_URL.replace("/api/v1", "");
  if (cleanPath.startsWith("uploads/")) {
    return `${host}/${cleanPath}`;
  }
  return `${host}/uploads/${encodeURIComponent(cleanPath)}`;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

interface UserAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ src, name, className, size = "sm" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-[11px]",
    lg: "h-10 w-10 text-xs"
  };

  return (
    <Avatar className={`${sizeClasses[size]} border border-border/80 shrink-0 ${className || ""}`}>
      <AvatarImage src={resolveImageUrl(src)} alt={name} className="object-cover" />
      <AvatarFallback className="bg-secondary text-muted-foreground font-bold flex items-center justify-center h-full w-full">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
