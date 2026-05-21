import { Shield, Save, Upload } from "lucide-react";

const SystemSettings = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">System Settings</h1>
          <p className="text-sm text-muted-foreground">Manage company and account settings</p>
        </div>
      </div>

      {/* Company Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5">Company Information</h2>
        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">SecurePro Security Services</p>
            <p className="text-sm text-muted-foreground mt-1">Professional security workforce management</p>
            <button className="flex items-center gap-2 text-sm text-primary font-medium mt-2 hover:underline">
              <Upload className="w-3.5 h-3.5" />Change Logo
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: "Company Name", value: "SecurePro Security Services" },
            { label: "Email", value: "admin@securepro.com" },
            { label: "Phone", value: "+1 555-0100" },
            { label: "Address", value: "100 Security Blvd, New York, NY 10001" },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
              <input
                defaultValue={field.value}
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5">Account Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Timezone</label>
            <select className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Pacific Time (PT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Date Format</label>
            <select className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Language</label>
            <select className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Save className="w-4 h-4" />Save Changes
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;
