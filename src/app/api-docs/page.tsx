import Link from "next/link"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingFooter } from "@/components/landing/LandingFooter"
import { Badge } from "@/components/landing/Badge"
import { Button } from "@/components/landing/Button"
import type { Metadata } from 'next'
import { 
  CodeIcon, 
  ShoppingCartIcon, 
  PackageIcon, 
  UsersIcon, 
  TagIcon,
  SettingsIcon,
  TerminalIcon,
  CheckIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  BoxIcon,
  LayersIcon,
  BracesIcon,
  CheckCircleIcon,
  ZapIcon
} from "@/components/admin/icons"

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "API Documentation | QuickShop",
  description: "תיעוד מלא של QuickShop Public API v1 - REST API למפתחים חיצוניים לאינטגרציה עם חנויות QuickShop",
}

const endpoints = [
  {
    category: "Orders",
    icon: ShoppingCartIcon,
    color: "bg-blue-500",
    items: [
      { method: "GET", path: "/api/v1/orders", desc: "רשימת הזמנות" },
      { method: "GET", path: "/api/v1/orders/{id}", desc: "פרטי הזמנה" },
      { method: "PATCH", path: "/api/v1/orders/{id}", desc: "עדכון הזמנה" },
    ]
  },
  {
    category: "Products",
    icon: PackageIcon,
    color: "bg-emerald-500",
    items: [
      { method: "GET", path: "/api/v1/products", desc: "רשימת מוצרים" },
      { method: "POST", path: "/api/v1/products", desc: "יצירת מוצר" },
      { method: "GET", path: "/api/v1/products/{id}", desc: "פרטי מוצר" },
      { method: "PATCH", path: "/api/v1/products/{id}", desc: "עדכון מוצר" },
    ]
  },
  {
    category: "Inventory",
    icon: BoxIcon,
    color: "bg-orange-500",
    items: [
      { method: "GET", path: "/api/v1/inventory/{id}", desc: "צפייה במלאי" },
      { method: "PATCH", path: "/api/v1/inventory/{id}", desc: "עדכון מלאי" },
    ]
  },
  {
    category: "Customers",
    icon: UsersIcon,
    color: "bg-purple-500",
    items: [
      { method: "GET", path: "/api/v1/customers", desc: "רשימת לקוחות" },
    ]
  },
]

const scopes = [
  { scope: "orders:read", desc: "צפייה בהזמנות", active: true },
  { scope: "orders:write", desc: "עדכון הזמנות", active: true },
  { scope: "products:read", desc: "צפייה במוצרים", active: true },
  { scope: "products:write", desc: "עריכת מוצרים", active: true },
  { scope: "customers:read", desc: "צפייה בלקוחות", active: true },
  { scope: "inventory:read", desc: "צפייה במלאי", active: true },
  { scope: "inventory:write", desc: "עדכון מלאי", active: true },
  // Future scopes - no public endpoints yet
  { scope: "discounts:read", desc: "צפייה בהנחות וקופונים", active: false },
  { scope: "discounts:write", desc: "ניהול הנחות וקופונים", active: false },
  { scope: "analytics:read", desc: "צפייה באנליטיקס", active: false },
  { scope: "webhooks:read", desc: "צפייה בוובהוקים", active: false },
  { scope: "webhooks:write", desc: "ניהול וובהוקים", active: false },
]

const errorCodes = [
  { code: "unauthorized", status: "401", desc: "API key לא תקין או חסר" },
  { code: "forbidden", status: "403", desc: "אין הרשאה (scope חסר)" },
  { code: "not_found", status: "404", desc: "משאב לא נמצא" },
  { code: "invalid_request", status: "400", desc: "בקשה לא תקינה" },
  { code: "rate_limited", status: "429", desc: "חריגה ממגבלת קריאות" },
]

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white" dir="rtl">
      <LandingHeader />

      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl translate-y-1/3 translate-x-1/3" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-1.5 text-sm font-mono">
              API v1.0
            </Badge>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              QuickShop
              <span className="text-emerald-400 block mt-2">Public API</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              REST API מלא לאינטגרציה עם חנויות QuickShop.
              <br />
              <strong className="text-white">הזמנות, מוצרים, מלאי ולקוחות - הכל בגישת API.</strong>
            </p>

            <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 font-mono">Base URL</span>
              </div>
              <code className="block text-lg font-mono text-emerald-400 select-all">
                https://my-quickshop.com/api/v1
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">התחלה מהירה</h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 text-blue-400 font-bold">1</div>
              <h3 className="text-lg font-bold mb-2">צרו API Key</h3>
              <p className="text-gray-400 text-sm">
                היכנסו לאדמין → Settings → API Keys ויצרו מפתח חדש עם ה-Scopes הרלוונטיים.
              </p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 text-emerald-400 font-bold">2</div>
              <h3 className="text-lg font-bold mb-2">הוסיפו את ה-Header</h3>
              <p className="text-gray-400 text-sm">
                כל קריאה דורשת Header בשם <code className="text-emerald-400">X-API-Key</code> עם המפתח שלכם.
              </p>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 text-purple-400 font-bold">3</div>
              <h3 className="text-lg font-bold mb-2">התחילו לבנות</h3>
              <p className="text-gray-400 text-sm">
                קראו את התיעוד המלא ותתחילו לבנות אינטגרציות מדהימות!
              </p>
            </div>
          </div>

          {/* Code Example */}
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <TerminalIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Example Request</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm" dir="ltr">
                <code className="text-gray-300">
{`curl -X GET "https://my-quickshop.com/api/v1/orders" \\
  -H "X-API-Key: qs_live_xxxxxxxxxxxxxxxxxxxx"`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">אימות (Authentication)</h2>
              <p className="text-gray-400">כל הקריאות דורשות API Key</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                Scopes זמינים
              </h3>
              <div className="space-y-3">
                {scopes.map((item) => (
                  <div key={item.scope} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <code className={`text-sm font-mono ${item.active ? 'text-emerald-400' : 'text-gray-500'}`}>{item.scope}</code>
                      {!item.active && (
                        <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">בקרוב</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <ZapIcon className="w-4 h-4 text-yellow-400" />
                  Rate Limiting
                </h4>
                <ul className="text-gray-400 text-sm space-y-2">
                  <li>• <strong className="text-white">100</strong> requests/minute per API key</li>
                  <li>• Header <code className="text-emerald-400">X-RateLimit-Remaining</code> - כמה קריאות נשארו</li>
                  <li>• Header <code className="text-emerald-400">X-RateLimit-Reset</code> - מתי יתאפס המונה</li>
                </ul>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <h4 className="font-bold mb-4">שגיאות נפוצות</h4>
                <div className="space-y-2">
                  {errorCodes.map((err) => (
                    <div key={err.code} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-red-400 w-8">{err.status}</span>
                      <code className="text-gray-500">{err.code}</code>
                      <span className="text-gray-400">- {err.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">Endpoints</h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {endpoints.map((category) => (
              <div key={category.category} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-slate-800">
                  <div className={`w-10 h-10 ${category.color} rounded-xl flex items-center justify-center`}>
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{category.category}</h3>
                </div>
                <div className="divide-y divide-slate-800">
                  {category.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 hover:bg-slate-800/50 transition-colors">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        item.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : 
                        item.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                        item.method === 'PATCH' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.method}
                      </span>
                      <code className="text-sm font-mono text-gray-300 flex-1">{item.path}</code>
                      <span className="text-sm text-gray-500">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">דוגמאות קוד</h2>
          
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Node.js */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <BracesIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-mono text-gray-400">Node.js</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm" dir="ltr">
                <code className="text-gray-300">
{`const API_KEY = 'qs_live_xxxx';
const BASE_URL = 'https://my-quickshop.com/api/v1';

async function getOrders() {
  const response = await fetch(\`\${BASE_URL}/orders\`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  
  const { data, meta } = await response.json();
  return data;
}

async function updateInventory(productId, adjustment) {
  const response = await fetch(\`\${BASE_URL}/inventory/\${productId}\`, {
    method: 'PATCH',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'product',
      adjustment,
    }),
  });
  
  return response.json();
}`}
                </code>
              </pre>
            </div>

            {/* Python */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <CodeIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-mono text-gray-400">Python</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm" dir="ltr">
                <code className="text-gray-300">
{`import requests

API_KEY = 'qs_live_xxxx'
BASE_URL = 'https://my-quickshop.com/api/v1'
HEADERS = {'X-API-Key': API_KEY}

def get_orders(page=1, limit=50):
    response = requests.get(
        f'{BASE_URL}/orders',
        headers=HEADERS,
        params={'page': page, 'limit': limit}
    )
    return response.json()['data']

def update_order_status(order_id, status):
    response = requests.patch(
        f'{BASE_URL}/orders/{order_id}',
        headers=HEADERS,
        json={'status': status}
    )
    return response.json()`}
                </code>
              </pre>
            </div>
          </div>

          {/* Create Product Example */}
          <div className="mt-10 max-w-5xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">יצירת מוצר עם תמונות</h3>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <PackageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-mono text-gray-400">POST /api/v1/products</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm" dir="ltr">
                <code className="text-gray-300">
{`// יצירת מוצר חדש עם הורדת תמונות לשרת
const response = await fetch('https://my-quickshop.com/api/v1/products', {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "מוצר לדוגמא",
    slug: "sample-product",
    description: "תיאור המוצר",
    price: "99.90",
    compare_price: "149.90",
    inventory: 100,
    track_inventory: true,
    category_ids: ["cat_123"],
    
    // תמונות - URL חיצוני
    images: [
      { url: "https://example.com/image1.jpg", alt: "תמונה ראשית", is_primary: true },
      { url: "https://example.com/image2.jpg" }
    ],
    
    // download_images: true = הורד וממיר ל-WebP ב-Vercel Blob
    // download_images: false (ברירת מחדל) = שמור URL כמו שהוא
    download_images: true
  })
});

// Response
{
  "success": true,
  "data": {
    "id": "prod_xxx",
    "name": "מוצר לדוגמא",
    "slug": "sample-product",
    "images": [
      { "id": "img_1", "url": "https://xxx.blob.vercel-storage.com/...", "is_primary": true }
    ]
  }
}`}
                </code>
              </pre>
            </div>
            <p className="text-center text-gray-500 mt-4 text-sm">
              💡 עם <code className="text-emerald-400">download_images: true</code>, תמונות יורדות → ממירות ל-WebP → עולות ל-Vercel Blob.
              <br />
              🎥 וידאו (<code className="text-emerald-400">media_type: &quot;video&quot;</code>) נשמר כ-URL כפי שהוא - שלחו URL מ-Cloudinary או מקור אחר.
            </p>
          </div>
        </div>
      </section>

      {/* Response Format */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-10 text-center">פורמט Response</h2>
          
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Success */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border-b border-slate-700">
                <CheckIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">Success Response</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm" dir="ltr">
                <code className="text-gray-300">
{`{
  "data": [
    {
      "id": "uuid",
      "order_number": "1001",
      "status": "processing",
      "total": 480.00,
      "created_at": "2026-01-06T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}`}
                </code>
              </pre>
            </div>

            {/* Error */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border-b border-slate-700">
                <span className="text-sm text-red-400">Error Response</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm" dir="ltr">
                <code className="text-gray-300">
{`{
  "error": {
    "code": "not_found",
    "message": "Order not found"
  }
}`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">מוכנים להתחיל?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            צרו חשבון מפתח, קבלו API Key והתחילו לבנות אינטגרציות מדהימות.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button href="/register?type=developer" variant="primary" size="lg">
              צרו חשבון מפתח
            </Button>
            <Button href="/for-developers" variant="outline" size="lg" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
              חזרה לדף מפתחים
              <ArrowLeftIcon className="mr-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}

