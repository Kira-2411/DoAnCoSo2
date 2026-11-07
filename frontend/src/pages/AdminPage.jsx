import React, { useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AdminMovies from '../components/admin/AdminMovies';
import AdminShowtimes from '../components/admin/AdminShowtimes';
import AdminFoods from '../components/admin/AdminFoods';
import AdminNewsPromotions from '../components/admin/AdminNewsPromotions';
import AdminUsers from '../components/admin/AdminUsers';
import AdminReports from '../components/admin/AdminReports';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('movies');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'movies':
        return <AdminMovies />;
      case 'showtimes':
        return <AdminShowtimes />;
      case 'foods':
        return <AdminFoods />;
      case 'news_promos':
        return <AdminNewsPromotions />;
      case 'users':
        return <AdminUsers />;
      case 'reports':
        return <AdminReports />;
      default:
        return <AdminMovies />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTabContent()}
    </AdminLayout>
  );
};

export default AdminPage;
