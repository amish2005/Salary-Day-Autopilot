import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CreditCard,
  PiggyBank,
  History,
  Settings,
} from 'lucide-react';

export const navigationLinks = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Summary, health status & next action',
  },
  {
    name: 'My Money',
    href: '/my-money',
    icon: Wallet,
    description: 'Salary, bank balance & envelopes',
  },
  {
    name: 'Bills & Payments',
    href: '/bills',
    icon: Receipt,
    description: 'Rent, EMI, utilities & schedule',
  },
  {
    name: 'Spending',
    href: '/spending',
    icon: CreditCard,
    description: 'Expenses, cards & liabilities',
  },
  {
    name: 'Savings Goals',
    href: '/savings',
    icon: PiggyBank,
    description: 'Laptop goal & monthly contributions',
  },
  {
    name: 'Autopilot Activity',
    href: '/activity',
    icon: History,
    description: 'Audit log of automated allocations',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Salary dates, holidays & profile',
  },
];
