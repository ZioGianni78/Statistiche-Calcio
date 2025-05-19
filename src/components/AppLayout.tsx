import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';

const AppLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {isMobile ? (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50">
              <MenuIcon className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64" onInteractOutside={closeSidebar}>
            <Sidebar onLinkClick={closeSidebar} />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar onLinkClick={closeSidebar} />
      )}
      {/* The Outlet component will render the content of the nested routes */}
      <main className={`flex-1 p-4 transition-all duration-300 ${isMobile ? 'mt-16' : 'ml-64'}`}>
        <Outlet />
      </main>
    </>
  );
}; // <-- Parentesi corretta qui

export default AppLayout;