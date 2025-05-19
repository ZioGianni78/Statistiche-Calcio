import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HomeIcon, CalendarIcon, BarChartIcon, ClockIcon } from 'lucide-react'; // Add ClockIcon

interface SidebarProps {
  onLinkClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLinkClick }) => {
  const navItems = [
    { path: '/', name: 'Dashboard', icon: HomeIcon },
    { path: '/matches', name: 'Partite', icon: CalendarIcon },
    { path: '/player-stats', name: 'Statistiche Calciatore', icon: BarChartIcon },
    { path: '/stopwatch', name: 'Cronometro', icon: ClockIcon }, // Add new link
  ];

  return (
    <div className="flex flex-col h-screen w-64 border-r bg-sidebar text-sidebar-foreground p-4 shadow-md fixed left-0 top-0 z-40 max-md:hidden">
      <div className="mb-8 text-2xl font-bold text-sidebar-primary">14 Leon</div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            asChild
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              // Add active link styling later if needed
            )}
            onClick={onLinkClick}
          >
            <Link to={item.path}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;