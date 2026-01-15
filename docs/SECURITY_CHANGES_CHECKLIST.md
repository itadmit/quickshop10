# 🔒 Security Changes - Pre-Production Checklist

## תאריך השינויים: 15.01.2026

---

## ✅ שינויים שבוצעו

### 1. Security Headers (next.config.ts)
- [x] X-Frame-Options: SAMEORIGIN
- [x] X-Content-Type-Options: nosniff  
- [x] Referrer-Policy
- [x] Content-Security-Policy
- [x] Strict-Transport-Security

### 2. HTML Sanitization
- [x] נוסף sanitize-html לתיאורי מוצרים
- [x] מסיר אוטומטית scripts ו-event handlers

### 3. Open Redirect Protection
- [x] Validation על callbackUrl בדפי login

### 4. SSRF Protection
- [x] Validation על URLs בייבוא תמונות

### 5. Race Condition Fixes
- [x] Atomic updates לקופונים
- [x] Atomic updates ל-credit balance
- [x] Atomic updates ל-gift cards

### 6. Data Exposure Fix
- [x] הסרת passwordHash מ-API responses

---

## 📋 בדיקות חובה לפני העלאה

### CSP - Content Security Policy
בדוק שאין שגיאות CSP ב-Console עבור:

- [ ] **עמוד בית החנות** - האם כל התמונות נטענות?
- [ ] **עמוד מוצר** - האם גלריית תמונות עובדת?
- [ ] **Checkout עם PayMe** - האם ה-script נטען?
- [ ] **Checkout עם Pelecard** - האם ה-iframe נטען?
- [ ] **reCAPTCHA** - האם עובד בדפי login?
- [ ] **Google Analytics** - האם נשלחים events?
- [ ] **Facebook Pixel** - האם עובד?

### HTML Sanitization
- [ ] **תיאורי מוצרים** - האם עדיין מוצגים נכון?
- [ ] **תיאורים עם עיצוב** (bold, italic, lists) - נשמרים?
- [ ] **לינקים בתיאורים** - עובדים?

### Login & Redirects
- [ ] **Login רגיל** - redirect לדשבורד עובד?
- [ ] **Login עם callbackUrl** - חוזר לעמוד הנכון?
- [ ] **Login לקוח** - redirect לחשבון עובד?

### תשלומים (קריטי!)
- [ ] **הזמנה עם קופון** - הקופון מוחל?
- [ ] **קופון עם הגבלת שימושים** - נספר נכון?
- [ ] **שימוש בקרדיט לקוח** - נוכה?
- [ ] **שימוש ב-Gift Card** - נוכה?
- [ ] **מלאי יורד** - אחרי הזמנה מאושרת?

### Admin
- [ ] **API /admin/users/[id]** - לא מחזיר passwordHash?
- [ ] **ייבוא מוצרים** - תמונות מ-URLs נטענות?

---

## 🚀 הוראות בדיקה

### בדיקת CSP בדפדפן:
1. פתח DevTools (F12)
2. לך ל-Console
3. רענן את הדף
4. חפש שגיאות שמתחילות ב-"Refused to load..."

### בדיקת Sanitization:
1. לך לעריכת מוצר
2. הוסף תיאור עם:
   - טקסט מודגש
   - רשימה
   - לינק
3. שמור וראה בחנות שהכל מוצג נכון

### בדיקת קופונים:
1. צור קופון עם הגבלת שימוש (לדוג' 3 שימושים)
2. בצע 4 הזמנות עם אותו קופון
3. וודא שבהזמנה הרביעית הקופון לא מתקבל

---

## ⚠️ דגשים לפרודקשן

### אם יש בעיה עם CSP:
ניתן להוסיף domains נוספים ב-`next.config.ts` בחלק של ה-CSP.

לדוגמה, להוסיף שירות חדש:
```typescript
// script-src - להוספת scripts חיצוניים
"script-src 'self' ... https://new-service.com",

// connect-src - להוספת API calls
"connect-src 'self' ... https://api.new-service.com",

// frame-src - להוספת iframes
"frame-src 'self' ... https://new-service.com",
```

### אם יש בעיה עם Sanitization:
הפונקציה `sanitizeProductDescription` בקובץ:
`src/lib/security/html-sanitizer.ts`

ניתן להוסיף tags מותרים ב-`allowedTags` array.

---

## 📞 תמיכה

אם יש בעיות בפרודקשן:
1. בדוק Console לשגיאות CSP
2. בדוק Network tab ל-requests חסומים
3. ניתן להסיר זמנית את ה-CSP header ב-next.config.ts לבדיקה

