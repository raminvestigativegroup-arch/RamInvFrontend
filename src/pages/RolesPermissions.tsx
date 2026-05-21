import { Shield, Plus, Edit, Check, X } from "lucide-react";

const roles = [
  {
    id: "R1", name: "Super Admin", desc: "Full access to all modules",
    permissions: { dashboard: true, guards: true, managers: true, sites: true, incidents: true, scheduling: true, compliance: true, hours: true, reports: true, notifications: true, roles: true, settings: true },
  },
  {
    id: "R2", name: "Operations Manager", desc: "Manage guards, schedules, and incidents",
    permissions: { dashboard: true, guards: true, managers: false, sites: true, incidents: true, scheduling: true, compliance: true, hours: true, reports: true, notifications: true, roles: false, settings: false },
  },
  {
    id: "R3", name: "Site Manager", desc: "View and manage assigned site operations",
    permissions: { dashboard: true, guards: true, managers: false, sites: false, incidents: true, scheduling: true, compliance: false, hours: true, reports: false, notifications: true, roles: false, settings: false },
  },
  {
    id: "R4", name: "Viewer", desc: "Read-only access to dashboards and reports",
    permissions: { dashboard: true, guards: false, managers: false, sites: false, incidents: false, scheduling: false, compliance: false, hours: false, reports: true, notifications: true, roles: false, settings: false },
  },
];

const modules = ["dashboard", "guards", "managers", "sites", "incidents", "scheduling", "compliance", "hours", "reports", "notifications", "roles", "settings"];

const RolesPermissions = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="module-page-header">
        <div>
          <h1 className="module-page-title">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Define access levels and module permissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" />Create Role
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {roles.map(role => (
          <div key={role.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.desc}</p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground"><Edit className="w-4 h-4" /></button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {modules.map(mod => (
                <span key={mod} className={`text-xs px-2 py-1 rounded ${(role.permissions as Record<string, boolean>)[mod] ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                  {mod}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      <div className="data-table overflow-x-auto">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Permission Matrix</h2>
        </div>
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-secondary">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">MODULE</th>
              {roles.map(r => (
                <th key={r.id} className="text-center text-xs font-medium text-muted-foreground px-4 py-3">{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map(mod => (
              <tr key={mod} className="border-b border-border">
                <td className="px-5 py-3 text-sm font-medium text-foreground capitalize">{mod}</td>
                {roles.map(r => (
                  <td key={r.id} className="text-center px-4 py-3">
                    {(r.permissions as Record<string, boolean>)[mod] ? (
                      <Check className="w-4 h-4 text-success inline" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 inline" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolesPermissions;
