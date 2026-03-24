import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layouts/Header';
import Footer from './components/layouts/Footer';
import RegisterPage from './components/pages/RegisterPage';
import LoginPage from './components/pages/LoginPage';
import { AuthProvider } from './components/AuthContext';
import HomePage from './components/pages/HomePage';
import BookingPage from './components/pages/BookingPage';
import BookingDetailPage from './components/pages/BookingDetailPage';
import BookingListPage from './components/pages/BookingListPage';
import VoucherPage from './components/pages/VoucherPage';
import LatestBookingDetailPage from './components/pages/LatestBookingDetailPage';
import MomoReturnPage from './components/pages/MomoReturnPage';
import VnpayReturnPage from './components/pages/VnpayReturnPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './components/pages/admin/AdminDashboard';
import PetTypeManagement from './components/pages/admin/PetTypeManagement';
import StaffManagement from './components/pages/admin/StaffManagement';
import ServiceManagement from './components/pages/admin/ServiceManagement';
import BookingManagement from './components/pages/admin/BookingManagement';
import RevenueManagement from './components/pages/admin/RevenueManagement';
import UserManagement from './components/pages/admin/UserManagement';
function About() {
    return <h1>About Page</h1>;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* User Routes with Header & Footer */}
                    <Route path="/" element={
                        <>
                            <Header />
                            <HomePage />
                            <Footer />
                        </>
                    } />
                    <Route path="/about" element={
                        <>
                            <Header />
                            <About />
                            <Footer />
                        </>
                    } />
                    <Route path="/booking" element={
                        <>
                            <Header />
                            <ProtectedRoute>
                                <BookingPage />
                            </ProtectedRoute>
                            <Footer />
                        </>
                    } />
                    <Route path="/booking/details/:bookingId" element={
                        <>
                            <Header />
                            <ProtectedRoute>
                                <BookingDetailPage />
                            </ProtectedRoute>
                            <Footer />
                        </>
                    } />
                    <Route path="/bookings" element={
                        <>
                            <Header />
                            <ProtectedRoute>
                                <BookingListPage />
                            </ProtectedRoute>
                            <Footer />
                        </>
                    } />
                    <Route path="/booking/details/latest" element={
                        <>
                            <Header />
                            <ProtectedRoute>
                                <LatestBookingDetailPage />
                            </ProtectedRoute>
                            <Footer />
                        </>
                    } />
                    <Route path="/vouchers" element={
                        <>
                            <Header />
                            <ProtectedRoute>
                                <VoucherPage />
                            </ProtectedRoute>
                            <Footer />
                        </>
                    } />
                    <Route path="/payment/momo/return" element={
                        <>
                            <Header />
                            <MomoReturnPage />
                            <Footer />
                        </>
                    } />
                    <Route path="/payment/vnpay/return" element={
                        <>
                            <Header />
                            <VnpayReturnPage />
                            <Footer />
                        </>
                    } />

                    {/* Admin Routes - NO Header/Footer */}
                    <Route path="/admin" element={
                        <AdminProtectedRoute>
                            <AdminLayout />
                        </AdminProtectedRoute>
                    }>
                        <Route index element={<AdminDashboard />} />
                        <Route path="bookings" element={<BookingManagement />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="services" element={<ServiceManagement/>} />
                        <Route path="pet-types" element={<PetTypeManagement />} />
                        <Route path="staff" element={<StaffManagement />} />
                        <Route path="revenue" element={<RevenueManagement />} />
                        <Route path="reports" element={<div>Báo cáo</div>} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App;