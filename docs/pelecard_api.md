# Pelecard API — מדריך מלא לקורסור (Iframe/Redirect + Services REST)

מסמך זה מסכם את ה־API של Pelecard משני מסמכי ה־PDF:
- **Iframe/Redirect – Interface Document** (PaymentGW)
- **Services ReST API – Programmer Manual** (services)

המטרה: שיהיה לך Reference אחד מסודר שמכסה:
- Base URLs (Prod/Sandbox)
- זרימות עבודה (Init → תשלום → קבלת תוצאה)
- כל האנדפוינטים + דוגמאות request/response
- מילון פרמטרים מרכזי (מה חובה, מה אופציונלי, מה מחזיר)

---

## 0) Base URLs

### Production
- Payment Gateway (Iframe/Redirect):
  - `https://gateway21.pelecard.biz/PaymentGW/init`
  - `https://gateway21.pelecard.biz/PaymentGW/GetTransaction`
  - `https://gateway21.pelecard.biz/PaymentGW/ValidateByUniqueKey`
- Services REST:
  - `https://gateway21.pelecard.biz/services`
  - לדוגמה: `https://gateway21.pelecard.biz/services/DebitRegularType`

### Sandbox / Developers
- Services Sandbox (לפי המסמך):
  - `https://gateway21.pelecard.biz/SandboxServices`
- Sandbox landing example:
  - `https://gateway21.pelecard.biz/sandbox/landingpage`

> הערה: בדוק אצל Pelecard את פרטי הסנדבוקס המדויקים (יוזר/סיסמה/מספר טרמינל).

---

## 1) Authentication / Credentials (משותף לשני ה־APIs)

ברוב הקריאות תופיע שלישיית הזיהוי:
- `terminal` / `terminalNumber` — מספר מסוף/טרמינל
- `user` — שם משתמש
- `password` — סיסמה

בד"כ זה נשלח כחלק מה־JSON.

---

## 2) Iframe/Redirect (PaymentGW) — זרימת עבודה

### תרשים זרימה (פשטני)
1. **Init** — שולחים JSON ל־`PaymentGW/init`
2. מקבלים בתגובה **URL** (מכיל TransactionId) + לפעמים ValidationString
3. מציגים ללקוח את עמוד התשלום בתוך:
   - Iframe (Embedded), או
   - Redirect (עמוד חדש)
4. הלקוח ממלא פרטי כרטיס ולוחץ Pay
5. בסוף התהליך מתקבל:
   - Redirect ל־`GoodURL` / `ErrorURL` / `CancelURL`
   - ו/או Callback לשרת שלך (תלוי בפרמטרים)
6. כדי לוודא תוצאה בצד שרת → משתמשים ב־`GetTransaction` (ואפשר גם ValidateByUniqueKey לפי הצורך)

---

## 3) PaymentGW/init

### Endpoint
`POST https://gateway21.pelecard.biz/PaymentGW/init`

### מה זה עושה
מכין טרנזקציה ומחזיר URL לתצוגת דף התשלום (Iframe/Redirect).

### Content-Type
במסמך מופיעים שימושים בסגנון:
- `application/x-www-form-urlencoded` (כאשר שולחים JSON כמחרוזת בשדה), וגם
- לעיתים עובדים ישירות כ־JSON.
הכי נכון: לעבוד לפי דוגמת ה־Sandbox שלך (המסמך מדגיש “build JSON in same structure as sandbox”).

### דוגמת JSON (Init Request)
```json
{
  "terminal": "0882577012",
  "user": "xxxxx",
  "password": "xxxxx",

  "GoodURL": "https://your-domain.com/pay/ok",
  "ErrorURL": "https://your-domain.com/pay/error",
  "CancelURL": "https://your-domain.com/pay/cancel",

  "ActionType": "J4",
  "Currency": "1",
  "Total": "100",

  "CreateToken": "True",
  "Language": "HE",

  "CustomerIdField": "must",
  "Cvv2Field": "must",

  "MaxPayments": "12",
  "MinPayments": "1"
}


פרמטרים חשובים ב־Init

GoodURL — לאן מפנים במקרה הצלחה

ErrorURL — לאן מפנים במקרה כשלון

CancelURL — לאן מפנים בביטול

ActionType — סוג פעולה (חיוב/אימות וכו’). נפוצים:

J4 — חיוב (Debit)

J5 — אישור/Authorization (משמש גם עם CreateToken ואז משלימים ב־Services)

(ייתכנו נוספים לפי ההגדרות אצל Pelecard)

Currency

1 = ILS (שקל) (לפי המסמך מופיע Currency=1)

Total — סכום

CreateToken — האם ליצור Token

Language — HE/EN וכו’

MaxPayments / MinPayments — שליטה בתשלומים

CustomerIdField / Cvv2Field

must = חובה

Response (מה מצפים לקבל)

המסמך מציין שמקבלים חזרה URL עם TransactionId.
ברוב אינטגרציות Pelecard מתקבל אובייקט הכולל שדות בסגנון:

transactionID

url

ValidationString (אם קיים באותה תצורה)

בפועל: הדבק את ה־response מהסנדבוקס שלך כאן כדי לנעול 100% את המבנה.

4) הצגת דף התשלום (Iframe / Redirect)

אחרי Init:

אם Redirect: פותחים את ה־URL בדפדפן

אם Iframe: משבצים את ה־URL בתוך <iframe src="...">

יש פרמטרים שמשפיעים כמו:

feedbackOnTop / “הצגת דף נחיתה בתוך iframe או חלון חדש”

FeedbackDataTransferMethod — האם החזרה ל־GoodURL תהיה GET או POST

כלל אצבע: אם האתר שלך ב־SSL אפשר יותר אופציות (המסמך מציין שאם הלקוח עובד SSL אפשר להציג landing בתוך iframe; אחרת תמיד עמוד חדש).

5) PaymentGW/GetTransaction
Endpoint

POST https://gateway21.pelecard.biz/PaymentGW/GetTransaction

מה זה עושה

מקבל פרטי טרנזקציה לפי TransactionId.
מתאים לאימות שרת-לשרת לאחר סיום התשלום (במיוחד כדי לא לסמוך רק על Redirect/QueryString).

Request Example
{
  "terminal": "1234567",
  "user": "JohnDoe",
  "password": "132456789",
  "TransactionId": "1a5b1c-1d1f6g-9h8j"
}

Response (שדות אופייניים)

בדרך כלל תקבל:

סטטוס פעולה (כגון PelecardStatusCode או StatusCode)

פרטי שובר/אישור (Voucher/Approval)

סכום, מטבע, תשלומים

Token (אם נוצר)

פרטי שגיאה אם נכשל

בפועל המבנה משתנה לפי תצורת הטרמינל וה־ActionType.

6) PaymentGW/ValidateByUniqueKey
Endpoint

POST https://gateway21.pelecard.biz/PaymentGW/ValidateByUniqueKey

מה זה עושה

מנגנון אימות/ולידציה לפי מפתח ייחודי (UniqueKey).
מומלץ להשתמש אם אתה מקבל מהלקוח/מהסשן Key ייחודי לתשלום ורוצה לאשר בצד שרת.

המבנה המדויק תלוי בהגדרת “UniqueKey/UserKey” אצלך.
במסמך מופיע המונח UserKey: מזהה ייחודי שאתה שולח/מקבל כדי לזהות טרנזקציה אצלך.

7) הערות מיוחדות: Google Pay / 3DS / Token flow

מהמסמך:

Google Pay יופיע רק במובייל עם Wallet תומך NFC

לעבודה ב־iframe מול Google Pay צריך לשלב allowpaymentrequest ב־iframe

אין אופציה ליצור Token עם ActionType מסוים ואז לבצע רכישה עתידית ב־REST עם אותו Token (יש מגבלות)

פתרון מוצע:

לבצע Authorization ב־Iframe עם ActionType=J5 ו־CreateToken=True

להשלים/לחייב בפועל ב־Services API באחד מה־Endpoints (למשל DebitRegularType או אחרים), באמצעות Token + מזהים/אישור

Endpoints שהמסמך מזכיר כמסיימי פעולה (בהקשר הזה):

CompleteDebitByUid (אם קיים אצלך בגרסה—לא מופיע ברשימת ה־services שנשלפה מהמסמך שקיבלתי, אז ודא מול Pelecard)

DebitRegularType

DebitPaymentsType (כאשר האישור ב־Iframe נעשה על “תשלומים”)

PART B — Services REST API (gateway21.pelecard.biz/services)
8) כללי
Base

https://gateway21.pelecard.biz/services

פורמט

JSON requests

בדוגמאות יש שימוש ב־curl/PHP/.NET

Error Codes (נפוצים)

033/039 — מספר כרטיס לא תקין

036 — כרטיס פג תוקף
(המסמך ממליץ “לבקש מהמשתמש להקליד שוב פרטים”)

יש גם “Common errorCodes” רבים נוספים (500–599 וכו’) — מומלץ לשמור כמיפוי UI/לוגים.

9) רשימת ה־Endpoints (Services)

המסמך כולל בין היתר:

חיוב (Debit)

DebitRegularType

DebitPaymentsType

DebitCreditType

DebitIsracreditType

DebitByIntIn (לפי המסמך)

אישור (Authorize / PreAuth)

AuthorizeCreditCard

AuthorizeCreditType

AuthorizePaymentsType

AuthorizeIsracreditCard

טוקנים

ConvertToToken

ניהול/מידע/דוחות

DeleteTran

GetTransData

GetTransDataBc

GetTransDataBeforeBc

GetTransDataByRicuzNo

GetCompleteTransData

GetBroadcast

GetBroadcastsByDate

GetSapakNo

GetTerminalName

GetTerminalMuhlafim

GetCompanyPhoneNo

GetStatisRecord

GetErrorMessageHe

GetErrorMessageNe

CheckGoodParamX

10) DebitRegularType
Endpoint

POST https://gateway21.pelecard.biz/services/DebitRegularType

תיאור

חיוב כרטיס “רגיל” (Debit) לפי ההסכמים/מסלולים של בית העסק.

Request (מבנה טיפוסי)
{
  "terminalNumber": "0962210",
  "user": "peletest",
  "password": "XXXXXXX",
  "shopNumber": "001",
  "StationNumber": "1",

  "creditCard": "4580000000000000",
  "creditCardDateMmyy": "0128",
  "cvv2": "123",

  "total": "100",
  "currency": "1",

  "num_of_payments": "1",
  "first_payment_total": "0",
  "fixed_payment_total": "0",

  "CustomerId": "12345",
  "AdditionalDetailsParamX": "test"
}

Response (טיפוסי)
{
  "StatusCode": "000",
  "ErrorMessage": "operation success",
  "PelecardTransactionId": "254379669",
  "VoucherId": "86-001-008",
  "ShvaResult": "000",
  "ShvaFileNumber": "86",
  "StationNumber": "1"
}


הערה: המסמך מערבב גם יצירת מסמך/חשבונית (EzCount/Payper) בפרמטרים. אם אתה משתמש בזה—ראה סעיף “Invoice parameters”.

11) DebitPaymentsType
Endpoint

POST https://gateway21.pelecard.biz/services/DebitPaymentsType

תיאור

חיוב בתשלומים.

Request (דגשים)

בדומה ל־DebitRegularType, אבל חייב:

num_of_payments > 1

ולעתים חלוקה של FirstPaymentTotal / FixedPaymentTotal

12) DebitCreditType / DebitIsracreditType
Endpoints

POST https://gateway21.pelecard.biz/services/DebitCreditType

POST https://gateway21.pelecard.biz/services/DebitIsracreditType

תיאור

חיוב לפי “סוג אשראי/חברת אשראי/הסכמים מיוחדים” (כמו ישראכרט/מסלולים).

שימוש נכון תלוי באיזה מסלול סליקה יש לך בפועל (CAL/Isracard/Amex וכו’).

13) Authorize* (PreAuth)
מטרת Authorize

לקבל אישור (Authorization) בלי לחייב בפועל (או חלק מזרימה דו-שלבית).
שימושי במיוחד כשאתה רוצה:

לשמור Token

או לחייב מאוחר יותר (Capture) דרך ה־Services endpoints

Endpoints

AuthorizeCreditCard

AuthorizeCreditType

AuthorizePaymentsType

AuthorizeIsracreditCard

Output טיפוסי

בדומה לדביט: StatusCode, ErrorMessage, מזהה טרנזקציה/אישור וכו’.

14) ConvertToToken
Endpoint

POST https://gateway21.pelecard.biz/services/ConvertToToken

תיאור

המרה/שימוש בטוקן (לפי ההגדרה בטרמינל).
בדרך כלל משתמשים בזה כדי:

להפוך נתון/כרטיס לטוקן

או לעבוד עם טוקנים שכבר נוצרו מה־Iframe/Redirect

15) DeleteTran
Endpoint

POST https://gateway21.pelecard.biz/services/DeleteTran

תיאור

מחיקה/ביטול טרנזקציה (בכפוף למדיניות Pelecard והסכמי הסליקה).
בד"כ דורש מזהי טרנזקציה/שובר.

16) GetTransData* / GetCompleteTransData
תיאור

משפחה של endpoints לשליפת נתוני עסקאות לפי סוגי פילטורים:

GetTransData

GetTransDataBc

GetTransDataBeforeBc

GetTransDataByRicuzNo

GetCompleteTransData

בדרך כלל תשלח:

credentials

פרמטרי חיפוש (תאריכים/מספרי שובר/מספר ריכוז וכו’)

17) GetErrorMessageHe / GetErrorMessageNe
תיאור

המרת קוד שגיאה לטקסט (עברית/אנגלית/נייטיב).

18) Broadcast / Terminal / Supplier helpers

GetBroadcast, GetBroadcastsByDate — מידע/דוחות broadcast

GetTerminalName, GetTerminalMuhlafim — מידע על טרמינלים

GetSapakNo — מספר ספק

GetCompanyPhoneNo — טלפון חברה

GetStatisRecord — נתון סטטיסטי (לפי הגדרה)

PART C — מילון פרמטרים מרכזי (Appendix style)
19) שדות חובה נפוצים (ברוב ה־Endpoints)

terminal / terminalNumber

user

password

20) שדות כרטיס (כאשר לא משתמשים בטוקן)

creditCard — מספר כרטיס

creditCardDateMmyy — תוקף בפורמט MMYY (המסמך מציין במפורש)

cvv2

21) סכומים/מטבע

total / Total

currency / Currency

במסמך מופיע 1 כשקל (ILS)

22) תשלומים

num_of_payments

first_payment_total

fixed_payment_total

23) Credit Types / Brand / Abroad (מהמסמך בעמודי appendix)

המסמך מפרט ערכים לסוגי אשראי, למשל:

Credit types:

2 – Isracredit / Amex credit / Visa preferred (+30) / Diners preferred (+30)

3 – Immediate debit

4 – Club credit

5 – Super credit

6 – Credit/Regular payments credit

8 – Payments

9 – Payments club deal

CreditCardAbroadCard:

0 – Israeli

(יש גם אופציות לכרטיס חו״ל בהתאם למסמך/טרמינל)

בפועל: לא כל בית עסק צריך לשלוח את זה ידנית—חלק נגזר מהטרמינל והסליקה.

PART D — דוגמאות CURL (מומלץ לקורסור)
24) Init (PaymentGW)
curl -X POST "https://gateway21.pelecard.biz/PaymentGW/init" \
  -H "Content-Type: application/json" \
  -d '{
    "terminal":"0882577012",
    "user":"xxxxx",
    "password":"xxxxx",
    "GoodURL":"https://your-domain.com/pay/ok",
    "ErrorURL":"https://your-domain.com/pay/error",
    "CancelURL":"https://your-domain.com/pay/cancel",
    "ActionType":"J4",
    "Currency":"1",
    "Total":"100",
    "CreateToken":"True",
    "Language":"HE",
    "CustomerIdField":"must",
    "Cvv2Field":"must",
    "MaxPayments":"12",
    "MinPayments":"1"
  }'

25) GetTransaction
curl -X POST "https://gateway21.pelecard.biz/PaymentGW/GetTransaction" \
  -H "Content-Type: application/json" \
  -d '{
    "terminal":"1234567",
    "user":"JohnDoe",
    "password":"132456789",
    "TransactionId":"<TRANSACTION_ID>"
  }'

26) DebitRegularType
curl -X POST "https://gateway21.pelecard.biz/services/DebitRegularType" \
  -H "Content-Type: application/json" \
  -d '{
    "terminalNumber":"0962210",
    "user":"peletest",
    "password":"XXXXXXX",
    "shopNumber":"001",
    "StationNumber":"1",
    "creditCard":"4580000000000000",
    "creditCardDateMmyy":"0128",
    "cvv2":"123",
    "total":"100",
    "currency":"1",
    "num_of_payments":"1",
    "first_payment_total":"0",
    "fixed_payment_total":"0",
    "AdditionalDetailsParamX":"test"
  }'

PART E — Best Practices
27) אל תסמוך רק על Redirect

תמיד בצע אימות שרת-לשרת:

או PaymentGW/GetTransaction

או endpoint אימות אחר לפי המפתח שקיבלת (ValidateByUniqueKey / UserKey)

28) לוגים

שמור אצלך לכל תשלום:

מזהה פנימי שלך (OrderId)

TransactionId של Pelecard

StatusCode + ErrorMessage

Voucher/Approval numbers

29) אבטחה

אל תשמור כרטיס מלא/ cvv

אם צריך חיוב חוזר → השתמש Tokenization בהתאם להרשאות הטרמינל