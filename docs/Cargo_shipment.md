Cargo
Introduction
CARGO API is an API that conects you directlly to shipping services CARGO courier provides CARGO has plugins for the standard Ecommerce systems - please contact our customer support for more information

!!! IMPORTANT !!!

Every store/customer should have it's own API token in order to make request. You can generate it in you cargo dashboard profile, or request token from the support. The one that used in this documentation is made only for testing purpose. and all shipments from it will not be accepted.

Reference
Create Shipment
Create Shipment
This request is for creating shipment using parameters listed below.

Name	Data Type	Required	Description
shipping_type	integer	yes	parameter for type of delivery
1 - delivery
2 - pickup
3 - transfer
number_of_parcels	integer	no	number of packages (default 0)
spli_packages	boolean	no	if set to true will create as many shipments as you set in number_of_parcels parameter
barcode	string,array	no	barcode strng. for multiple split by comma or send as array of barcodes
double_delivery	integer	yes	1 - regular, 2 - deliver something and pickup
total_value	float	no	total order value
transaction_id	string	no	order id/transaction id
optional but highly recommend
can be used for tracking
cod_type	integer	no	Cash on delivery type
0 = Cash
1 = Cashier's check,
2 = Check,
3 = All Payment Methods
cash_on_delivery	float	no	here should be the value of the order e.g. 350.5
carrier_id	integer	yes	shipping method
0 - box shipment
1 - express (default)
order_id	string	no	extra identifier
notes	string	no	Notes to the order will be displayed on label
website	string	no	domain, website link
customer_code	integer	yes	your customer code given by cargo
box_point_id	integer	no	in case of box shipment paste point id.
if carrier_id = 0 and this parameter is not set
point will be chosen based on the recepient address
to_address	object	yes	recipient address
to_address.street1	string	yes	recipient street name/both street name and street number
to_address.street2	string	no	recipient street number
to_address.city	string	yes	recipient city
to_address.name	string	no	recipient name
to_address.company	string	no	recipient company
to_address.phone	string	yes	Recommended. recipient phone number
to_address.email	string	no	recipient email
to_address.floor	string	no	recipient floor
to_address.apartment	string	no	recipient apartment
to_address.entrance	string	no	recipient entrance
from_address	object	yes	sender address
from_address.street1	string	yes	sender street name/both street name and street number
from_address.street2	string	no	sender street number
from_address.city	string	yes	sender city
from_address.name	string	no	sender name
from_address.company	string	no	sender company
from_address.phone	string	yes	Recommended. sender phone number
from_address.email	string	no	sender email
from_address.floor	string	no	sender floor
from_address.apartment	string	no	sender apartment
from_address.entrance	string	no	sender entrance
201 Created
Get Status
Get shipment status
This request is built for getting shipment status

Parameters

Name	Data Type	Required	Description
shipment_id	integer	yes	trackin number that you receive from create shipment request
customer_code	integer	yes	customer code you used in the create shipment request
Shipment Statuses

Status Code	Description
1	Open
2	Transferred to courier
3	Done
4	Collected by CARGO
5	Return from a double
7	Execution approved
8	Cancelled
9	Second delivery
12	Pending shipping
25	במחסן
50	בדרך למסירה
51	On the way to Delivery point
52	Delivery point
55	In Delivery point
201 Created
Update Status
Update status
This request is built for updating shipment status

Parameters

Name	Data Type	Required	Description
shipment_id	integer	yes	trackin number that you receive from create shipment request
customer_code	integer	yes	customer code you used in the create shipment request
status_code	integer	yes	status code from the table below
Shipment Statuses

Status Code	Description
1	Open
2	Transferred to courier
3	Done
4	Collected by CARGO
5	Return from a double
7	Execution approved
8	Cancelled
9	Second delivery
12	Pending shipping
25	במחסן
50	בדרך למסירה
51	On the way to Delivery point
52	Delivery point
55	In Delivery point
201 Created
Print Label
Print Label
This request is built for printing labels. sinle or multiple

Parameters

Name	Data Type	Required	Description
shipment_ids	array/integer	yes	trackin numbers that you receive from create shipment request
format	string	no	options 'zpl', 'pdf', 'base64' default 'pdf'
encoding	string	no	put 'base64' in case you need bace64 encoded string return
shipments_data	array	no	array of object in case you want to print products on you label
shipments_data.shipmentId	integer	yes	tracking id that products listed below related
shipments_data.products	array	yes	array of products you need to display on label
shipments_data.products.title	string	no	product title
shipments_data.products.quantity	string	no	product quantity
shipments_data.products.item_price	string	no	product price
201 Created
Print Label A4
Print Label A4
This request is built for printing labels. sinle or multiple in a4 with ability to choose starting point.

Parameters

Name	Data Type	Required	Description
shipment_ids	array/integer	yes	trackin numbers that you receive from create shipment request
starting_point	integer	no	starting position of labels to print 8 per sheet, 2 per row, starting from right to left.
e.g. if you place number 4 it will start printing from the second row, left side.
default is 1 which is top right corner.
201 Created
Get pickup points
Get pickup points
This request is built to get pickup points for box shipment.

201 Created
Find closest points
Find closest points
This request is built to get pickup points for box shipment. You can find closest points by latitude longitude and radius in KM from the point you want.

Name	Data Type	Required	Description
latitude	float	yes	latitude of the point you want to look for
longitude	float	yes	longitude of the point you want to look for
radius	integer	no	radius in km from the point you set above. default 5
200 OK
Webhook create
Webhook create
This request will push your webhook to oour system so you can receive status updates to your endpoint. If oyu already have webhook created, it will not create new one, but will return the existing webhook. Only 1 webhook allowed by combination of type and customer code.

Name	Data Type	Required	Description
type	String	yes	'status-update' - the only allowed value
customer_code	integer	yes	Your customer code provided by cargo
webhook_url	string	yes	your endpoint where you want to receive data e.g. https://yourdomain.com/status-update
201 Created
Webhook update
Webhook update
This request will update your webhook.

Name	Data Type	Required	Description
id	integer	yes	Id of webhook that was returned in create request
type	String	yes	'status-update' - the only allowed value
customer_code	integer	yes	Your customer code provided by cargo
webhook_url	string	yes	your endpoint where you want to receive data e.g. https://yourdomain.com/status-update/new
201 Created
Webhook Delete
Webhook Delete
This request will return you all the webhooks by this customer code

Name	Data Type	Required	Description
id	integer	yes	Id of webhook that was returned in create request
customer_code	integer	yes	Your customer code provided by cargo
200 OK
Webhook get
Webhook get
This will delete your webhook, and you will stop receive any data. in response you'll get all available webhooks that exist in our system left.

Name	Data Type	Required	Description
customer_code	integer	yes	Your customer code provided by cargo
200 OK



---


201 Created
Create Shipment
Create Shipment
201 Created
Request
Try console
POST
https://api-v2.cargo.co.il/api/shipments/create
Headers
Copy
Content-Type: application/json
Authorization: Bearer iEawzE5LjygZGMvEYZ5O5Z0MxNHEeg9aYirINxIl4ba87786
Body
Copy
{
    "shipping_type": 1,
    "number_of_parcels": 1,
    "barcode": "",
    "double_delivery": 0,
    "total_value": 123,
    "transaction_id": "ORDER2365",
    "cod_type": 0,
    "cash_on_delivery": 0,
    "carrier_id": 1,
    "order_id": "",
    "notes": "Ship by 25/06/2018",
    "website": null,
    "platform": "API",
    "customer_code": "", // will be provided by cargo
    "to_address": {
        "name": "John Doe",
        "company": "customer company",
        "street1": "מינץ",
        "street2": "14",
        "city": "תל אביב",
        "phone": "0522222222",
        "email": "johndoe@gmail.com",
        "entrance":"",
        "floor":  "",
        "apartment":""
    },
    "from_address": {
        "name": "John Doe",
        "company": "my company",
        "street1": "aluf david 171",
        "street2": "",
        "city": "ramat gan",
        "phone": "0000000000",
        "email": "johndoe@gmail.com",
        "entrance":"",
        "floor":  "",
        "apartment":""
    }
}
Code Example

Select Language...
Copy
Response
Status code:201
Headers
Copy
Content-Type: application/json
Body
Copy
{
    "errors": false,
    "data": {
        "shipment_id": 57833427,
        "driver_name": "אורי צור",
        "line_text": "Box 27",
        "validation_method": 1,
        "cargo_validation": {
            "street_number": "14",
            "street": "מינץ",
            "city": "תל אביב",
            "full_city": "תל אביב-יפו",
            "administrative_area_level_1": "מחוז תל אביב",
            "country": "ישראל",
            "coordinates": {
                "latitude": 32.1087957,
                "longitude": 34.8235266
            },
            "formatted_address": "",
            "original_string": "רחוב מינץ 14"
        }
    },
    "message": "Successfully created shipment"
}

---


201 Created
Get Status
Get shipment status
201 Created
Request
Try console
POST
https://api-v2.cargo.co.il/api/shipments/get-status
Headers
Copy
Content-Type: application/json
Authorization: Bearer iEawzE5LjygZGMvEYZ5O5Z0MxNHEeg9aYirINxIl4ba87786
Body
Copy
{
    "shipment_id": 57832819,
    "customer_code": 3175
}
Code Example

Select Language...
Copy
Response
Status code:201
Headers
Copy
Content-Type: application/json
Body
Copy
{
    "errors": false,
    "data": {
        "shipment_id": 57832819,
        "status_code": 2,
        "status_text": " שובץ על נהג - טרם נאסף",
        "status_text_en": "Assigned to driver - not yet picked up",
        "status_date": "2025-06-09 14:25:16",
        "city": "Israel",
        "state": "Israel",
        "transaction_id": "tttttttz888"
    },
    "message": "Successfully got the status"
}

----
201 Created
Update Status
Update status
201 Created
Request
Try console
PUT
https://api-v2.cargo.co.il/api/shipments/update-status
Headers
Copy
Content-Type: application/json
Body
Copy
{
    "shipment_id": 57832819,
    "customer_code": 3175,
    "status_code": 4
}
Code Example

Select Language...
Copy
Response
Status code:201
Headers
Copy
Content-Type: application/json
Body
Copy
{
    "errors": false,
    "data": {
        "shipment_id": 57832819,
        "updated": true,
        "status_code": 4,
        "status_text": "שנאספו",
        "status_text_en": "Assigned to driver - not yet picked up",
        "status_date": "2025-06-09 14:25:16",
        "city": "Israel",
        "state": "Israel",
        "transaction_id": "tttttttz888"
    },
    "message": "Successfully updated status"
}


---
201 Created
Print Label
Print Label
201 Created
Request
Try console
POST
https://api-v2.cargo.co.il/api/shipments/print-label
Headers
Copy
Content-Type: application/json
Authorization: Bearer iEawzE5LjygZGMvEYZ5O5Z0MxNHEeg9aYirINxIl4ba87786
Body
Copy
{
    "shipment_ids": [57833352,57833353],
    "shipments_data": [
        {
            "shipmentId": 57833352,
            "products": [
                {
                    "title": "Title 1",
                    "quantity": "2",
                    "item_price": "350.5"
                },
                {
                    "title": "Title 666",
                    "quantity": "15",
                    "item_price": "6350.5"
                }
            ]
        },
        {
            "shipmentId": 57833353,
            "products": [
                {
                    "title": "Title 33",
                    "quantity": "22",
                    "item_price": "4350.5"
                },
                {
                    "title": "Title 555",
                    "quantity": "1",
                    "item_price": "650.5"
                }
            ]
        }
    ]
}
Code Example

Select Language...
Copy
Response
Status code:201
Headers
Copy
Content-Type: application/json
Body
Copy
{
    "errors": false,
    "data": "https://api-v2.cargo.co.il/storage/shipmentLabels/2024.06.13/shipments_57833352_1718266471.pdf",
    "message": "Successfully returned pdf label"
}


---


201 Created
Print Label A4
Print Label A4
201 Created
Request
Try console
POST
https://api-v2.cargo.co.il/api/shipments/print-label-a4
Headers
Copy
Content-Type: application/json
Body
Copy
{
    "shipment_ids": [57833352,57833353],
    "starting_point": 3
}
Code Example

Select Language...
Copy
Response
Status code:201
Headers
Copy
Content-Type: application/json
Body
Copy
{
    "errors": false,
    "data": "https://api-v2.cargo.co.il/storage/shipmentLabels/2024.06.13/shipments_57833352_1718266471.pdf",
    "message": "Successfully returned pdf label"
}

---

201 Created
Get pickup points
Get pickup points
201 Created
Request
Try console
GET
https://api-v2.cargo.co.il/api/shipments/get-pickup-points
Headers
Copy
Content-Type: application/json
Authorization: Bearer iEawzE5LjygZGMvEYZ5O5Z0MxNHEeg9aYirINxIl4ba87786
Code Example

Select Language...
Copy
Response
Status code:201
Headers
Copy
Content-Type: application/json
Body
Copy
[
    {
        "DistributionPointID": 10003,
        "DistributionPointName": "קופי PLAY",
        "CityName": "אשקלון",
        "StreetName": "דוד רמז",
        "StreetNum": "1",
        "Comment": "שעות פעילות - יום א-ה -11:00-17:00 יום ו- 9:00-13:00",
        "Phone": "0524217872",
        "Phone2": "",
        "Islocker": "לא",
        "Latitude": 31.67,
        "Longitude": 34.58,
        "IdNum": 557838802,
        "created_at": "2024-06-12T20:00:05.000000Z",
        "updated_at": "2024-06-12T20:00:05.000000Z"
    }
]

---

200 OK
Find closest points
Find closest points
200 OK
Request
Try console
POST
https://api-v2.cargo.co.il/api/shipments/find-closest-pickup-points
Headers
Copy
Content-Type: application/json
Authorization: Bearer iEawzE5LjygZGMvEYZ5O5Z0MxNHEeg9aYirINxIl4ba87786
Body
Copy
{
    "latitude": 32.82,
    "longitude": 34.96,
    "radius": 10
}
Code Example

Select Language...
Copy
Response
Status code:200
Headers
Copy
Content-Type: application/json
Body
Copy
[
    {
        "DistributionPointID": 10019,
        "DistributionPointName": "מכולת גורס",
        "CityName": "חיפה",
        "StreetName": "דרך צרפת",
        "StreetNum": "63",
        "Comment": "שעות פעילות א-ה 7:00-19:00",
        "Phone": "0523323953",
        "Phone2": "",
        "Islocker": "לא",
        "Latitude": 32.82,
        "Longitude": 34.96,
        "IdNum": 25601626,
        "created_at": "2024-06-12T20:00:05.000000Z",
        "updated_at": "2024-06-12T20:00:05.000000Z",
        "distance": 9.493529796600342e-5
    }
]

---

201 Created
Webhook create
Webhook create
201 Created
Request
Try console
POST
https://api-v2.cargo.co.il/api/webhooks/create
Headers
Copy
Content-Type: application/json
Authorization: Bearer iEawzE5LjygZGMvEYZ5O5Z0MxNHEeg9aYirINxIl4ba87786
Body
Copy
{
    "type": "status-update",
    "customer_code": "",// will be provided by cargo
    "webhook_url": "https://yourdomain.com/status-update"
}
Code Example

Select Language...
Copy
Response
Status code:201
Headers
Copy
Content-Type: application/json
Body
Copy
[
    {
        "errors": false,
        "data": {
            "id": 79,
            "type": "status-update",
            "customer_code": "",
            "webhook_url": "https://yourdomain.com/status-update",
            "succeed": 0,
            "failed": 0,
            "created_at": "2024-11-09T08:10:36.000000Z",
            "updated_at": "2024-11-06T08:56:04.000000Z",
            "user_id": 5
        },
        "message": "Webhook created."
    }
]

---

201 Created
Webhook update
Webhook update
201 Created
Request
Try console
POST
https://api-v2.cargo.co.il/api/webhooks/update
Headers
Copy
Content-Type: application/json
Authorization: Bearer iEawzE5LjygZGMvEYZ5O5Z0MxNHEeg9aYirINxIl4ba87786
Body
Copy
{
    "id": 79,
    "type": "status-update",
    "customer_code": "",// will be provided by cargo
    "webhook_url": "https://yourdomain.com/status-update/new"
}
Code Example

Select Language...
Copy
Response
Status code:201
Headers
Copy
Content-Type: application/json
Body
Copy
[
    {
        "errors": false,
        "data": {
            "id": 79,
            "type": "status-update",
            "customer_code": "",
            "webhook_url": "https://yourdomain.com/status-update/new",
            "succeed": 0,
            "failed": 0,
            "created_at": "2024-11-09T08:10:36.000000Z",
            "updated_at": "2024-11-06T08:56:04.000000Z",
            "user_id": 5
        },
        "message": "Webhook updated."
    }
]

---

200 OK
Webhook Delete
Webhook Delete
200 OK
Request
Try console
DELETE
https://api-v2.cargo.co.il/api/webhooks/delete
Headers
Copy
Content-Type: application/json
Authorization: Bearer iEawzE5LjygZGMvEYZ5O5Z0MxNHEeg9aYirINxIl4ba87786
Body
Copy
{
    "id": 79,
    "customer_code": "",// will be provided by cargo
}
Code Example

Select Language...
Copy
Response
Status code:200
Headers
Copy
Content-Type: application/json
Body
Copy
[
    {
        "errors": false,
        "data": [
            {
                "id": 79,
                "type": "status-update",
                "customer_code": "","",// will be provided by cargo
                "webhook_url": "https://yourdomain.com/status-update/new",
                "succeed": 0,
                "failed": 0,
                "created_at": "2024-11-09T08:10:36.000000Z",
                "updated_at": "2024-11-06T08:56:04.000000Z",
                "user_id": 5
            }
        ],
        "message": "Webhook deleted."
    }
]

---

200 OK
Webhook get
Webhook get
200 OK
Request
Try console
DELETE
https://api-v2.cargo.co.il/api/webhooks/get
Headers
Copy
Content-Type: application/json
Authorization: Bearer iEawzE5LjygZGMvEYZ5O5Z0MxNHEeg9aYirINxIl4ba87786
Body
Copy
{
    "customer_code": "",// will be provided by cargo,
}
Code Example

Select Language...
Copy
Response
Status code:200
Headers
Copy
Content-Type: application/json
Body
Copy
[
    {
        "errors": false,
        "data": [
            {
                "id": 79,
                "type": "status-update",
                "customer_code": "",
                "webhook_url": "https://yourdomain.com/status-update/new",
                "succeed": 0,
                "failed": 0,
                "created_at": "2024-11-09T08:10:36.000000Z",
                "updated_at": "2024-11-06T08:56:04.000000Z",
                "user_id": 5
            }
        ],
        "message": "Success."
    }
]