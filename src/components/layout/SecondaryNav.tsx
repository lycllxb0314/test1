'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { NavItem, NavGroup } from './nav-config';
import { groupNavItems } from './nav-config';

// ─── Props ───────────────────────────────────────────────────────

interface SecondaryNavProps {
  navItems: NavItem[];
  title: string;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────

export function SecondaryNav({ navItems, title, onClose }: SecondaryNavProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const groups = React.useMemo(() => groupNavItems(navItems), [navItems]);

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href],
    );
  };

  return (
    <div className="w-56 border-r bg-white flex flex-col">
      {/* 标题栏 */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <span className="font-semibold text-gray-900">{title}</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 导航项列表 */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {groups.map((group, gi) => (
          <NavGroupSection
            key={gi}
            group={group}
            isFirst={gi === 0}
            pathname={pathname}
            expandedItems={expandedItems}
            onToggleExpand={toggleExpand}
          />
        ))}
      </nav>
    </div>
  );
}

// ─── NavGroupSection ─────────────────────────────────────────────

interface NavGroupSectionProps {
  group: NavGroup;
  isFirst: boolean;
  pathname: string;
  expandedItems: string[];
  onToggleExpand: (href: string) => void;
}

function NavGroupSection({ group, isFirst, pathname, expandedItems, onToggleExpand }: NavGroupSectionProps) {
  return (
    <div className={isFirst ? '' : 'mt-3'}>
      {group.label && (
        <div className="px-3 pb-1 pt-1 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          {group.label}
        </div>
      )}
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <NavItemRow
            key={item.href}
            item={item}
            pathname={pathname}
            expandedItems={expandedItems}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>
    </div>
  );
}

// ─── NavItemRow ──────────────────────────────────────────────────

interface NavItemRowProps {
  item: NavItem;
  pathname: string;
  expandedItems: string[];
  onToggleExpand: (href: string) => void;
}

function NavItemRow({ item, pathname, expandedItems, onToggleExpand }: NavItemRowProps) {
  const isActive = pathname === item.href || (item.children != null && item.children.length > 0 && pathname.startsWith(item.href));
  const isExpanded = expandedItems.includes(item.href) || (item.children != null && item.children.length > 0 && pathname.startsWith(item.href));
  const Icon = item.icon;
  const hasChildren = !!(item.children && item.children.length > 0);

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={() => onToggleExpand(item.href)}
          className={cn(
            'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
            isActive
              ? 'bg-primary text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100',
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 text-left">{item.name}</span>
          {item.badge && (
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-bold rounded',
                isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary',
              )}
            >
              {item.badge}
            </span>
          )}
          <ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
        </button>
      ) : (
        <Link
          href={item.href}
          className={cn(
            'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
            isActive
              ? 'bg-primary text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100',
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{item.name}</span>
          {item.badge && (
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-bold rounded',
                isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary',
              )}
            >
              {item.badge}
            </span>
          )}
        </Link>
      )}

      {/* 子项展开区域 */}
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-200 pl-2">
          {item.children!.map((child) => (
            <NavChildItem
              key={child.href}
              item={child}
              pathname={pathname}
              expandedItems={expandedItems}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NavChildItem (二级/三级子项) ────────────────────────────────

interface NavChildItemProps {
  item: NavItem;
  pathname: string;
  expandedItems: string[];
  onToggleExpand: (href: string) => void;
}

function NavChildItem({ item, pathname, expandedItems, onToggleExpand }: NavChildItemProps) {
  const isActive = pathname === item.href || (item.children != null && item.children.length > 0 && pathname.startsWith(item.href));
  const Icon = item.icon;
  const hasChildren = !!(item.children && item.children.length > 0);
  const isExpanded = expandedItems.includes(item.href) || (item.children != null && item.children.length > 0 && pathname.startsWith(item.href));

  return (
    <div>
      {hasChildren ? (
        <>
          <button
            onClick={() => onToggleExpand(item.href)}
            className={cn(
              'group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all w-full',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">{item.name}</span>
            {item.badge && (
              <span
                className={cn(
                  'px-1 py-0.5 text-[10px] font-bold rounded',
                  isActive ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-700',
                )}
              >
                {item.badge}
              </span>
            )}
            <ChevronRight className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-90')} />
          </button>
          {isExpanded && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
              {item.children!.map((grandChild) => {
                const gcIsActive = pathname === grandChild.href;
                const GCIcon = grandChild.icon;
                return (
                  <Link
                    key={grandChild.href}
                    href={grandChild.href}
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-3 py-1 text-xs transition-all',
                      gcIsActive
                        ? 'bg-primary/5 text-primary font-medium'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
                    )}
                  >
                    <GCIcon className="h-3 w-3" />
                    <span>{grandChild.name}</span>
                    {grandChild.badge && (
                      <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-amber-50 text-amber-600">
                        {grandChild.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <Link
          href={item.href}
          className={cn(
            'group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all',
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{item.name}</span>
          {item.badge && (
            <span
              className={cn(
                'px-1 py-0.5 text-[10px] font-bold rounded',
                isActive ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-700',
              )}
            >
              {item.badge}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}
