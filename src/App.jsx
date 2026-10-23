
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturedProperties from "./components/FeaturedProperties";
import Footer from "./components/Footer";

/* =========================
   PUBLIC PAGES
========================= */

import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Search from "./pages/Search";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ListProperty from "./pages/ListProperty";

/* =========================
   CUSTOMER
========================= */

import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProperties from "./pages/CustomerProperties";
import CustomerFavorites from "./pages/CustomerFavorites";
import CustomerInquiries from "./pages/CustomerInquiries";
import CustomerProfile from "./pages/CustomerProfile";

/* =========================
   OWNER
========================= */

import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerProperties from "./pages/OwnerProperties";
import OwnerPropertyDetails from "./pages/OwnerPropertyDetails";
import OwnerPropertyEdit from "./pages/OwnerPropertyEdit";
import OwnerInquiries from "./pages/OwnerInquiries";
import OwnerProfile from "./pages/OwnerProfile";

/* =========================
   ADMIN
========================= */

import AdminDashboard from "./pages/AdminDashboard";
import AdminProperties from "./pages/AdminProperties";
import AdminPropertyDetails from "./pages/AdminPropertyDetails";
import AdminPropertyEdit from "./pages/AdminPropertyEdit";
import AdminUsers from "./pages/AdminUsers";
import AdminInquiries from "./pages/AdminInquiries";
import AdminPayments from "./pages/AdminPayments";
import AdminSettings from "./pages/AdminSettings";

/* =========================
   AUTHENTICATION
========================= */

import Login from "./pages/Login";
import Register from "./pages/Register";

/* =========================
   PUBLIC PAGE LAYOUT
========================= */

function PublicLayout({ children }) {
  return (
    <div className="app-page-layout">
      <Navbar />

      <main className="app-page-content">
        {children}
      </main>

      <Footer />
    </div>
  );
}

/* =========================
   DASHBOARD PAGE LAYOUT
   CUSTOMER, OWNER & ADMIN
========================= */

function DashboardLayout({ children }) {
  return (
    <div className="app-page-layout">
      <Navbar />

      <main className="app-page-content">
        {children}
      </main>

      <Footer />
    </div>
  );
}

/* =========================
   HOME PAGE
========================= */

function Home() {
  return (
    <>
      <Hero />
      <FeaturedProperties />
    </>
  );
}

/* =========================
   APP ROUTES
========================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PUBLIC PAGES
        ========================= */}

        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />

        <Route
          path="/properties"
          element={
            <PublicLayout>
              <Properties />
            </PublicLayout>
          }
        />

        <Route
          path="/properties/:id"
          element={
            <PublicLayout>
              <PropertyDetails />
            </PublicLayout>
          }
        />

        <Route
          path="/search"
          element={
            <PublicLayout>
              <Search />
            </PublicLayout>
          }
        />

        <Route
          path="/about"
          element={
            <PublicLayout>
              <About />
            </PublicLayout>
          }
        />

        <Route
          path="/contact"
          element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          }
        />

        {/* =========================
            LIST PROPERTY
        ========================= */}

        <Route
          path="/list-property"
          element={
            <DashboardLayout>
              <ListProperty />
            </DashboardLayout>
          }
        />

        {/* =========================
            AUTHENTICATION
        ========================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
            CUSTOMER DASHBOARD
        ========================= */}

        <Route
          path="/customer"
          element={
            <DashboardLayout>
              <CustomerDashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/customer/properties"
          element={
            <DashboardLayout>
              <CustomerProperties />
            </DashboardLayout>
          }
        />

        <Route
          path="/customer/favorites"
          element={
            <DashboardLayout>
              <CustomerFavorites />
            </DashboardLayout>
          }
        />

        <Route
          path="/customer/inquiries"
          element={
            <DashboardLayout>
              <CustomerInquiries />
            </DashboardLayout>
          }
        />

        {/* CUSTOMER PROFILE */}

        <Route
          path="/customer/profile"
          element={
            <DashboardLayout>
              <CustomerProfile />
            </DashboardLayout>
          }
        />

        {/* =========================
            OWNER DASHBOARD
        ========================= */}

        <Route
          path="/owner"
          element={
            <DashboardLayout>
              <OwnerDashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/owner/properties"
          element={
            <DashboardLayout>
              <OwnerProperties />
            </DashboardLayout>
          }
        />

        <Route
          path="/owner/properties/new"
          element={
            <DashboardLayout>
              <ListProperty />
            </DashboardLayout>
          }
        />

        <Route
          path="/owner/properties/:id"
          element={
            <DashboardLayout>
              <OwnerPropertyDetails />
            </DashboardLayout>
          }
        />

        <Route
          path="/owner/properties/:id/edit"
          element={
            <DashboardLayout>
              <OwnerPropertyEdit />
            </DashboardLayout>
          }
        />

        <Route
          path="/owner/inquiries"
          element={
            <DashboardLayout>
              <OwnerInquiries />
            </DashboardLayout>
          }
        />

        {/* OWNER PROFILE */}

        <Route
          path="/owner/profile"
          element={
            <DashboardLayout>
              <OwnerProfile />
            </DashboardLayout>
          }
        />

        {/* =========================
            ADMIN DASHBOARD
        ========================= */}

        <Route
          path="/admin"
          element={
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          }
        />

        {/* ADMIN PROPERTIES */}

        <Route
          path="/admin/properties"
          element={
            <DashboardLayout>
              <AdminProperties />
            </DashboardLayout>
          }
        />

        <Route
          path="/admin/properties/:id"
          element={
            <DashboardLayout>
              <AdminPropertyDetails />
            </DashboardLayout>
          }
        />

        <Route
          path="/admin/properties/:id/edit"
          element={
            <DashboardLayout>
              <AdminPropertyEdit />
            </DashboardLayout>
          }
        />

        {/* ADMIN USERS */}

        <Route
          path="/admin/users"
          element={
            <DashboardLayout>
              <AdminUsers />
            </DashboardLayout>
          }
        />

        {/* ADMIN INQUIRIES */}

        <Route
          path="/admin/inquiries"
          element={
            <DashboardLayout>
              <AdminInquiries />
            </DashboardLayout>
          }
        />

        {/* ADMIN PAYMENTS */}

        <Route
          path="/admin/payments"
          element={
            <DashboardLayout>
              <AdminPayments />
            </DashboardLayout>
          }
        />

        {/* ADMIN SETTINGS */}

        <Route
          path="/admin/settings"
          element={
            <DashboardLayout>
              <AdminSettings />
            </DashboardLayout>
          }
        />

        {/* =========================
            PAGE NOT FOUND
        ========================= */}

        <Route
          path="*"
          element={
            <PublicLayout>
              <section
                style={{
                  maxWidth: "700px",
                  margin: "80px auto",
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <h1>404 - Page Not Found</h1>

                <p>
                  Sorry, the page you are looking for does not exist.
                </p>

                <a
                  href="/"
                  style={{ color: "#3525c2" }}
                >
                  Return to Home
                </a>
              </section>
            </PublicLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
