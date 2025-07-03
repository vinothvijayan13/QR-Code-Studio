import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User, QrCode, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, signOut } = useAuth();

  const getInitials = (phoneNumber: string) => {
    return phoneNumber.slice(-2).toUpperCase();
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove country code and format as XXX-XXX-XXXX
    const cleaned = phoneNumber.replace(/^\+91/, '');
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 transition-all duration-300">
      <div className="container mx-auto mobile-padding py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-slide-in-left">
            <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-glow hover-lift transition-smooth">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold gradient-text">
                QR Code Studio
              </h1>
              <p className="text-xs text-muted-foreground">Analytics & Generation</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="animate-slide-in-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full hover-lift transition-smooth">
                  <Avatar className="h-12 w-12 border-2 border-violet-200 dark:border-violet-800">
                    <AvatarFallback className="bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm">
                      {user?.phoneNumber ? getInitials(user.phoneNumber) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm font-medium leading-none">Online</p>
                    </div>
                    <p className="text-xs leading-none text-muted-foreground font-mono">
                      {user?.phoneNumber ? formatPhoneNumber(user.phoneNumber) : 'Unknown'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer p-3 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                  <User className="mr-3 h-4 w-4 text-violet-600" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  <Settings className="mr-3 h-4 w-4 text-blue-600" />
                  <span>Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                  <HelpCircle className="mr-3 h-4 w-4 text-green-600" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:text-red-600 transition-colors"
                  onClick={signOut}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;