Platforms and Marketplaces
We allow platforms and marketplaces to manage merchants. In order to accomplish this goal, we require the marketplace to collect certain details during a merchant's registration. Once the merchant is registered, the marketplace is required to convey the required information to us through a dedicated API. Upon completion, the API will return the new merchant information within the our system.

Default URLs
Upon creating your Merchant account with us, you will be required to provide a few default URLs for various calls. More examples can be found further in the documentation.

Environment	URL
Callback URL	Used for server-to-server responses regarding calls made to our API. These will be x-www-form-urlencoded formatted POST requests to the URL.
Return URL	IFRAME users only - We will redirect the customer to this URL after the sale is paid successfully. This is usually the success page. Those will be GET requests with parameters.


--
Create Seller
post
https://sandbox.payme.io/api/create-seller
Overview
Relevant only to PayMe's partners. This endpoint allows you to create a seller as one of PayMe's partners. You can find more information in the following guide - How to Create New Sellers.

Testing
For testing purposes you can use the following testing values:

Attributes	Value
seller_social_id	9999999999
seller_email	random@paymeservice.com Note that by using this email you will not receive any automatic emails sent from the system
seller_bank_code	54
seller_bank_branch	123 Any 3 digits
seller_bank_account_number	123456 Any 6 digits
Callback upon Seller creation or update
Once the Seller is created or updated, we will notify the marketplace with the Seller details with a POST request of type x-www-form-urlencoded to the marketplace Default Callback URL.

Request
Body

application/json

application/json
payme_client_key
string
required
PayMe Partner Key.

Example:
payme_key
seller_first_name
string
required
Seller's first name

Example:
FirstName
seller_last_name
string
required
Seller's last name

Example:
LastName
seller_social_id
string
required
Seller's social ID

Example:
564827517
seller_birthdate
string
required
Seller's personal birth date. ( dd/mm/yyyy structured)

Example:
01/01/2000
seller_social_id_issued
string
required
Seller's personal social ID issuing day.( dd/mm/yyyy structured)

Example:
18/08/1995
seller_gender
integer
required
Seller's gender ( 0- Male, 1- Female)

Allowed values:
0
1
seller_email
string
required
Seller's email address

Example:
random@payme.com
seller_phone
string
required
Seller's phone number

Example:
+9720520000000
seller_contact_email
string
Seller's contact email

Example:
test@example.com
seller_contact_phone
string
Seller's contact phone number that will be displayed to the buyers. If not stated, will be copied from seller_phone

Example:
+9720520000000
seller_bank_code
number
required
Seller's bank code (Israeli only) Please see the full list of banks here.

Example:
10
seller_bank_branch
number
required
Seller's bank branch code

Example:
100
seller_bank_account_number
string
required
Seller's bank account number

Example:
1111111
seller_description
string
required
Seller’s description, including offered product line and services. Limited to 255 characters.

Example:
An online store which specializes in smartphones
seller_site_url
string
required
Seller’s site URL.

Example:
www.smartphonesmartphones.com
seller_person_business_type
number
required
Business MCC (Merchant category code). List of codes here.

Example:
10010
seller_inc
number
required
Seller incorporation type (IL Only)
You can find all the seller incorporation types here.

Example:
1
seller_inc_code
string
Seller's business ID (ח.פ, ע.מ), required when seller_inc is not 1.

Example:
123456
seller_retail_type
number
Seller's retail type. (1 - Card not present (online) seller, 2 - Card present seller).

Example:
1
seller_merchant_name
string
required
Seller's merchant name, required when seller_inc is not 1.

Match pattern:
Smartphone expert
seller_address_city
string
required
Seller's business address - City.

Example:
Tel Aviv
seller_address_street
string
required
Seller's business address - Street.

Example:
Kaplan
seller_address_street_number
string
required
Street number

Example:
23
seller_address_country
string
required
Seller's business address - Country code according to the ISO 3166. You can fond all the country codes here.

Example:
IL
market_fee
number
A decimal between 0.00 and 60.00 representing the percent of the sale price that is collected for the marketplace (includes VAT). This fee is added on top of our fees and transferred to the marketplace once a month. Default value is 0

Example:
30.00
language
string
Changes the error message language to English. Default value is Hebrew (he).

Example:
he
seller_plan
string
A predefined set of settings for the seller. If required, this value will be provided by your Account Manager.

Example:
VPLN1495-705158GS-EHPNO6AP-8FQI54DF
seller_merchant_name_en
string
The seller's international name in English

Example:
Merchant Name
seller_additional_details
object
first_name
string
Seller's first name

Example:
John
last_name
string
Seller's last name

Example:
Smith
social_id
string
Seller's social ID

Example:
9999999999
type
array[number]
Possible Role. An individual can have multiple roles in a company.
You can find all the individual seller types here.

email
string
Seller's Email

Example:
email@domain.com
seller_dba
string
The seller's legal/registered name in Hebrew.

Example:
Name in Hebrew
seller_dba_en
string
The seller's legal/registered international name in English.

Example:
Name in English
Responses
200
500
OK

Body

application/json

application/json
status_code
number
Status of the request (0 - success, 1 - error)

Example:
0
seller_payme_id
string
The MPL the authorization will be given for

Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
seller_payme_secret
string
The seller's secret key

Example:
1QPaGXXXXXXXXXXXXXXvYnB
seller_public_key
object
PayMe seller's public key details

uuid
string
PayMe seller's public key

Example:
86e0bXXXXXXXXXXXXXXXXc54
description
string
PayMe seller's public key description

Example:
PayMe-Public-Key
is_active
boolean
Indicates if the public key is active or not (active = true)

seller_id
string
The seller's ID

Example:
123456
seller_dashboard_signup_link
string
Link for the signup process

Example:
https://www1-staging.isracard-global.com/update-details?t=ZXlKcGRpSTZJamR3XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

---

Update Seller
post
https://sandbox.payme.io/api/update-seller
Overview
Relevant only to PayMe's partners.

You can update your sellers information using the update-seller endpoint easily.

Testing
For testing purposes you can use the following testing values:

Attributes	Value
seller_social_id	9999999999
seller_email	random@paymeservice.com Note that by using this email you will not receive any automatic emails sent from the system
seller_bank_code	54
seller_bank_branch	123 Any 3 digits
seller_bank_account_number	123456 Any 6 digits
Callback upon Seller creation or update
Once the Seller is created or updated, we will notify the marketplace with the Seller details with a POST request of type x-www-form-urlencoded to the marketplace Default Callback URL.

Request
Body

application/json

application/json
payme_client_key
string
required
PayMe Partner Key.

Example:
payme_key
seller_payme_id
string
required
MPL. Your private key in PayMe system.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
seller_first_name
string
required
Seller's first name

Example:
FirstName
seller_last_name
string
required
Seller's last name

Example:
LastName
seller_social_id
string
required
Seller's social ID

Example:
999999999
seller_birthdate
string
required
Seller's personal birth date. ( dd-mm-yyyy structured)

Example:
01/01/2000
seller_social_id_issued
string
required
Seller's personal social ID issuing day.( dd-mm-yyyy structured)

Example:
18/08/1995
seller_gender
integer
required
Seller's gender ( 0- Male, 1- Female)

Allowed values:
0
1
seller_email
string
required
Seller's email address

Example:
test@example.com
seller_phone
string
required
Seller's phone number

Example:
+9720520000000
seller_contact_email
string
Seller's contact email

Example:
test@example.com
seller_contact_phone
string
Seller's contact phone number that will be displayed to the buyers. If not stated, will be copied from seller_phone

Example:
+9720520000000
seller_bank_code
number
required
Seller's bank code (Israeli only) Please see the full list of banks here.

Example:
10
seller_bank_branch
number
required
Seller's bank branch code

Example:
100
seller_bank_account_number
string
required
Seller's bank account number

Example:
1111111
seller_description
string
required
Seller’s description, including offered product line and services. Limited to 255 characters.

Example:
An online store which specializes in smartphones
seller_site_url
string
required
Seller’s site URL.

Example:
www.smartphonesmartphones.com
seller_person_business_type
number
required
Business MCC (Merchant category code). List of codes here.

Example:
1
seller_inc
number
required
Seller incorporation type (IL Only)
You can find all the seller incorporation types here.

Example:
1
seller_inc_code
string
Seller's business ID (ח.פ, ע.מ), required when seller_inc is not 1.

Example:
123456
seller_retail_type
number
Seller's retail type. (1 - Card not present (online) seller, 2 - Card present seller).

Example:
1
seller_merchant_name
string
required
Seller's merchant name, required when seller_inc is not 1.

Match pattern:
Smartphone expert
seller_address_city
string
required
Seller's business address - City.

Example:
Tel Aviv
seller_address_street
string
required
Seller's business address - Street.

Example:
Kaplan
seller_address_street_number
string
required
Street number

Example:
23
seller_address_country
string
required
Seller's business address - Country code according to the ISO 3166. You can fond all the country codes here.

Example:
IL
market_fee
number
A decimal between 0.00 and 60.00 representing the percent of the sale price that is collected for the marketplace (includes VAT). This fee is added on top of our fees and transferred to the marketplace once a month. Default value is 0

Example:
30.00
language
string
Changes the error message language to English. Default value is Hebrew (he).

Example:
he
seller_plan
string
A predefined set of settings for the seller. If required, this value will be provided by your Account Manager.

Example:
VPLNDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
seller_merchant_name_en
string
The seller's international name in English

Example:
Merchant Name
seller_additional_details
object
first_name
string
Seller's first name

Example:
John
last_name
string
Seller's last name

Example:
Smith
social_id
string
Seller's social ID

Example:
9999999999
type
array[number]
Possible Role. An individual can have multiple roles in a company.
You can find all the individual seller types here.

email
string
Seller's Email

Example:
email@domain.com
seller_dba
string
The seller's legal/registered name in Hebrew.

Example:
Name in Hebrew
seller_dba_en
string
The seller's legal/registered international name in English.

Example:
Name in English
Responses
200
500
OK

Body

application/json

application/json
status_code
number
Status of the request (0 - success, 1 - error)

Example:
0
seller_payme_id
string
The MPL the authorization will be given for

Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
seller_payme_secret
string
The seller's secret key

Example:
1QPaGXXXXXXXXXXXXXXvYnB
seller_public_key
object
PayMe seller's public key details

uuid
string
PayMe seller's public key

Example:
86e0bXXXXXXXXXXXXXXXXc54
description
string
PayMe seller's public key description

Example:
PayMe-Public-Key
is_active
boolean
Indicates if the public key is active or not (active = true)

seller_id
string
The seller's ID

Example:
123456
seller_dashboard_signup_link
string
Link for the signup process

Example:
https://www1-staging.isracard-global.com/update-details?t=ZXlKcGRpSTZJamR3XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX



---

Upload Seller Files
post
https://sandbox.payme.io/api/upload-seller-files
Overview
This endpoint is used to upload files of a seller.

You can find here the file types you can upload.

Uploading files can be done using one or both of the following formats:

URL of the file
Attribute	Description
name	social_id.pdf File name with extension
type	1 The document type code
url	https://www.mysite.com/files/social_id.pdf The URL of the file
mime_type	application/pdf The mime type of the file
base64 encoded file
Attribute	Description
name	social_id.pdf File name with extension
type	1 The document type code
base64	The base64 encoded file
mime_type	application/pdf The mime type of the file
Request
Body

application/json

application/json
payme_client_key
string
required
Your private key provided by us for authentication

Example:
XXXXXXXX
seller_payme_id
string
required
Our unique seller ID

Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
seller_files
array[object]
required
Array of files according to the format described below

name
string
required
File name with extension. Allowed file extensions: pdf, jpg, jpeg, png, bmp, tiff, doc, docx.

Example:
jpg
type
number
required
You can find here the file types you can upload.

Example:
1
url
string
File URL

Example:
https://example.com/file2
base64
string
The base64 encoded file

Example:
iVBORw0KGgoAAAANSUhEUgAABQsAAAFTCAYAAACeUVpKAAAABHNCSVQICAgIfAhkiAAAIABJREFUeJzs3Xd8FVX
mime_type
string
required
The mime type of the file. Most common mime types are supported, such as application/pdf, application/msword, image/png, image/jpg, image/jpeg, image/tiff, jfif.

Responses
200
500
OK

Body

application/json

application/json
status_code
number
Status of the request (0 - success, 1 - error)

Example:
0

---

Retrieve Seller's Additional Services Data
post
https://sandbox.payme.io/api/get-vas-seller
Overview
This endpoint is used to retrieve seller's additional services data.

Request
Body

application/json

application/json
payme_client_key
string
required
The PayMe client key

Example:
abc123-fdsv5846
seller_payme_id
string
required
The MPL of the seller

Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
Responses
200
OK

Body

application/json

application/json
responses
/
200
/
items[]
.
vas_data[]
status_code
integer
0 success 1 failrue

Example:
0
seller_payme_id
string
The MPL of the seller

Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
vas_payme_id
null
The VAS guid

items_count
integer
VASes count

Example:
10
items
array[object]
vas_description
string
The VAS description

Example:
Processing fee
vas_type
string
The VAS type

Example:
Settlements
vas_api_key
null
The VAS Guid

vas_is_active
boolean
Is the VAS active or not

vas_payer_type
integer
The payer type

Example:
2
vas_price_currency
string
VAS fee currency

Example:
ILS
vas_price_setup_fixed
integer
VAS setup price (fixed)

Example:
0
vas_price_periodic_fixed
integer
VAS periodic price (fixed)

Example:
0
vas_price_periodic_variable
string
VAS periodic price (fixed)

Example:
"0.00"
vas_price_usage_fixed
integer
VAS usage price (fixed)

Example:
0
vas_price_usage_variable
string
VAS usage price (fixed)

Example:
"0.00"
vas_market_fee
null
VAS market fee

vas_period
integer
VAS period	Code
Instant	1
Daily	2
Monthly	3
Yearly	4
Example:
1
vas_data
array[object]
Data that saved under the VAS


----

Withdraw Balance
post
https://sandbox.payme.io/api/withdraw-balance
Overview
This endpoint is used to generate a new request to withdraw balance.

Notes
Until we obtain and verify the 3 mandatory documents (Social Id, Bank, Corporate Certificate), funds will not be available for withdrawal to the Seller's bank account.
Partial-withdrawal - In order to create a partial-withdrawal, you will need to add another parameter to your request which states which transactions you are willing to get the balance for to your bank account.
Parameter	Description
transaction_ids	The transaction GUIDs that will be included as a part of your withdrawal request.
Withdrawal Callback Notification Types
Notification	Description
withdrawal-complete	A withdrawal was completed successfully
Attribute	Description
status_code	0 Status of the request (0 - success, 1 - error)
notify_type	withdrawal-complete
seller_payme_id	XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
tran_payme_code	123456 Our unique Withdrawal code
tran_created	2016-01-01 15:15:15
tran_type	40 Financial Transaction type Bank Withdrawal
tran_currency	USD
tran_total	10000
tran_description	`משיכה לבנק
Request
Body

application/json

application/json
payme_client_key
string
required
Your private key provided by us for authentication

Example:
XXXXXXXX
seller_payme_id
string
required
Our unique seller ID

Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
withdrawal_currency
string
required
Sale currency. 3-letter ISO 4217 name.

Example:
ILS
Match pattern:
USD
language
string
Changes the error message language to English. Default value is Hebrew (he)

Example:
he
transaction_ids
array[string]
The transaction IDs that will be used for the partial withdrawal request. Transaction guids can be fetched using our get-transcations API endpoint.
Example: TRANDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX

Responses
200
500
OK

Body

application/json

application/json
status_code
number
required
Status of the request (0 - success, 1 - error)

Example:
0


---
Get Seller Public Key
get
https://sandbox.payme.io/api/sellers/{seller_payme_id}/public-keys
Overview
This API endpoint will allow you as a partner to get the unique public keys used for various services in our system.

Request
Path Parameters
seller_payme_id
string
required
MPL. Your private key in PayMe system.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
Headers
PayMe-Partner-Key
string
required
The PayMe unique partner key.

Example:
XXXXXXXX
Responses
200
OK

Body
application/jsonapplication/xml

application/json
status_code
integer
Status code 0 - Success Status code 1 - Failure

Example:
0
page
integer
Page presented

Example:
1
items_total
integer
Total count of items

Example:
10
items_per_page
integer
Items per page count

Example:
10
seller_payme_id
string
The unique seller ID

Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
items
array[object]
uuid
string
The unique public key

Example:
BUYERKEY-XXXXXXXX-XXXXXXXX-XXXXXXXX
description
string
The public key title

Example:
public-key-title

---
Delayed Market Fee
patch
https://sandbox.payme.io/api/sales/{guid}/external-market-fee
Overview
This endpoint allows you to create a new charge (fee) that is connected to a sale and is limited by the transaction amount.

Limitations
You must include at least one of the following - market_fee_percentage or market_fee_fixed
The sale must be generated by the MPL
market_fee_percentage - can be from 0.0 to 60.0
market_fee_fixed - limited to the amount settled to the wallet and cannot be higher than that.
Request
Path Parameters
guid
string
required
Headers
PayMe-Merchant-Key
string
The MPL of the seller.

PayMe-Partner-Key
string
The partner secret key.

Body

application/json

application/json
market_fee_percentage
number
The percentage that will be charged. Limited to be between 0 to 60.

Example:
59.3
market_fee_fixed
integer
The fixed market fee - limited to the amount settled to the wallet.

Example:
1523
Responses
200
OK

Body

application/json

application/json
status_code
integer
0 - Sucess 1 - Failure

Example:
0
payme_status
string
The status of the action.

Example:
completed
payme_sale_id
string
The sale the fee was associated with.

Example:
SALEDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX


---

Business Fields
get
https://sandbox.payme.io/api/business-fields
Overview
This API endpoint retrieves a list of business fields, allowing users to sort and filter the data based on specific criteria.

Endpoint
GET /api/business-fields

Description
This endpoint provides access to a collection of business fields. It supports sorting by local name in either ascending or descending order.

Request Parameters
sort_by: Specifies the field by which the results should be sorted. In this case, it can be set to name_local for sorting by the local name of the business fields.
sort_direction: Determines the order of sorting. It accepts two values:
asc for ascending order.
desc for descending order.
Headers
PayMe-Partner-Key: This should be set to payme to authenticate the request.
Query Example
GET /api/business-fields?sort_by=name_local&sort_direction=desc HTTP/1.1
Host: test11.payme.io
PayMe-Partner-Key: payme
Response Structure
status_code: Indicates the status of the request. A value of 0 typically means success.
page: The current page number of the results.
items_per_page: The number of items per page.
items_total: The total number of items available.
language: The language of the returned data, indicated here as "he" (Hebrew).
items: A collection of business fields, where each field is represented as an object with the following properties:
code: A unique identifier for the business field.
name_intl: The international name of the business field.
name_local: The local name of the business field.
Response Example
{
    "status_code": 0,
    "page": 1,
    "items_per_page": 245,
    "items_total": 245,
    "language": "he",
    "items": {
        "244": {
            "code": 10565,
            "name_intl": "Shutters",
            "name_local": "תריסים"
        }
    }
}
Error Handling
In case of an error, the response will include a non-zero status_code and may include additional fields describing the error.

Notes
Ensure that the PayMe-Partner-Key header is included in each request for successful authentication.
The sort and filter capabilities of this endpoint can help in organizing and retrieving specific business field information efficiently.
Request
Body

application/json

application/json
GET /api/business-fields?sort_by=name_local&sort_direction=desc HTTP/1.1
Host: test11.payme.io
PayMe-Partner-Key: payme
Responses
default
Default

Body

application/json

application/json
status_code
integer
page
integer
items_per_page
integer
items_total
integer
language
string
items
object
244
object
code
integer
name_intl
string
name_local
string


----

Get Customer Details
get
https://sandbox.payme.io/api/buyers/{buyer_guid}
Overview
You can access and fetch your buyer's details using this API endpoint.

Your API request structure should look as follows:

https://<env>.payme.io/api/buyers/{buyer_guid}
The buyer guid is the unique ID fetched from either:

Capture Buyer Token API endpoint.
Tokens API endpoint.
Authentication
You'll need to authenticate your request using the unique seller ID.

Data
You'll be able to get the following data:

Card mask
Card brand
Card expiry date
Customer details
Limitations
If you are sending a token (uuid) and not a buyer key you won't get the parameter buyer_key in your response.
Request
Path Parameters
buyer_guid
string
required
Headers
PayMe-Merchant-Key
string
required
Your unique seller UUID.

Example:
BUYERDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
Responses
200
OK

Body

application/json

application/json
responses
/
200
/
buyer_key
uuid
string
Buyer uuid

Example:
2378d4c8-****-****-****-5f6abd091f1c
customer
object
Customer's details

name
string
Customer's name

Example:
John Doe
email
string
Customer's email

Example:
test@payme.io
phone
string
Customer's phone

Example:
+9720500000000
social_id
string
Customer's ID

Example:
999999999
payment
object
display
string
The payment method number

Example:
123456******1111
expiry
string
Buyer's card exp (MMYY).

Example:
0324
brand
string
Buyer's card brand.

Example:
AMEX
club
string
The credit card club

type
string
Type of credit card

Example:
Debit
organization
string
The credit card organization

origin_country
string
The credit card country

Example:
US
buyer_key
string
Buyer key

Example:
BUYERTEST-XXXXXXXX-XXXXXXXX-XXXXXXXX

Additional Services Enablement
post
https://sandbox.payme.io/api/vas-enable
Overview
This endpoint is used to enable additional services for a seller.

Request
Body

application/json

application/json
payme_client_key
string
required
Your private key provided by us for authentication

Example:
XXXXXXXX
seller_payme_id
string
required
Merchant's unique seller ID for correlation with us.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
vas_payme_id
string
required
VAS's unique ID.

Example:
VASLDEMO-VASLDEMO-VASLDEMO-1234567
Responses
200
500
OK

Body

application/json

application/json
responses
/
200
/
vas_data[]
status_code
integer
0 success 1 failrue

Default:
0
seller_payme_id
string
Merchant's unique seller ID for correlation with us.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
vas_payme_id
string
VAS's unique ID.

Example:
VASLDEMO-VASLDEMO-VASLDEMO-1234567
vas_description
string
Description of the value add service.

Example:
שירותי מקדמה (זיכוי מהיר ו\\או ניכוי)
vas_type
string
The type of the value add service.

Example:
Settlements
vas_name
null
The name of the value add service.

vas_api_key
null
The API key of the value add service.

vas_guid
string
The guid of the value add service.

Example:
VASLDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
vas_is_active
boolean
True = Active
False = Not active
vas_payer_type
integer
The payer type

Example:
2
vas_price_currency
string
VAS fee currency

Example:
ILS
vas_price_setup_fixed
integer
VAS setup price (fixed)

Example:
0
vas_price_periodic_fixed
integer
VAS periodic price (fixed)

Example:
0
vas_price_periodic_variable
string
VAS periodic price (fixed)

Example:
"0.00"
vas_price_usage_fixed
integer
VAS usage price (fixed)

Example:
0
vas_price_usage_variable
string
VAS usage price (fixed)

Example:
"0.00"
vas_market_fee
null
VAS market fee

vas_period
integer
VAS period	Code
Instant	1
Daily	2
Monthly	3
Yearly	4
Example:
1
vas_data
array[object]
Data that saved under the VAS


---

Additional Services Disable
post
https://sandbox.payme.io/api/vas-disable
Overview
This endpoint is used to disable additional services for a seller.

Request
Body

application/json

application/json
payme_client_key
string
required
Your private key provided by us for authentication

Example:
XXXXXXXX
seller_payme_id
string
required
Merchant's unique seller ID for correlation with us.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
vas_payme_id
string
required
VAS's unique ID of the desingated seller which you willing to disable the service for.

Example:
VASLDEMO-VASLDEMO-VASLDEMO-1234567
Responses
200
500
OK

Body

application/json

application/json
responses
/
200
/
vas_data[]
status_code
integer
0 success 1 failrue

Default:
0
seller_payme_id
string
Merchant's unique seller ID for correlation with us.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
vas_payme_id
string
VAS's unique ID.

Example:
VASLDEMO-VASLDEMO-VASLDEMO-1234567
vas_description
string
Description of the value add service.

Example:
שירותי מקדמה (זיכוי מהיר ו\\או ניכוי)
vas_type
string
The type of the value add service.

Example:
Settlements
vas_name
null
The name of the value add service.

vas_api_key
null
The API key of the value add service.

vas_guid
string
The guid of the value add service.

Example:
VASLDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
vas_is_active
boolean
True = Active
False = Not active
vas_payer_type
integer
The payer type

Example:
2
vas_price_currency
string
VAS fee currency

Example:
ILS
vas_price_setup_fixed
integer
VAS setup price (fixed)

Example:
0
vas_price_periodic_fixed
integer
VAS periodic price (fixed)

Example:
0
vas_price_periodic_variable
string
VAS periodic price (fixed)

Example:
"0.00"
vas_price_usage_fixed
integer
VAS usage price (fixed)

Example:
0
vas_price_usage_variable
string
VAS usage price (fixed)

Example:
"0.00"
vas_market_fee
null
VAS market fee

vas_period
integer
VAS period	Code
Instant	1
Daily	2
Monthly	3
Yearly	4
Example:
1
vas_data
array[object]
Data that saved under the VAS


--


Generate a Sale with 3D Secure
Export
v1.0
This endpoints enable using our frictionless 3D Secure authentication (version 2.2.0) on each sale.

Our 3DS service provides you the following advantages:

Enhanced Security - 3DS adds an extra layer of security, reducing fraud risk.
Reduced Chargebacks - Liability for fraudulent transactions shifts to the card issuer, minimizing losses for merchants.
Increased Customer Confidence: 3DS provides a secure payment experience, boosting customer trust.
Better Fraud Detection - 3DS systems employ advanced mechanisms to detect and prevent fraud.
Seamless Integration - 3DS service is integrated into existing payment systems and processes.
You can also get from us 3DS as a service, follow the link for more information - Standalone 3D Secure service.


Generate Sale with 3D Secure
post
https://sandbox.payme.io/api/generate-sale
Overview
In order to process sales with the 3D secure activated, please follow the next steps:

Make sure the service is enabeled for your partner account on PayMe's system.
Use generate-sale to send the request.
If you want to set specific rules for 3D secure initiation process, make sure you reach out to your onboarding manager and have them in place before inititating the transaction.
Create a sale with Dynamic 3DS
This option requires signup in advanced to the 3DS service. As part of generate-sale command, you can add the following object to the request:

"services": [
      {
    "name": "3DSecure",
    "settings": {
        "active": false
    }
      }
    ]
Redirecting When the Authentication Failed
If the user has failed on the authentication step (When a challenge is presented - 6 digit OTP that is sent to the card holder), a redirect will be initiated sending the user to PayMe's Hosted Payment Page for an additional try to input another credit card.

If you would like to avoid such cases and redirect the card-holder back to your own payment page, please include an additional parameter in your sale generating request (generate-sale) which is cancel_url.

Parameter Name	Type	Example
cancel_url	URL	https://payme.io
Request
Body
application/jsonapplication/xmlmultipart/form-data

application/json
seller_payme_id
string
required
Our unique seller ID

Example:
MPLXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
sale_price
number
required
Sale final price. For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075. Note that the minimum value is 500

Example:
10000
currency
string
required
Sale currency. 3-letter ISO 4217 name.

Example:
USD
product_name
string
required
Short name and description of the product/service. This text will be shown in the invoice as well, if the seller has enabled the invoices module in his account panel. Limited to 500 characters

Example:
Smartphone
transaction_id
string
Merchant's unique sale ID for correlation with us

Example:
12345
installments
string
required
Amount of installments for the sale. For additional information see Note 1 below

Example:
1
market_fee
number
A decimal between 0.00 and 60.00 representing the percent of the sale price that is collected for the marketplace (includes VAT). This fee is added on top of our fees and transferred to the marketplace once a month. Default value is the market fee of the Seller, as set upon Seller creation

Example:
2.5
sale_send_notifcation
boolean
Flag to send email and/or SMS notifications

sale_callback_url
string
Callback response to your page regarding call to our API. Default value is taken from the Merchant's settings. Note that you may not send a "localhost" URL as value

Example:
https://www.example.com/payment/callback
sale_email
string
In case sale send notification is true provide the address to send email notification

Example:
duckshop@example.com
sale_return_url
string
We will redirect the IFRAME and the buyer to this URL upon payment success. Default value is taken from the Merchant's settings

Example:
https://www.example.com/payment/success
sale_mobile
string
In case sale send notification is true, provide the phone number to send SMS notification, if the seller has enabled the SMS module in his account panel

Example:
123456789
sale_name
string
The name that will be displayed when sending a notification

Example:
John
capture_buyer
string
Flag for requesting the buyer's token for this payment (0 - do not capture token, 1 - capture token). For additional information see Tokens explanation below

Example:
0
buyer_key
string
Buyer key for an instant-payment with the token. This key is received through the use of capture_buyer. Note that this attribute cannot co-exist with the capture_buyer parameter in the same request

Example:
BUYERXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
buyer_perform_validation
boolean
Flag for performing an online validation of the card with the Issuer. Default value is true

sale_payment_method
string
Flag for performing an online validation of the card with the Issuer. Default value is true

Example:
credit-card
layout
string
IFRAME payment page layout. Optional attribute which may be used with "bit" sale_payment_method. Available layouts are: dynamic, qr-sms. Default value is dynamic

Example:
dynamic
language
string
Changes the language of the payment IFRAME to English, as well as the error messages. Default value is Hebrew (he)

Example:
En
services
object
name
string
Add 3D Secure

Example:
3D Secure
settings
object
Responses
200
500
Sale Created Successfully

Body

application/json

application/json
status_code
number
Status of the request (0 - success, 1 - error)

Example:
0
sale_url
string
The URL of the IFRAME secured payment form to display to the buyer

Example:
https://preprod.paymeservice.com/sale/generate/XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
payme_sale_id
string
Our unique sale ID

Match pattern:
SALEXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
payme_sale_code
number
Our unique sale code (for display purposes only)

Example:
12345678
price
number
Sale final price. For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075

Example:
1000
transaction_id
string
Merchant's unique sale ID for correlation with us

Example:
12345
currency
string
Sale currency. 3-letter ISO 4217 name.

Example:
ILS

--


Standalone 3D Secure service
Export
v1.0
You can utilize the standalone 3D Secure service provided by PayMe to perform 3D Secure authentication at a specific stage within your transaction workflow.

Typically, when a customer makes a purchase and you attempt to charge their payment card, they are prompted to complete 3D Secure authentication. However, there may be instances where you prefer to process 3D Secure as a separate step.

For more information, go to the 3D Secure as a Service Guide.

Process flow
1 - Please follow the instructions that can be found here.

2 - In order to use the 3DS service, you'll need to implement our library (as described in step 1 above) in your checkout page and collect the user data.

3 - Generate sale in order to get a payme_sale_id.

4 - Send the meta data to us as a part of the sales/{payme_sale_id}/3ds request.

5 - The 3DS service may prompt the cardholder to provide additional information or perform an action to validate their identity (a challenge).
5.a. - In case of a frictionless process (without a challenge) - You will receive a hash in the response.
5.b. - In case of a challenge - You will receive a callback with a link to the issuer website, with the result of the authentication process.

6 - Send the hash you received in the response/callback (in case there was a challange) as part of the Resolve Secured Hash API request to get the 3DS parameters (xid, eci, cavv).


---
Initialize 3DSecure Request
post
https://sandbox.payme.io/api/sales/payme_sale_id/3ds
This end-point is used for our MPI / 3D secure as-a-service funtionality.

If you wish to process transactions with a different gateway but wish to use PayMe's MPI capability - this end-point can be used to get 3DS values required for processing a 3DS sale.

Please follow the instructions that can be found here.

In order to the 3DS service, you'll need to implement our library in your checkout page and collect the user data, then send it to us as a part of the sales/{payme_sale_id}/3ds request.

The parameter that needs to be sent is the string you receive from the library after initiating the data collection action:

Paramter	Example	Comments
meta_data_jwt	eyJ0eXAiOiJKV1QiLCJh.......dyfwpbA	The JWT string received from the library.
Request
Headers
PayMe-Public-Key
string
Merchant's public key.

Match pattern:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
Body

application/json

application/json
payment
object
method
string
required
Payment method for 3DSecure. 3DSecure is a Credit Card module, thus is the only available method

Example:
credit-card
card_number
string
required
The card number to make authenticated payment uppon.

Example:
411111******11111
card_expiry
string
required
Card Expiry date. Format: mmyy

Example:
1223
customer
object
required
name
string
required
Card holder name.

Example:
John Johnny
email
string
required
Card holder email.

Example:
check@test.com
phone
string
required
Card holder mobile phone number.

Example:
+972503123123
zip_code
string
required
Card holder address zip code.

Example:
837592375
social_id
string
required
Card holder social id / national id.

Example:
123456782
meta_data_jwt
string
required
The user data collected from the browser. Must be encrypted by PayMe's service.

Example:
eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImN0eSI6Impzb24ifQ.eyJpYXQiOjE2NjU2NTExODMsIm5iZiI6MTY2NTY1MTE4MywiZXhwIjoxNjY1NjU0NzgzLCJqdGkiOiJjNjMyYTczZC1mNjhiLTRhNzAtOGQ0ZS01ZjRhN2U3MDM0M2YiLCJkYXRhIjp7ImlwIjoiMTQ3LjIzNS43My43MCIsImFjY2VwdCI6IipcLyoiLCJqYXZhRW5hYmxlZCI6ZmFsc2UsImphdmFTY3JpcHRFbmFibGVkIjp0cnVlLCJsYW5ndWFnZSI6ImVuLVVTIiwiY29sb3JEZXB0aCI6MjQsInNjcmVlbiI6eyJoZWlnaHQiOjg2NCwid2lkdGgiOjE1MzZ9LCJ0aW1lem9uZSI6LTE4MCwidXNlckFnZW50IjoibW96aWxsYVwvNS4wICh3aW5kb3dzIG50IDEwLjA7IHdpbjY0OyB4NjQpIGFwcGxld2Via2l0XC81MzcuMzYgKGtodG1sLCBsaWtlIGdlY2tvKSBjaHJvbWVcLzEwNi4wLjAuMCBzYWZhcmlcLzUzNy4zNiJ9fQ.LoOCGeVAPB1tN8No6y8ruohHaW9ZK1qVnrYek8vSwKZM_fzurku_48u4svCPVTgVxliHViFlfpJ0HdwbZXf1THZVivj0_S7rONtIflOPyNSftk8dLiYZh-wpY8pkAkfMk9MgsQ4rbGEVsAiH4w9Dj5ArZmzEUOO8l1uxI1fX9W67RxG_MhTeq4lRTiA6DHNoiR78H_FipZrIRvQ6cd8CNHteRYZ2j5GWw2l-uLa0e5Vui6oqY9jkmbikv31-aCBCnEL8Feq86qm0nVEOaaAts3My4YnOSRV7ncoWTXozUhuaCiW2pTpAvK9QmBytduWQSkY4WePujwSTr-JdyfwpbA
Responses
200
500
OK

Body

application/json

application/json
status_code
number
Status of the request (0 - success-redirect, 1 - error)

Example:
0
status_message
string
A message you may show to the buyer

Example:
Generating validation page, please wait
redirect_url
string
The URL we should redirect (GET method) to the user.

Example:
https://sandbox.paymeservice.com/3ds/redirect/{{sale payme id}}?pa={{CODE}}


Resolve Secured Hash
get
https://sandbox.payme.io/apisales/payme_sale_id/3ds/hash
This end-point is used for our MPI / 3D secure as-a-service funtionality.

You can use this endpoint in order to resolve the secured hash sent from PayMe.

Request
Headers
PayMe-Merchant-Key
string
The MPL of the seller.

Example:
MPL1585-FAIKE8234-63IHEFSB-ZQV9UAUX
Body

application/json

application/json
status_code
number
required
Status of the action (0 - success)

Example:
0
xid
string
The XID generated by the credit card issuer

Example:
NjZjYzUyZDJmMDQ0NDEzN2FiNGE
eci
string
The ECI generated by the credit card issuer

Example:
05
cavv
string
The CAVV generated by the credit card issuer

Example:
AAACBDaFQCAjBBUAJ4VAAAAAAAA=
payme_sale_id
string
PayMe unique sale ID

Example:
SALE1587-XXXXXXXX-XXXXXXXX-AJJTULHT
Responses
200
400
OK

Body

application/json

application/json
status_code
number
Status of the action (0 - success, 1 - failure)

payme_sale_id
string
PayMe unique sale ID

Example:
SALE1587-XXXXXXXX-XXXXXXXX-AJJTULHT


---

Create Document
post
https://sandbox.payme.io/api/documents
Overview
You can use our Invoices API to generate different documents to serve your business needs.

Document types
The documents you can generate can be found in the following guide - Document Types.

Request
Body

application/json

application/json
doc_type
number
required
The documents you can generate can be found in the following guide - Document Types.

Example:
100
buyer_name
string
required
Buyer's full name

Example:
John Doe
due_date
string
Payment due date

Example:
2021-08-16T 00:00:00.000Z
pay_date
string
The date the payment was completed (relevant for doc_type

Example:
2021-08-16T 00:00:00.000Z
doc_date
string
Document creation date

Example:
2021-05-25 00:00:00
currency
string
required
The currency of the document

Example:
ILS
doc_title
string
The title of the document (header)

Example:
Invoice for John Doe
doc_comments
string
Document description

Example:
Document description example
exchange_rate
number
Currency exchange rate

Example:
3.45
vat_rate
number
The VAT (Value Added Tax) rate applied

Example:
0.17
total_excluding_vat
number
Total amount before VAT applied

Example:
123
discount
number
The discount rate (percentage) applied to the document

Example:
0.5
total_sum_after_discount
number
Total amount with discount rate included

Example:
100
total_sum_after_discount - copy
number
Total amount with discount rate included

Example:
100
total_sum_including_vat
number
Total amount including VAT

Example:
100
total_paid
number
Total amount paid in this document

Example:
100
total_vat
number
Total VAT paid

Example:
100
language
string
Document language

Example:
he
items
array[object]
description
string
required
Description for item #1

Example:
Professional Services
unit_price
number
required
The price per unit (1 item)
unit_price or unit_price_with_vat is required.

Example:
100
vat_exempt
boolean
VAT exempt for the document

quantity
number
Item #1 quantity

Example:
3
unit_price_with_vat
number
Unit (item) price including VAT

Example:
100
currency
string
Currency for item #1
Sale currency. 3-letter ISO 4217 name.

Example:
ILS
exchange_rate
number
Exchange rate for the document

Example:
3.45
total_paid_including_vat
number
Total amount paid including VAT

Example:
100
cheques
array[object]
The amount paid using a Cheque

sum
number
required
The amount paid using Cheque

Example:
10
date
string
Cheque deposit date

Match pattern:
2021-05-16T00:00:00.000Z
bank
number
The bank number - You can check the list of banks for your convenience.

Example:
12
branch
number
The bank branch number

Example:
123
account
string
The bank account number

Example:
1234567
number
string
The Cheque number

Example:
0014555
cash
object
required
The cash method object

sum
number
required
The total amount paid using Cash

Example:
100
bank_transfer
object
required
The bank transfer object

sum
number
required
Total amount paid using a bank transfer

Example:
100
date
string
The date the bank transfer was received

Match pattern:
2021-05-16T00:00:00.000Z
account
string
The bank account number

Match pattern:
123456
paypal
object
The PayPal method object

sum
number
required
Total amount paid using Paypal

Example:
100
date
string
required
The date of when the payment was completed

Match pattern:
021-05-16T00:00:00.000Z
transaction_id
string
The external transaction ID (received from Paypal)

Match pattern:
021-05-16T00:00:00.000Z
buyer_name
string
The buyer's name

Match pattern:
John Doe
credit_card
object
The credit card object

sum
number
required
Total amount paid using a credit card

Example:
100
installments
number
The number of installments for the payment (1 min, 36 max)

Example:
1
first_payment
number
The amount paid in the 1st installment

Example:
25
buyer_key
string
If the invoice is paid using a token, buyer key is required

Example:
123456789
number
string
If paid without a token, card number is required

Example:
123456******12345
type
string
Card brand

Example:
Visa
cvv
string
Card's CVV (3-number code at the back of the card)

Example:
123
expiry
string
Expiry date of the card (MMYY)

Example:
0225
buyer_social_id
string
Buyer's social ID number

Example:
999999999
buyer_name
string
Buyer's full name

Example:
John Doe
auth_number
string
Authorization number of the payment

Example:
123123123
Responses
200
400
OK

Body

application/json

application/json
status_code
number
Status of the request (0 - success, 1 - error)

Example:
0
doc_type
string
The documents you can generate can be found in the following guide - Document Types.

Example:
100
language
string
Changes the language of the payment IFRAME to English, as well as the error messages. Default value is Hebrew (he)

Example:
he
due_date
string
The date on which a seller expects to receive payment from a buyer

Example:
04/25/2025
pay_date
string
Payment date

Example:
04/25/2025
doc_date
string
The date of document creation

Example:
04/25/2025
currency
string
Sale currency. 3-letter ISO 4217 name.

Example:
ILS
vat_rate
number
The VAT (Value Added Tax) rate applied.

Example:
0.17
discount
number
The discount rate (percentage) applied to the document

Example:
0.5
total_vat
number
Total VAT paid

Example:
100
doc_title
string
The title of the document (header)

Example:
Invoice for John Doe
buyer_name
string
The buyer's name

Example:
John Doe
total_paid
number
Total amount paid in this document

Example:
100
doc_comments
string
Document description

Example:
Document comments example
exchange_rate
number
Currency exchange rate

Example:
3.45
total_excluding_vat
number
Total amount before VAT applied

Example:
87
total_sum_including_vat
number
Total amount including VAT

Example:
100
total_sum_after_discount
number
Total amount with discount rate included

Example:
100
total_paid_including_vat
number
Total amount paid including VAT

Example:
100
cash
object
The cash method object

sum
number
The total amount paid using Cash

Example:
100
cheques
array[object]
The amount paid using a Cheque

sum
number
The amount paid using Cheque

Example:
10
date
string
Cheque deposit date

Example:
2021-05-16T00:00:00.000Z
bank
number
The bank number - You can check the list of banks for your convenience.

branch
number
The bank branch number

Example:
123
account
string
The bank account number

Example:
1234567
number
string
The Cheque number

Example:
0014555
bank_transfer
object
The bank transfer object

sum
number
Total amount paid using a bank transfer

Example:
100
date
string
The date the bank transfer was received

Example:
2021-05-16T00:00:00.000Z
account
string
The bank account number

Example:
123456
credit_card
object
The credit card object

sum
number
Total amount paid using a credit card

Example:
100
installments
number
The number of installments for the payment (1 min, 36 max)

Example:
1
first_payment
number
The amount paid in the 1st installment

Example:
25
number
string
If paid without a token, card number is required

Example:
123456******12345
type
string
Card brand

Example:
Visa
cvv
string
Card's CVV (3-number code at the back of the card)

Example:
123
buyer_social_id
string
Buyer's social ID number

Example:
999999999
buyer_name
string
Buyer's full name

Example:
John Doe
auth_number
string
Authorization number of the payment

Example:
123123123
expiry
string
Expiry date of the card (MMYY)

Example:
0225
paypal
object
The PayPal method object

sum
number
Total amount paid using Paypal

Example:
100
date
string
The date of when the payment was completed

Example:
021-05-16T00:00:00.000Z
transaction_id
string
The external transaction ID (received from Paypal)

Example:
021-05-16T00:00:00.000Z
buyer_name
string
The buyer's name

Example:
John Doe
items
array[object]
quantity
number
Item #1 quantity

Example:
3
description
string
Description for item #1

Example:
Professional Services
unit_price
number
The price per unit (1 item)

Example:
100
vat_exempt
boolean
VAT exempt for the document

currency
string
Currency for item #1
Sale currency. 3-letter ISO 4217 name.

unit_price_with_vat
number
Unit (item) price including VAT

Example:
100
exchange_rate
number
Exchange rate for the document

Example:
3.45
doc_id
string
Document ID number

Match pattern:
XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
doc_url
string
Document URL

Match pattern:
https://document.url.com/documents/ID

---

Get Generated Document By ID
get
https://sandbox.payme.io/api/documents/document_id
Overview
In order to query for existing documents, you will need to use the following endpoint and parameters:

Environment	URL
Staging	https://sandbox.payme.io/api/documents?page=0&limit=5&field=createdAt&sort=desc
Production	https://live.payme.io/api/documents?page=0&limit=5&field=createdAt&sort=desc
Header
Parameter	Description
PayMe-Merchant-Key	Seller's MPL DEMOMPL-DEMOMPL-DEMOMPL-DEMOMPL-
Request Example:
Item	Description	Example
URL	https://sandbox.payme.io/api/documents/{document_ID}	INV12321*****
Header	seller_payme_id	MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
Request
Headers
PayMe-Merchant-Key
string
required
Example:
DEMOMPL-DEMOMPL-DEMOMPL-DEMOMPL

--



Query Existing Documents
get
https://sandbox.payme.io/api/documents?page=0&limit=5&field=createdAt&sort=descs
Overview
In order to query for existing documents, you will need to use the following endpoint and parameters:

Environment	URL
Staging	https://sandbox.payme.io/api/documents?page=0&limit=5&field=createdAt&sort=desc
Production	https://live.payme.io/api/documents?page=0&limit=5&field=createdAt&sort=desc
Header
Parameter	Description
PayMe-Merchant-Key	Seller's MPL MPL15991-38967CJU-GSBK5E1G-XSZ1GZXU
Request
Query Parameters
field
any
The dates the query is for

Allowed value:
createdAt
limit
number
How many documents per extraction

page
number
How many pages should be included in the query

sort
string
The order of documents

Allowed values:
desc
asc
Headers
PayMe-Merchant-Key
string
Example:
MPL15991-38967CJU-GSBK5E1G-XSZ1GZXU
Match pattern:
MPL15991-38967CJU-GSBK5E1G-XSZ1GZXU