-- הוספת תפקיד סוכן (agent) ל-enum של תפקידי חנות
-- סוכן = עובד שמבצע הזמנות בקופה (POS)

ALTER TYPE store_role ADD VALUE IF NOT EXISTS 'agent';

