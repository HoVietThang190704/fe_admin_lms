import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import type { SidebarContent } from '@/components/dashboard/sidebar-data';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export type AdminScaffoldProps = {
  sidebar: SidebarContent;
  children: React.ReactNode;
};

export const AdminScaffold = ({ sidebar, children }: AdminScaffoldProps) => (
  <div className="min-h-screen bg-slate-900/95 text-slate-50">
    <div className="flex min-h-screen flex-col lg:flex-row">
      <DashboardSidebar
        title={sidebar.title}
        tagline={sidebar.tagline}
        navItems={sidebar.navItems}
        secondaryNavItems={sidebar.secondaryNavItems}
        support={sidebar.support}
      />

      <div className="flex flex-1 flex-col bg-slate-50 text-slate-900">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white/70 px-6 py-4 backdrop-blur lg:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">{sidebar.title}</p>
            <p className="text-lg font-semibold text-slate-900">{sidebar.tagline}</p>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation</span>
          </Button>
        </header>

        <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  </div>
);
