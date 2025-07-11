'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MonitorCheck, Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import CustomSignIn from '@/components/CustomSignin';
import { BaseUser, useAuth } from '@/hooks/useAuth';
import { useWallet } from '@civic/auth-web3/react';
import { getOrCreateDBUser } from '@/actions/auth';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { appUser, signIn, signOut, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { address } = useWallet({ type: 'solana' });

  useEffect(() => {
    router.prefetch('/payout');
    router.prefetch('/');
    router.prefetch('/validator');
  }, [router]);

  useEffect(() => {
    async function getDBUser() {
      if (address) {
        await getOrCreateDBUser(address);
      }
    }
    getDBUser();
  }, [address, router]);

  const scrollToSection = useCallback((section: string, id: string) => {
    const el = document.getElementById(id);
    if (el && section == '/') {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (el) {
      const yOffset = -75;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  const handleNavScroll = useCallback(
    (sectionId: string) => (e: React.MouseEvent) => {
      type ValidRoutes = '/' | '/validator' | '/payout' | '/dashboard';
      e.preventDefault();
      let [section, id] = sectionId.split('#');
      if (section == '') {
        section = '/';
      } else {
        section = '/' + section;
      }
      if (id == undefined) id = '';

      if (pathname == section) {
        scrollToSection(section, id);
      } else {
        router.push(section as ValidRoutes);
        setTimeout(() => {
          scrollToSection(section, id);
        }, 800);
      }
    },
    [pathname, router, scrollToSection]
  );

  const doSignIn = useCallback(() => {
    const triggerSignIn = () => {
      setIsSigningIn(true);
      setIsMobileMenuOpen(false);
      signIn()
        .then(async () => router.push('/dashboard'))
        .catch(() => console.log('Declined by user'))
        .finally(() => setIsSigningIn(false));
    };

    if (window.scrollY === 0) {
      triggerSignIn();
    } else {
      const onScroll = () => {
        if (window.scrollY === 0) {
          window.removeEventListener('scroll', onScroll);
          triggerSignIn();
        }
      };
      window.addEventListener('scroll', onScroll);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [signIn, router]);

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Become a Validator', href: 'validator#validator' },
    { label: 'Install DPIN', href: 'validator#install' },
  ];

  const NavButton = ({
    href,
    label,
  }: {
    href: string;
    label: string;
  }) => (
    <Button
      className="text-sm font-medium text-zinc-400 transition-colors hover:text-white cursor-pointer w-full md:w-auto justify-start md:justify-center"
      onClick={e => {
        handleNavScroll(href)(e);
        setIsMobileMenuOpen(false);
      }}
    >
      {label}
    </Button>
  );

  return (
    <header className="sticky top-0 z-[100] border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-[1800px] flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <MonitorCheck className="h-6 w-6 text-emerald-500" />
          <span className="text-xl font-bold tracking-tighter">
            DPIN Uptime
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex">
          {navItems.map(item => (
            <NavButton key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {appUser && (
            <Button
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white cursor-pointer w-full md:w-auto justify-start md:justify-center hidden md:block"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </Button>
          )}
          <CustomSignIn
            signIn={signIn}
            appUser={appUser as BaseUser}
            signOut={signOut}
            isProcessing={isSigningIn || isLoading}
            doSignIn={doSignIn}
            className="hidden md:block"
          />
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer hidden md:block"
            onClick={() => router.push('/payout')}
          >
            Payout
          </Button>

          {/* Mobile Menu Button */}
          <Button
            className="md:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'fixed inset-x-0 top-[64px] z-[90] h-[calc(100vh-64px)] overflow-y-auto bg-black border-b border-zinc-800 transition-all duration-300 ease-in-out',
          isMobileMenuOpen
            ? 'translate-y-0 opacity-100 visible'
            : '-translate-y-full opacity-0 invisible'
        )}
      >
        <nav className="container mx-auto flex flex-col gap-2 px-4 py-6">
          {navItems.map(item => (
            <NavButton key={item.href} href={item.href} label={item.label} />
          ))}

          {appUser && (
            <Button
              className="text-sm font-medium text-zinc-400 transition-colors hover:text-white cursor-pointer w-full md:w-auto justify-start md:justify-center"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </Button>
          )}
          <CustomSignIn
            signIn={signIn}
            appUser={appUser as BaseUser}
            signOut={signOut}
            isProcessing={isSigningIn || isLoading}
            doSignIn={doSignIn}
            className="w-full justify-start mt-4"
            avatarClassName="hidden"
          />
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer w-full justify-start mt-4"
            onClick={() => {
              router.push('/payout');
              setIsMobileMenuOpen(false);
            }}
          >
            Payout
          </Button>
        </nav>
      </div>
    </header>
  );
}
