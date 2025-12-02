import React, { useEffect, useState } from "react";
import Loader from "./Loader";
import AdminDashboard from "./AdminDashboard";

const AdminWrapper = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading time OR wait for real async calls
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    return loading ? <Loader /> : <AdminDashboard />;
};

export default AdminWrapper;
