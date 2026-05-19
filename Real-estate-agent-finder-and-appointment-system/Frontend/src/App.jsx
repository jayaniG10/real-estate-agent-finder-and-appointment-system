import { useEffect, useState } from 'react';
import LoginPage from './auth/LoginPage';
import AppointmentManagementPage from './admin/AppointmentManagementPage';
import PropertyDetails from './admin/PropertyDetails';
import PropertyManagementPage from './admin/PropertyManagementPage';
import InquiryManagemantPage from './admin/InquiryManagemantPage';
import RatingsManagementPage from './admin/RatingsManagementPage';
import UserManagementPage from './admin/UserManagementPage';
import AppointmentsPage from './client/AppointmentsPage';
import ComparisonsPage from './client/ComparisonsPage';
import FavoritesPage from './client/FavoritesPage';
import InquiriesPage from './client/InquiriesPage';
import PropertyDetailsPage from './client/PropertyDetailsPage';
import PropertiesPage from './client/PropertiesPage';
import SideBar from './components/SideBar';

const LOGIN_PATH = '/';
const AUTH_STORAGE_KEY = 'property_management_current_user';

const CLIENT_ROUTES = {
    '/client/properties': PropertiesPage,
    '/client/appointments': AppointmentsPage,
    '/client/inquiries': InquiriesPage,
    '/client/comparisons': ComparisonsPage,
    '/client/favorites': FavoritesPage
};

const ADMIN_ROUTES = {
    '/admin/users': UserManagementPage,
    '/admin/properties': PropertyManagementPage,
    '/admin/appointments': AppointmentManagementPage,
    '/admin/inquiries': InquiryManagemantPage,
    '/admin/ratings': RatingsManagementPage
};

const DEFAULT_CLIENT_PATH = '/client/properties';
const DEFAULT_ADMIN_PATH = '/admin/users';

const getCurrentRoute = () => ({
    path: window.location.pathname || LOGIN_PATH,
    state: window.history.state ?? {}
});
const getAdminPropertyDetailsId = (path) => {
    const match = path.match(/^\/admin\/properties\/(\d+)$/);
    return match ? Number(match[1]) : null;
};
const getClientPropertyDetailsId = (path) => {
    const match = path.match(/^\/client\/properties\/(\d+)$/);
    return match ? Number(match[1]) : null;
};

const getStoredUser = () => {
    const storedUser = window.sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch {
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
};

function App() {
    const [currentRoute, setCurrentRoute] = useState(getCurrentRoute);
    const [currentUser, setCurrentUser] = useState(getStoredUser);

    useEffect(() => {
        const handleRouteChange = () => {
            setCurrentRoute(getCurrentRoute());
        };

        window.addEventListener('popstate', handleRouteChange);
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, []);

    const navigate = (path, state = {}) => {
        if (window.location.pathname !== path) {
            window.history.pushState(state, '', path);
        } else {
            window.history.replaceState(state, '', path);
        }
        setCurrentRoute({ path, state });
    };

    const handleLoginSuccess = (user) => {
        setCurrentUser(user);
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        navigate(user.role === 'admin' ? DEFAULT_ADMIN_PATH : DEFAULT_CLIENT_PATH);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        navigate(LOGIN_PATH);
    };

    const currentPath = currentRoute.path;

    if (currentPath === LOGIN_PATH) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    if (!currentUser) {
        navigate(LOGIN_PATH);
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    const isClientRoute = currentPath.startsWith('/client');
    const isAdminRoute = currentPath.startsWith('/admin');
    const role = isAdminRoute ? 'admin' : isClientRoute ? 'client' : null;

    if (!role || currentUser.role !== role) {
        navigate(LOGIN_PATH);
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    const routes = role === 'admin' ? ADMIN_ROUTES : CLIENT_ROUTES;
    const fallbackPath = role === 'admin' ? DEFAULT_ADMIN_PATH : DEFAULT_CLIENT_PATH;
    const ActivePage = routes[currentPath];
    const propertyDetailsId = role === 'admin' ? getAdminPropertyDetailsId(currentPath) : null;
    const clientPropertyDetailsId = role === 'client' ? getClientPropertyDetailsId(currentPath) : null;

    if (!ActivePage && !propertyDetailsId && !clientPropertyDetailsId) {
        navigate(fallbackPath);
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <SideBar
                role={role}
                currentPath={currentPath}
                onNavigate={navigate}
                onLogout={handleLogout}
            />
            <main className="min-h-screen pl-72">
                {propertyDetailsId ? (
                    <PropertyDetails
                        propertyId={propertyDetailsId}
                        onBack={() => navigate('/admin/properties')}
                    />
                ) : clientPropertyDetailsId ? (
                    <PropertyDetailsPage
                        propertyId={clientPropertyDetailsId}
                        onBack={() => navigate(currentRoute.state?.backTo || '/client/properties')}
                        currentUser={currentUser}
                    />
                ) : currentPath === '/client/inquiries' ? (
                    <InquiriesPage currentUser={currentUser} />
                ) : currentPath === '/client/appointments' ? (
                    <AppointmentsPage currentUser={currentUser} />
                ) : currentPath === '/client/properties' ? (
                    <PropertiesPage
                        currentUser={currentUser}
                        onOpenComparisons={() => navigate('/client/comparisons')}
                        onOpenPropertyDetails={(propertyId) =>
                            navigate(`/client/properties/${propertyId}`, { backTo: '/client/properties' })
                        }
                    />
                ) : currentPath === '/client/comparisons' ? (
                    <ComparisonsPage
                        currentUser={currentUser}
                        onGoToProperties={() => navigate('/client/properties')}
                        onOpenPropertyDetails={(propertyId) =>
                            navigate(`/client/properties/${propertyId}`, { backTo: '/client/comparisons' })
                        }
                    />
                ) : currentPath === '/admin/properties' ? (
                    <PropertyManagementPage
                        currentUser={currentUser}
                        onOpenPropertyDetails={(propertyId) => navigate(`/admin/properties/${propertyId}`)}
                    />
                ) : currentPath === '/client/favorites' ? (
                    <FavoritesPage
                        currentUser={currentUser}
                        onOpenPropertyDetails={(propertyId) =>
                            navigate(`/client/properties/${propertyId}`, { backTo: '/client/favorites' })
                        }
                    />
                ) : (
                    <ActivePage />
                )}
            </main>
        </div>
    );
}

export default App;
