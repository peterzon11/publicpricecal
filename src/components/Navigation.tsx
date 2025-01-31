import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Calculator, BarChart3, Calendar, FolderOpen } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const links = [
    {
      name: 'Calculator',
      href: '/',
      icon: Calculator
    },
    {
      name: 'Analysis',
      href: '/analysis',
      icon: BarChart3
    },
    {
      name: 'Schedule',
      href: '/schedule',
      icon: Calendar
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderOpen
    }
  ];

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex space-x-8">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 text-sm font-medium',
                      location.pathname === link.href
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:border-b-2 hover:border-gray-300 hover:text-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;