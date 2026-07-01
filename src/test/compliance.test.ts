import { describe, it, expect } from "vitest";

// Mock navItems representing the ones in DashboardLayout
const mockNavItems = [
  { path: "/dashboard", label: "Dashboard", permission: "dashboard" },
  { path: "/dashboard/guards", label: "Guards", permission: "guard" },
  { path: "/dashboard/compliance", label: "Compliance & Documents", permission: "compliance" },
];

const checkCompliance = (user: any) => {
  return (
    user?.role === "admin" ||
    (user?.securityLicenceUploaded && user?.stateIdUploaded)
  );
};

const filterNavItems = (user: any, permissions: string[], isCompliant: boolean) => {
  return mockNavItems.filter((item) => {
    if (user?.role === "admin") return true;

    // If not compliant, only show Compliance page
    if (!isCompliant) {
      return item.permission === "compliance";
    }

    return (
      permissions.includes(item.permission) ||
      permissions.includes(`view_${item.permission}`)
    );
  });
};

describe("Compliance Gating Logic", () => {
  it("should evaluate admin user as compliant regardless of document status", () => {
    const adminUser = {
      role: "admin",
      securityLicenceUploaded: false,
      stateIdUploaded: false,
    };
    expect(checkCompliance(adminUser)).toBe(true);
  });

  it("should evaluate guard without documents as non-compliant", () => {
    const guardUser = {
      role: "guard",
      securityLicenceUploaded: false,
      stateIdUploaded: false,
    };
    expect(checkCompliance(guardUser)).toBe(false);
  });

  it("should evaluate guard with only one mandatory document as non-compliant", () => {
    const guardUser = {
      role: "guard",
      securityLicenceUploaded: true,
      stateIdUploaded: false,
    };
    expect(checkCompliance(guardUser)).toBe(false);
  });

  it("should evaluate guard with both mandatory documents as compliant", () => {
    const guardUser = {
      role: "guard",
      securityLicenceUploaded: true,
      stateIdUploaded: true,
    };
    expect(checkCompliance(guardUser)).toBe(true);
  });

  it("should restrict navigation items for non-compliant user to only compliance tab", () => {
    const guardUser = {
      role: "guard",
      securityLicenceUploaded: false,
      stateIdUploaded: false,
    };
    const permissions = ["dashboard", "guard", "compliance"];
    const isCompliant = checkCompliance(guardUser);

    const filtered = filterNavItems(guardUser, permissions, isCompliant);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].permission).toBe("compliance");
  });

  it("should allow full navigation for compliant user based on permissions", () => {
    const guardUser = {
      role: "guard",
      securityLicenceUploaded: true,
      stateIdUploaded: true,
    };
    const permissions = ["dashboard", "compliance"];
    const isCompliant = checkCompliance(guardUser);

    const filtered = filterNavItems(guardUser, permissions, isCompliant);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(f => f.permission)).toContain("dashboard");
    expect(filtered.map(f => f.permission)).toContain("compliance");
  });
});
