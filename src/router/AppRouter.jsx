import {
    Navbar,
    NavbarDivider,
    NavbarItem,
    NavbarLabel,
    NavbarSection,
    NavbarSpacer,
} from "../components/Navbar";
import { StackedLayout } from "../components/stacked-layout";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Pages
import ProjectsPage from "../pages/ProjectsPage";
import EditorPage from "../pages/EditorPage";

const navItems = [
    { label: "Projects", url: "/projects" },
];

function AppContent() {
    const location = useLocation();
    const hideNavbar = location.pathname.startsWith('/editor');

    return (
        <StackedLayout
            navbar={
                !hideNavbar ? (
                    <Navbar>
                        <NavbarSection className="max-lg:hidden">
                            {navItems.map(({ label, url }) => (
                                <NavbarItem key={label} href={url}>
                                    {label}
                                </NavbarItem>
                            ))}
                        </NavbarSection>
                    </Navbar>
                ) : undefined
            }
        >
            <Routes>
                {/* Default route redirects to projects */}
                <Route path="/" element={<Navigate to="/projects" replace />} />
                
                {/* Projects management page */}
                <Route path="/projects" element={<ProjectsPage />} />
                
                {/* Video editor page */}
                <Route path="/editor" element={<EditorPage />} />
                
                {/* Video editor with specific project */}
                <Route path="/editor/:projectId" element={<EditorPage />} />
                
                {/* Catch-all route for 404 */}
                <Route path="*" element={
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                            <p className="text-xl text-neutral-400 mb-6">Page not found</p>
                            <a 
                                href="/projects" 
                                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                            >
                                Go to Projects
                            </a>
                        </div>
                    </div>
                } />
            </Routes>
        </StackedLayout>
    );
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}
