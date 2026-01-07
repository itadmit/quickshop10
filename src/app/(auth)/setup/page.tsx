'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Check, Store, Package, FolderOpen, Globe, Loader2 } from 'lucide-react';

interface SetupStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'active' | 'completed';
}

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const email = searchParams.get('email');
  const password = searchParams.get('password');
  const name = searchParams.get('name');
  const storeName = searchParams.get('storeName');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [storeSlug, setStoreSlug] = useState('');

  const [steps, setSteps] = useState<SetupStep[]>([
    { id: 'store', label: 'יוצר חנות חדשה', icon: Store, status: 'pending' },
    { id: 'categories', label: 'יוצר 4 קטגוריות לדוגמא', icon: FolderOpen, status: 'pending' },
    { id: 'products', label: 'יוצר 4 מוצרים לדוגמא', icon: Package, status: 'pending' },
    { id: 'domain', label: 'מגדיר דומיין זמני', icon: Globe, status: 'pending' },
  ]);

  const updateStepStatus = useCallback((index: number, status: 'pending' | 'active' | 'completed') => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status } : step
    ));
  }, []);

  useEffect(() => {
    if (!email || !password || !name || !storeName) {
      router.push('/register');
      return;
    }

    const runSetup = async () => {
      try {
        // Step 1: Create store
        updateStepStatus(0, 'active');
        setCurrentStep(0);
        
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, storeName }),
        });

        const registerData = await registerResponse.json();
        
        if (!registerResponse.ok || !registerData.success) {
          setError(registerData.error || 'שגיאה ביצירת החנות');
          return;
        }

        setStoreSlug(registerData.storeSlug);
        updateStepStatus(0, 'completed');

        // Step 2: Categories animation (already created in register)
        updateStepStatus(1, 'active');
        setCurrentStep(1);
        await new Promise(resolve => setTimeout(resolve, 800));
        updateStepStatus(1, 'completed');

        // Step 3: Products animation (already created in register)
        updateStepStatus(2, 'active');
        setCurrentStep(2);
        await new Promise(resolve => setTimeout(resolve, 800));
        updateStepStatus(2, 'completed');

        // Step 4: Domain setup
        updateStepStatus(3, 'active');
        setCurrentStep(3);
        await new Promise(resolve => setTimeout(resolve, 600));
        updateStepStatus(3, 'completed');

        // Auto sign in
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          router.push('/login?registered=true');
          return;
        }

        // Wait a moment before redirect
        await new Promise(resolve => setTimeout(resolve, 500));

        // Redirect to dashboard with welcome modal
        router.push(`/shops/${registerData.storeSlug}/admin?welcome=true`);
        router.refresh();
        
      } catch (err) {
        console.error('Setup error:', err);
        setError('שגיאה בתהליך ההגדרה');
      }
    };

    runSetup();
  }, [email, password, name, storeName, router, updateStepStatus]);

  const allCompleted = steps.every(s => s.status === 'completed');

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-logo text-gray-900 mb-2">Quick Shop</h1>
          {!error && (
            <p className="text-gray-500">
              {allCompleted ? 'הכל מוכן! 🎉' : 'מכינים את החנות שלך...'}
            </p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {error ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button
                onClick={() => router.push('/register')}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                חזור להרשמה
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                    step.status === 'active' 
                      ? 'bg-emerald-50 border border-emerald-200' 
                      : step.status === 'completed'
                      ? 'bg-gray-50'
                      : 'bg-gray-50/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    step.status === 'completed' 
                      ? 'bg-emerald-500 text-white' 
                      : step.status === 'active'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? (
                      <Check className="w-5 h-5" />
                    ) : step.status === 'active' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium transition-colors duration-300 ${
                      step.status === 'completed' 
                        ? 'text-emerald-700' 
                        : step.status === 'active'
                        ? 'text-emerald-600'
                        : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {step.status === 'active' && (
                      <p className="text-sm text-emerald-500 mt-0.5">מעבד...</p>
                    )}
                    {step.status === 'completed' && step.id === 'domain' && storeSlug && (
                      <p className="text-sm text-gray-500 mt-0.5" dir="ltr">
                        /shops/{storeSlug}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* All done */}
              {allCompleted && (
                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <span className="text-3xl">✨</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    זהו, הכל מוכן!
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    עוברים לדשבורד...
                  </p>
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

