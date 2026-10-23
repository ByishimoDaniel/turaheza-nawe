import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}