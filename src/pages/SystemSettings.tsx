import { useState, useEffect } from "react";
import { Shield, Save, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import authService from "@/services/authService";
import settingsService from "@/services/settingsService";
import logo from "@/assets/logo.png";
import FormField from "@/components/common/FormField";
import { Button } from "@/components/ui/button";

import StateMessage from "@/components/common/StateMessage";

const SystemSettings = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const permissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";

  const hasViewPermission = isAdmin || permissions.includes("view_setting") || permissions.includes("setting");
  const hasEditPermission = isAdmin || permissions.includes("edit_setting") || permissions.includes("setting");

  // Company Info states
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Password change states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [settingsErrors, setSettingsErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();

  // Load Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        setCompanyName(data.companyName || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      } catch (error: any) {
        console.error("Failed to load settings:", error);
        toast({
          title: "Error",
          description: "Failed to load company settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const validateSettingsForm = () => {
    const newErrors: Record<string, string> = {};
    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const phoneRegex = /^[+\d\s\-()]+$/;
      if (!phoneRegex.test(phone)) {
        newErrors.phone = "Invalid format";
      }
    }
    if (!address.trim()) {
      newErrors.address = "Address is required";
    }

    setSettingsErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    if (!oldPassword) {
      newErrors.oldPassword = "Current password is required";
    }
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmation is required";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSettingsForm()) return;

    setIsSavingSettings(true);
    setSettingsErrors({});
    try {
      await settingsService.updateSettings({
        companyName,
        email,
        phone,
        address,
      });

      toast({
        title: "Success",
        description: "Company settings updated successfully.",
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to update company settings.";
      setSettingsErrors(prev => ({ ...prev, form: message }));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsSavingPassword(true);
    setPasswordErrors({});
    try {
      await authService.changePassword({
        oldPassword,
        newPassword,
      });

      toast({
        title: "Success",
        description: "Password changed successfully.",
      });

      // Clear fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to change password. Please check your credentials.";
      setPasswordErrors(prev => ({ ...prev, form: message }));
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!hasViewPermission) {
    return (
      <div className="p-6">
        <StateMessage
          type="error"
          title="Access Denied"
          message="You do not have permission to view System Settings."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">System Settings</h1>
          <p className="text-sm text-muted-foreground">Manage company settings and security</p>
        </div>
      </div>

      {/* Company Info */}
      <form onSubmit={handleSettingsSubmit} className="bg-card rounded-xl border border-border p-6" noValidate>
        <h2 className="text-lg font-semibold text-foreground mb-5">Company Information</h2>
        {settingsErrors.form && (
          <div className="p-3 mb-5 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg max-w-xl">
            {settingsErrors.form}
          </div>
        )}

        {isLoadingSettings ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <FormField label="Company Name" required error={settingsErrors.companyName}>
                <input
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (settingsErrors.companyName) setSettingsErrors(prev => ({ ...prev, companyName: undefined }));
                  }}
                  disabled={!hasEditPermission}
                  className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    settingsErrors.companyName ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                  }`}
                  placeholder="Company Name"
                />
              </FormField>
              <FormField label="Email" required>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed opacity-60 focus:outline-none transition-all"
                  placeholder="Email"
                />
              </FormField>
              <FormField label="Phone" required error={settingsErrors.phone}>
                <input
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (settingsErrors.phone) setSettingsErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  disabled={!hasEditPermission}
                  className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    settingsErrors.phone ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                  }`}
                  placeholder="Phone"
                />
              </FormField>
              <FormField label="Address" required error={settingsErrors.address}>
                <input
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (settingsErrors.address) setSettingsErrors(prev => ({ ...prev, address: undefined }));
                  }}
                  disabled={!hasEditPermission}
                  className={`w-full px-4 py-2.5 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    settingsErrors.address ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                  }`}
                  placeholder="Address"
                />
              </FormField>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              {hasEditPermission && (
                <Button
                  type="submit"
                  disabled={isSavingSettings}
                >
                  <Save className="w-4 h-4" />
                  {isSavingSettings ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </>
        )}
      </form>

      {/* Security Info Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-5 max-w-xl" noValidate>
          {passwordErrors.form && (
            <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {passwordErrors.form}
            </div>
          )}
          <FormField label="Current Password" required error={passwordErrors.oldPassword}>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (passwordErrors.oldPassword) setPasswordErrors(prev => ({ ...prev, oldPassword: undefined }));
                }}
                className={`w-full pl-10 pr-10 py-2.5 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  passwordErrors.oldPassword ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="New Password" required error={passwordErrors.newPassword}>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: undefined }));
                }}
                className={`w-full pl-10 pr-10 py-2.5 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  passwordErrors.newPassword ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                }`}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <FormField label="Confirm New Password" required error={passwordErrors.confirmPassword}>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                className={`w-full pl-10 pr-10 py-2.5 bg-secondary border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  passwordErrors.confirmPassword ? "border-destructive focus:ring-destructive/20" : "border-border focus:ring-primary"
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSavingPassword}
            >
              <Save className="w-4 h-4" />
              {isSavingPassword ? "Changing Password..." : "Change Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings;
