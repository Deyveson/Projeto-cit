import { createContext, useContext, useState, ReactNode } from 'react';

// Tipos
export interface Package {
  id: string;
  name: string;
  hours: number;
  bonus?: number;
  price: number;
  isBestOffer?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  availableHours: number;
  isAdmin: boolean;
}

export interface CartItem {
  package: Package;
  quantity: number;
}

interface AppContextType {
  // Pacotes disponíveis
  packages: Package[];
  
  // Carrinho
  cart: CartItem[];
  addToCart: (pkg: Package) => void;
  removeFromCart: (packageId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  
  // Usuário
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  register: (data: Omit<User, 'id' | 'availableHours' | 'isAdmin'>) => void;
  
  // Empresa (admin)
  companyData: {
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
  };
  updateCompanyData: (data: typeof companyData) => void;
  
  // Dados financeiros (admin)
  financialData: {
    bank: string;
    agency: string;
    account: string;
    accountType: string;
    pixKey: string;
  };
  updateFinancialData: (data: typeof financialData) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Dados mock
const MOCK_PACKAGES: Package[] = [
  { id: '1', name: '1 Hora', hours: 1, price: 5.00 },
  { id: '2', name: '3 Horas', hours: 2, bonus: 1, price: 10.00, isBestOffer: true },
  { id: '3', name: '24 Horas', hours: 24, price: 25.00 },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [companyData, setCompanyData] = useState({
    name: 'Cit Tecnologia Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'contato@citnet.com',
    phone: '(11) 98765-4321',
    address: 'Rua das Startups, 100 - São Paulo, SP',
  });
  const [financialData, setFinancialData] = useState({
    bank: 'Banco Digital',
    agency: '0001',
    account: '123456-7',
    accountType: 'Conta Corrente',
    pixKey: 'contato@citnet.com',
  });

  // Carrinho
  const addToCart = (pkg: Package) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.package.id === pkg.id);
      if (existing) {
        return prev.map((item) =>
          item.package.id === pkg.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { package: pkg, quantity: 1 }];
    });
  };

  const removeFromCart = (packageId: string) => {
    setCart((prev) => prev.filter((item) => item.package.id !== packageId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.package.price * item.quantity,
    0
  );

  // Autenticação
  const login = (email: string, password: string): boolean => {
    // Mock login - admin
    if (email === 'admin@citnet.com' && password === 'admin') {
      setCurrentUser({
        id: 'admin',
        name: 'Administrador',
        email,
        phone: '(11) 98765-4321',
        cpf: '123.456.789-00',
        availableHours: 0,
        isAdmin: true,
      });
      return true;
    }
    
    // Mock login - cliente
    if (email === 'cliente@example.com' && password === '123456') {
      setCurrentUser({
        id: 'user1',
        name: 'João Silva',
        email,
        phone: '(11) 91234-5678',
        cpf: '987.654.321-00',
        availableHours: 5,
        isAdmin: false,
      });
      return true;
    }
    
    return false;
  };

  const logout = () => {
    localStorage.clear();
    setCurrentUser(null);
    clearCart();
  };

  const register = (data: Omit<User, 'id' | 'availableHours' | 'isAdmin'>) => {
    // Mock registration
    setCurrentUser({
      ...data,
      id: Date.now().toString(),
      availableHours: 0,
      isAdmin: false,
    });
  };

  return (
    <AppContext.Provider
      value={{
        packages: MOCK_PACKAGES,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        currentUser,
        login,
        logout,
        register,
        companyData,
        updateCompanyData: setCompanyData,
        financialData,
        updateFinancialData: setFinancialData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
