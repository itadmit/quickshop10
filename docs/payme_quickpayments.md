Getting Started
Our API is designed to allow platforms to offer a full payment solution as part of their product.

Using the API you can:

Create and manage Merchant on your platform
Allow merchants to accept credit card paymentsCreate standard transactions
Create recurring payments
Use our secured payment pages
Use Tokenization for delayed & future payments
Charge a platform fee from every transactionQuery data regarding sellers, transactions, subscriptions, withdrawals and more
PCI compliant and want to use the direct credit card API? Let us know!

By using the API you will be able to handle all transactions on your website without dealing with sensitive credit card details, processing difficulties or PCI compliancy.The basics are simple. You POST required information to our target URL's using JSON format and get replies structured in JSON format. You are free to use whatever programming language you prefer.

Note:
Do not forget to add the header Content-Type: application/json to your requests!Callbacks - We have an option to send out a server to server notifications, also known as "IPN".

For example: a customer successfully paying using the IFRAME; a successful subscription iteration. The format and details are described throughout this document. The callback is a POST request of type x-www-form-urlencoded to your provided target URL.

Sandbox and Production URLs
In order to work with the API, you should use the service URLs according to the required environments, Staging or Production.When interacting with the API, make sure you point to the correct environment, with the correct credentials. Both URLs will be stated next to each function.

ENVIRONMENT	URL
Staging	https://sandbox.payme.io/api/
Production	https://live.payme.io/api/

Test Cards and Payment Methods
Please use the following credit card when integrating only in the Staging environment.

Main credit card numbers for testing
EMV supported credit cards:

Credit Card	Details
Card Number: 4557430402053431 Expiration: 12/30 CVV:200 Social ID:008336174	Limitations: Acts as an international non-Israeli card. Accepts sales with only one installment. Accepts sales in ILS, USD, EUR.
Card Number: 375516193000090 Expiration: 12/30 CVV: 0957 Social ID:008336174	Limitations: Acts as an international Israeli card. Accepts sales with multiple installments. Accepts sales in ILS, USD, EUR.
Card Number: 5326105300985846 Expiration: 12/30 CVV: 658 Social ID:008336174	Limitations: Acts as a local Israeli card. Accepts sales with multiple installments. Accepts sales in ILS only.
Secondary credit card numbers for testing
Credit Card Type	Credit Card Number
Visa	4111111111111111 4200000000000000
Mastercard	5555555555554444 5454545454545454
AmericanExpress	378282246310005 377777777777770
Diners	38520000023237
Discover	6011000990139424
JCB	3530111333300000
Isracard	12312312
Credit card numbers for testing specific responses and errors
Card Number	Description
4000000000000002	Payment is declined with a card declined error
4000000000000051	Payment is declined with a card blocked error
4000000000000085	Payment is declined with a card stolen error
4000000000000069	Payment is declined with a card expired error
4000000000000101	Payment is declined with a required CVV error
4000000000000127	Payment is declined with an incorrect CVV
4000000000000135	Payment is declined with a credit limit reached error
4242424242424241	Payment is declined with an incorrect card number error
Apple Pay Testing Information
Card Brand	Card Number	Card Expiry Date	Card CVV
Visa	4051 0693 0220 0121	12/27	340
Mastercard	5204 2452 5052 2095	12/30	111
American Express	37272 79248 51007	12/28	1111
Discvoer	FPAN: 6011 0009 9475 4889	12/30	111
Israeli Direct Debit Testing Information
Bank Account Infromation (Bank, Branch, Account Number)	Description
54, 112, 2222111	Bank Authorization is approved after 60 seconds
54, 113, 4444333	Bank Authorization is declined after 60 seconds
SEPA Payment Method Testing Information
Account Number	Description
DE89370400440532013000	The Payment status transitions from initial to completed immidiately.
DE08370400440532013003	The Payment status transitions from initial to completed after 3 minutes.
DE62370400440532013001	The Payment status transitions from initial to failed immidiately.
DE78370400440532013004	The Payment status transitions from initial to failed after 3 minutes.
DE35370400440532013002	The Payment status transitions from initial to completed and then immidiately to chargeback.
BACS Payment Method Testing Information
SORT CODE	Account Number	Description
108800	00012345	The Payment status transitions from initial to completed immidiately.
108800	90012345	The Payment status transitions from initial to completed after 3 minutes.
108800	33333335	The Payment status transitions from initial to completed and than immidiately changed to Failed.




--
Integration Options
We have three integration options:

Hosted Payment Page
Hosted Fields - JSAPI
Direct API
Integration	Description	Advantages ✔️	Disadvantages ❌
Hosted Payment Page	With this approach, the payment process is redirected to our secure payment gateway's website, where customers enter their payment details. We handle the transaction and send the result back to the merchant's website.	Security: Since the payment process occurs on our payment gateway's secure server, the merchant's website doesn't handle sensitive payment information directly, reducing the risk of data breaches.

Simplicity: Implementing a hosted payment page is relatively straightforward, as PayMe handles most of the complex payment processing tasks for you.

Compliance: The responsibility for meeting payment industry security standards, such as PCI DSS (Payment Card Industry Data Security Standard), lies with PayMe, relieving the merchant of some compliance burdens.	Customization limitations: Our hosted payment pages can't be customed designed, which may not seamlessly integrate with the merchant's website design.

Limited control: As the payment process is handled by PayMe, the merchant has less control over the overall checkout experience and may be restricted in customizing certain features or functionalities.
Hosted Fields - JSAPI	JSAPI (JavaScript API) payment integration allows you to embed payment forms directly into your website using JavaScript. This method enables a seamless payment experience for customers, without the need for redirection to an external page.	Seamless user experience: Customers can complete the entire payment process without leaving the merchant's website, enhancing convenience and reducing the risk of customer drop-off during checkout.

Design flexibility: By integrating payment forms using JavaScript, merchants have more control over the appearance and customization of the payment interface, enabling a consistent brand experience.

Real-time response: With JSAPI, payment responses can be processed in real-time, allowing for immediate feedback on the payment status and reducing the risk of potential payment errors or delays.	Security considerations: Handling sensitive data on the merchant's servers requires robust security measures.
Development complexity: Requires advanced programming skills and maintenance of the payment system.
Direct API	PayMe's API is integrated directly into your website or application.	Customization and control: Allows full control and customization of the payment process.

Enhanced security: You can implement robust encryption and security measures according to your requirements.
Scalability and efficiency: Facilitates real-time transaction updates and integrations with other systems.	Development complexity: Requires advanced programming skills and understanding of PayMe's API.<br / >Compliance responsibility: Merchant must meet security standards and ensure ongoing maintenance and updates (PCI-DSS level 1).

---

מכיוון שפיימי הם וייטלייבל של קוייק פיימנטס אנחנו ניתן פתרון בצ׳ק אוט יותר טוב
2️⃣ Hosted Fields – JSAPI
(טופס תשלום בתוך האתר שלך)

איך זה עובד?
טופס האשראי נראה כחלק מהאתר שלך, אבל בפועל השדות עצמם נטענים מ־PayMe דרך JavaScript.

.


Hosted Fields JSAPI Guide
Client Integration Manual
Basic
jsFiddle
Basic example based on Bootstrap 3

Example 1
JavaScript
CSS
Example 1 RTL
JavaScript
CSS
The same UI/UX example like Example 1 but shows how to tackle RTL languages

Example 2
JavaScript
CSS
Example 3
JavaScript
CSS
Example 4
JavaScript
CSS
Step-by-step integration
Include Client API Library into <head> section of your page Put markup, designed by your own or corporate site template Initialize integration with API key, get Hosted Fields Manager and manage protected fields using simple API

Click here to review our Github library
Include Client API Library
<html lang="en">
    <head>
      ...
    
      <!-- Include Client API Library in your page -->
      <script src="https://cdn.payme.io/hf/v1/hostedfields.js"></script>
      ...
    </head>
    <body>...</body>
</html>
Put your payment form markup
<html lang="en">
    <head>
        <!-- Include Client API Library in your page -->
        ...
    </head>
    <body>
        <!-- PAYMENT FORM STARTS HERE -->
        <div class="container">
          <div class="row">
            <div class="col-xs-12 col-md-4">
            
              <div class="panel panel-default credit-card-box">
                <div class="panel-body">
                  <form role="form" id="checkout-form">
        
                    <div class="row">
                      <div class="col-xs-12 col-md-12">
                        <div class="form-group" id="card-number-group">
                          <label for="card-number-container" class="control-label">CARD NUMBER</label>
                          
                          <!-- Container for Credit Card number field -->
                          <div id="card-number-container" class="form-control input-lg"></div>

                        </div>
                      </div>
                    </div>
        
                    <div class="row">
                      <div class="col-xs-7 col-md-7">
                        <div class="form-group" id="card-expiration-group">
                          <label for="card-expiration-container" class="control-label">EXPIRATION DATE</label>
                          
                          <!-- Container for Credit Card expiration date field -->
                          <div id="card-expiration-container" class="form-control input-lg"></div>
                          
                        </div>
                      </div>
                      <div class="col-xs-5 col-md-5 pull-right">
                        <div class="form-group" id="card-cvv-group">
                          <label for="card-cvv-container" class="control-label">CVV</label>
                          
                          <!-- Container for Credit Card CVV field -->
                          <div id="card-cvv-container" class="form-control input-lg"></div>
                          
                        </div>
                      </div>
                    </div>

                    <div class="row">
                      <div class="col-xs-12">
                      
                        <!-- Form submit button -->
                        <button class="subscribe btn btn-success btn-lg btn-block" id="submit-button" disabled>
                          Pay 55.00 USD
                        </button>
                        
                      </div>
                    </div>
        
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- PAYMENT FORM ENDS HERE -->
   
    </body>
</html>
Initialization and interaction
<html lang="en">
    <head>
        <!-- Include Client API Library into your page -->
        ...
    </head>
    <body>
        <!-- PAYMENT FORM STARTS HERE -->
        ...
        <!-- PAYMENT FORM ENDS HERE -->
        <script>
            
            var apiKey = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'; // Merchant API key from Settings page in the dashboard
            
            PayMe.create(apiKey, { testMode: true }).then(function (instance) {
           
              var fields = instance.hostedFields();
              
              var cardNumber = fields.create('cardNumber');
              var expiration = fields.create('cardExpiration');
              var cvc = fields.create('cvc');
              
              cardNumber.mount('#card-number-container');
              expiration.mount('#card-expiration-container');
              cvc.mount('#card-cvv-container');
              
              ...
              
            }).catch(function(error) {
                // Instantiation error occurs 
            })
        
        </script>
    </body>
</html>
Let's break down code, presented above. First of all you must get and provide your Merchant API key from Settings page in the dashboard.

...
// This is the Merchant API key (Test API key in this case)
var apiKey = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
...
Second, you must obtain integration instance for the merchant

var apiKey = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

// There is optional configuration object with testMode: true
// because we are using the API key from the test server
PayMe.create(apiKey, { testMode: true })
    .then(function (instance) {
    
      // Here we can work with successfully initialized
      // integration instance - Integration Manager
       ...
    })
    .catch(function(error) {
      // Here you can handle instantiation error
      ...
    });
    
...
Initialization settings
Property	Default value	Available values	Description
testMode	false	true / false	Test mode - used to control in which environment payment will be processed
language	'en'	'en' / 'he'	Language - controls the language of the messages and text direction (rtl or ltr). en (for English) or he (for Hebrew)
tokenIsPermanent	true	true / false	Token is permanent - Indicates whether it is a one-time-use or multi-use token
Next step - to initialize integration type and get corresponding manager

Hosted fields integration type
This integration type allows you to use secure way to collect user's sensitive data for making payments.

To obtain Hosted Fields manager you must call hostedFields method

PayMe.create(key, { testMode: true })
    .then(function (instance) {
    
      // Getting Hosted Fields Integration manager
      var fields = instance.hostedFields();
    })
    .catch(function(error) {
        ...
    });
As soon as you have Hosted Fields Manager you are ready to create actual protected fields. You can create as many fields as you need but you can create each field type only once. It means if cardNumber field was created you can't create more cardNumber fields, but you can create payerEmail and other (for details see Tokenization section).

For example let's create 3 most important fields:

PayMe.create(key, { testMode: true })
    .then(function (instance) {
    
      
      var fields = instance.hostedFields();
      
      // Hosted fields creation
      var cardNumber = fields.create('cardNumber');
      var expiration = fields.create('cardExpiration');
      var cvc = fields.create('cvc');
    })
    .catch(function(error) {
        ...
    });
...
Hint - We propose to create field names within Payme.fields object

// Instead of this
 var cardNumber = fields.create('cardNumber');
 // try to use this
 var cardNumber = fields.create(PayMe.fields.NUMBER);
Having created all of necessary fields, they must be mounted to the chosen page place. Fields will be shown on your page only after mounting

PayMe.create(key, { testMode: true })
    .then(function (instance) {
    
      
      var fields = instance.hostedFields();
      
      var cardNumber = fields.create('cardNumber');
      var expiration = fields.create('cardExpiration');
      var cvc = fields.create('cvc');
      
      // Mount credit card inside container with id="card-number-container"
      cardNumber.mount('#card-number-container');
      ...
    })
    .catch(function(error) {
        ...
    });
...
Hint - Field instance mount method accepts any valid query selector

// Select by id
cardNumber.mount('#card-number-container');

// Select by class
cardNumber.mount('.credit-card-wrapper');

// Select by attribute
cardNumber.mount('[data-role="credit-card-input"]');
Hint - We can be notified on result by promise, because field mounting is an asynchronous process

...
// Mount credit card inside container with id="card-number-container"
cardNumber.mount('#card-number-container').then(function() {
    // Field was mounted successfully
}).catch(function(error){
    // There is error handling code
});
...
Field Creation Options
.create(field, options) method accepts an optional second argument options which is helpful in case you want to customize the field created with it.

var cardNumberFieldOptions = {
    placeholder: 'Enter your Credit Card Number',
    messages: {
        required: 'The Credit Card Number is Required!',
        invalid: 'Bad Credit Card Number'
    },
    styles: ... // see below
};
var cardNumber = fields.create('cardNumber', cardNumberFieldOptions);
The available properties for customization:

Property	Description
placeholder	Placeholder text for empty field
messages	Validation messages object, can have required and invalid properties (see Field Event Object and Examples page)
styles	CSS properties for "protected" fields (see Field Styling)
Field Styling
Because the "protected" fields are protected, you can use only limited CSS properties and selectors:

Whitelisted CSS properties:

color
font-size
text-align
letter-spacing
text-decoration
text-shadow
text-transform
Whitelisted CSS rules:

::placeholder

Allowed properties and selectors are organized into three groups within field creation configuration options.

var cardNumberFieldOptions = {
	placeholder: 'Enter your Credit Card Number',

	// ...
	
	styles: {
	  base: {
		'color': '#000000',
		'::placeholder': {
			color: '#F2F2F2'
		}
	  },
	  invalid: {
		'color': 'red'
	  },
	  valid: {
		'color': 'green'
	  }
	}
};
Each group represents the state of the protected field like a CSS class. For example:

/* base styles would be applied as a default style */
input.credit-card .base {
	color: #000000;
	font-size: 16px;
	text-align: center;
	letter-spacing: .25em;
	text-decoration: underline;
	text-shadow: 1px 1px 2px black, 0 0 1em red;
	text-transform: uppercase;
}

input.credit-card ::placeholder {
	color: gray;
}

/* .invalid styles would be applied on top of the .base when field validation fails */
input.credit-card .base .invalid {
	color: red;
}

/* .valid styles would be applied on top of the .base when the field became valid */
input.credit-card .base .valid {
	color: green;
}
Note - This information is related only to "protected" fields, which were created with Hosted Fields Integration manager via .create(...) and .mount(...) call. In case you are going to use your own markup/widget/etc. for any additional fields (first name, last name, email, phone number, social ID) then you are free to use any CSS code to style them.

Hosted fields integration interaction
Right after field creation you can use field instance to listen basic set of events to interact with code on your page.

For example, let's listen keyup event on credit card field:

PayMe.create(key, { testMode: true })
    .then(function (instance) {
    
      
      var fields = instance.hostedFields();
      
      var cardNumber = fields.create('cardNumber');
      ...
      
      cardNumber.on('keyup', function(event) {
        console.log(event);
      })
      
      // Mount credit card inside container with id="card-number-container"
      cardNumber.mount('#card-number-container');
      ...
    })
    .catch(function(error) {
        ...
    });
...
and each time when keyup event occurs on cardNumber field you will be notified. Keep in mind, for security reasons event object was significantly simplified (see Field Event Object)

Field events
Using field events your can build you own logic. There is available limited set of events out of the box, those caused by security reasons

Event type	Fields	Description
change	all	works like standard change
blur	all	works like standard blur
focus	all	works like standard focus
keyup	all	works like standard keyup
keydown	all	works like standard keydown
keypress	all	works like standard keypress
validity-changed	all	emits when field validity state changed. Can be used for showing error messages
card-type-changed	cardNumber	emits when library detects vendor of entered Credit Card number
Field Event Object
Shape of change, blur, focus, keyup, keydown, keypress, validity-changed are the same among all the fields and can be either valid or not

json
js
// Valid field
{
    type: "focus",       
    event: "focus",      // event type
    field: "cardNumber", // field which emits this event 
    isValid: false       // field validity status
}
Shape of card-type-changed is little bit different and it can be used for displaying credit card brand icon

js
js
// Valid field
{
    type: "card-type-changed"
    event: "card-type-changed"
    field: "cardNumber"
    
    isValid: true,
    
    cardType: "visa"          // Card vendor 
}
here cardType property can be founded. All available types are listed below

cardType value	Brand	Mask
unknown	Unknown brand	
amex	American Express: starts with 34/37	34♦♦ ♦♦♦♦♦♦ ♦♦♦♦
diners	Diners Club: starts with 300-305/309...	300♦ ♦♦♦♦♦♦ ♦♦♦♦
jcb	JCB: starts with 35/2131/1800	35♦♦ ♦♦♦♦ ♦♦♦♦ ♦♦♦♦
visa	VISA: starts with 4	4♦♦♦ ♦♦♦♦ ♦♦♦♦ ♦♦♦♦
mastercard	MasterCard: starts with 51-55/22-27	51♦♦ ♦♦♦♦ ♦♦♦♦ ♦♦♦♦
discover	Discover: starts with 6011/65/644-649	6011 ♦♦♦♦ ♦♦♦♦ ♦♦♦♦
So far so good, now you have form with some fields and you are ready to tokenize sensitive data to create actual sale

Tokenization
Tokenization Is a process of storing sensitive data in the protected vault and providing safe data for you, to make actual payment

To kick off tokenization you must call tokenize(...) method on Ingeration Manager instance

PayMe.create(key, { testMode: true })
  .then(function (instance) {

    var fields = instance.hostedFields();
    ...
    
    // Data for tokenization
    
    var saleData = {

      payerFirstName: 'Foo',
      payerLastName: 'Bar',
      payerEmail: 'foo-bar@domain.com',
      payerPhone: '1231231',
      payerSocialId: '12345',
      payerZipCode: '123456',

      total: {
        label: 'Order #123123',
        amount: {
          currency: 'USD',
          value: '55.00',
        }
      }
    };
    
    // Call for tokenization
    
    instance.tokenize(saleData)
      .then(function (tokenizationResult) {     
              
        // Successfull tokenization
        // 
        // Now you can send 'tokenizationResult' to
        // your server and call `generate-sale` on Core API
        
        console.log(tokenizationResult);
      })
      .catch(function(tokenizationError) {
      
        // Failed tokenization
        // 
        // you can explore 'tokenizationError' object and show error message on your taste
        
        console.error(tokenizationError)
      });
  })

  ...
...
If you want let your users input additional data (First name, Last name, Email, Phone number, Social ID) rather provide by yourself you can use native HTML inputs within your page (please check our examples page). This approach let you to use any presenting, styling, formatting logic. To help you with validation we were exposing validators to you

Additional fields validators
Particular validator can be obtained and used by this code

// ...

var firstNameValidator = PayMe.validators[PayMe.fields.NAME_FIRST];
var validation = firstNameValidator.test('John');

// ...

console.log(validation);
Additional fields validation result
If validation result is success then validation would be null in the other case:

{required: true} - if firstNameValidator.test(...) argument not defined
{invalid: true} - if firstNameValidator.test(...) argument has unallowable value
Note
Values within additional fields must pass exposed validators. Without fulfilling this condition tokenization will fail!

tokenizationResult Structure (successful tokenization)

{
  // Safe Credit Card data
  card: {                                         
    cardMask: "411111******1111",
    cardholderName: "Firstname Lastname",
    expiry: "1119"
  },
  
  // Service data
  type: "tokenize-success",
  testMode: true,                              
  token: "BUYER154-0987247Y-MLJ10OI7-LXRDNDYP", // Payment token for generating payment
  
  // Payer data
  payerEmail: "firstname-lastname@domain.com",
  payerName: "Firstname Lastname",
  payerPhone: "1231231",
  payerSocialId: "111123",
  
  // Payment data
  total: {
    label: "🚀 Rubber duck",
    amount: {
      currency: "USD",
      value: "55.00"
    }
  }
}
tokenizationError structure (tokenization failed)

{
  // Says that the form contains invalid values
  validationError: true
  
  // Here you can find error messages for particular field
  errors: {
    payerEmail: "Mandatory field",
    payerPhone: "Mandatory field"
  },
  
  type: "tokenize-error",
}
Also, you can receive such shape (may be changed in the future)

{

  // This error means that tokenization has already
  // performed for this Intergation Instance
  error: "Bad session",
  message: "Session expired or deleted",
  
  statusCode: 400,
  type: "tokenize-error",
}
Tokenization and Mounted fields
As was mentioned above you can create as many different fields as you need but sometimes you have some user's data, supposed to be filled and you don't want bother your users requested filling their data again. You can do that, just provide it within Data for tokenization object.

For example if you already have email or First + Last Name and you want provide it directly, you can to it

PayMe.create(key, { testMode: true })
  .then(function (instance) {
    
    var fields = instance.hostedFields();
    
    // Create and Mount credit card field
      var cardNumber = fields.create('cardNumber');
      cardNumber.mount('#card-number-container');
      ...
    // Create and Mount credit card expiration field
      ...
    // Create and Mount CVV field
      ...
    // Create and Mount Social Id field
      ...
    // Create and Mount Phone number field
      ...
    
    // Provide all available data
    var saleData = {

      payerFirstName: 'Foo',            // First name field wasn't created, we must provide value
      payerLastName: 'Bar',             // Last name field wasn't created, we must provide value
      payerEmail: 'foo-bar@domain.com', // Email field wasn't created, we must provide value
      
      // payerPhone: '1231231',         // value isn't needed due created Phone number field
      // payerSocialId: '12345',        // value isn't needed due created Social Id field
      // payerZipCode: '123456',        // value isn't needed due created Zip Code field

      total: {
        label: 'Order #123123',
        amount: {
          currency: 'USD',
          value: '55.00',
        }
      }
    };
    
    // Call for tokenization
    
    instance.tokenize(saleData)
      .then(function (tokenizationResult) {     
              
        // Successfull tokenization
        // 
        // Now you can send 'tokenizationResult' to
        // your server and call `generate-sale` on Core API
        
        console.log(tokenizationResult);
      })
      .catch(function(tokenizationError) {
      
        // Failed tokenization
        // 
        // you can explore 'tokenizationError' object and show error message on your taste
        
        console.error(tokenizationError)
      });
  })

  ...
...
Rule of thumb
If you didn't create field - provide corresponding value in tokenization payload, but with one exception. You can't provide values for Credit Card Number, Credit Card Expiration and CVV - corresponding fields must be created and mounted always

What should be done with tokenized data?
You as an embedder may decide by yourself but main idea is send tokenization data to backend and generate sale using Generate sale

Let's say you have such tokenization result and sent it to your backend:

{
  card: {                                         
    cardMask: "411111******1111",
    cardholderName: "Firstname Lastname",
    expiry: "1119"
  },
  
  type: "tokenize-success",
  testMode: true,                              
  token: "BUYER154-0987247Y-MLJ10OI7-LXRDNDYP",
  
  payerEmail: "firstname-lastname@domain.com",
  payerName: "Firstname Lastname",
  payerPhone: "1231231",
  payerSocialId: "111123",
  
  total: {
    label: "🚀 Rubber duck",
    amount: {
      currency: "USD",
      value: "55.00"
    }
  }
}
On the backend side you can start building the generate-sale payload

Generate Sale Attribute	Tokenization Attribute
sale_price	tokenizationData.total.amount.value - must be converted to the integer
product_name	tokenizationData.total.label
currency	tokenizationData.total.amount.currency
buyer_key	tokenizationData.token
and send it to the https://<env>.payme.io/api/generate-sale

Security notes:
Our service has a strict Content Security Policy (CSP) which in some cases might cause error messages to appear in the browser console. These errors do not cause any kind of malfunction or security risk to our service, and you can safely ignore them.

In most cases the errors are caused by third party extensions installed on the browser. Try turning off the extensions or browse in private mode.
The error messages might also be caused by potentially malicious JavaScripts or browser extensions which inject JavaScript to the content pages. Our service is protected against such threats.
Errors examples:

console-errors.png
3DS Integration Using JS API
Step #1 - Setup
This point is identical to what was described in Include Client API Library. You do not need to provide any HTML markup for this interaction if you only use this API to get client information for making payments with 3Ds.

JSFiddle Example

Step #2 - Invoke and Handle hashing result
To obtain client information hash, you as implementer must call the method upon PayMe object and handle Promise resolution.

<html lang="en">
    <head>
      ...
    
      <!-- Include Client API Library in your page -->
      <script src="https://cdn.payme.io/hf/v1/hostedfields.js"></script>
      ...
    </head>
    <body>
      ...
      <!-- Some other code -->
      ...
      
      <script>
        // Obtaining hashed client information
        PayMe.clientData()
          .then((data) => {
            // Use or store hash
            console.log(data.hash);
          })
          .catch((error) => {
            // Handle error
          });
      </script>
      
      ...
      <!-- Some other code -->
      ...
    </body>
</html>
Important Note
PayMe.clientData(isTestMode) can accept boolean argument to indicate that payment doing in test mode

Step #3 - Consume The Encrypted Data
After receiving the hashed client information, the implementer must send this hash to your Back-End server and use it as a parameter for pay-sale (as described below)

Step #4 - Initiate Payment Flow
In order to initiate a payment flow, the implementer must have the following 2 data objects:

Buyer Key
JWT Token
When you have these two parameters, you are good to go in the matters of starting a payment flow

Step #5 - APIs to complete the payment
In order to complete the payment, you’ll need to use 2 API endpoints:

generate-sale

pay-sale

Generate-sale API request to ../api/generate-sale
{
    "seller_payme_id": "MPL16148-77043XMH-T5MOWMZB-DDTAZOPP",
    "sale_price": "1000",
    "currency": "eur",
    "product_name": "Shirt",
    "sale_type": "sale",
    "sale_payment_method": "credit-card",
    "sale_callback_url": "URL"
}
In the case of a challenge, you will receive the 3DS flow result to the callback URL you will provide in the generate-sale request.

Expected Response
{  
    ....
    "payme_sale_id": "SALE1655-3843870J-NTPYLJNW-SOWRLK9X",
    .....
  }
With the sale ID received in the response, you’ll be able to initiate the request to pay-sale:
{
 "seller_payme_id":"MPL15130-83274SO0-SAUCJ4KX-TVEDZCIN",
 "sale_price":"1000",
 "currency":"ILS",
 "installments":"1",
 "language": "en",
 "sale_callback_url": "https://www.example.com/payment/callback",
 "sale_return_url": "https://www.example.com/payment/success",
 "capture_buyer": 0,
 "payme_sale_id": "SALE1654-092102PD-2KRBHZMM-YMP33H7R",
 "buyer_email": "idan@payme.io",
 "buyer_name": "jordan sssssssssssss",
 "buyer_social_id": 311234488,
 "meta_data_jwt":"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImN0eSI6Impzb24ifQ.eyJpYXQiOjE2NTUzODQ3NDEsIm5iZiI6MTY1NTM4NDc0MSwiZXhwIjoxNjU1Mzg4MzQxLCJqdGkiOiJlMDBkOTYzMy02ZWExLTRjMTMtOWU4Zi01OTVhYjMyMjU4ZDIiLCJkYXRhIjp7ImlwIjoiMTIzNDUuMTIzNC4zMyIsImFjY2VwdCI6InRleHRcL2h0bWwiLCJqYXZhRW5hYmxlZCI6dHJ1ZSwiamF2YVNjcmlwdEVuYWJsZWQiOnRydWUsImxhbmd1YWdlIjoiaGUtaWwiLCJjb2xvckRlcHRoIjoyLCJzY3JlZW4iOnsiaGVpZ2h0IjoxMi4yLCJ3aWR0aCI6MTIuM30sInRpbWV6b25lIjoiSmVydXNhbGVtIiwidXNlckFnZW50IjoiTW96aWxsYVwvNS4wIChXaW5kb3dzIE5UIDYuMTsgV2luNjQ7IHg2NDsgcnY6NDcuMCkgR2Vja29cLzIwMTAwMTAxIEZpcmVmb3hcLzQ3LjAifX0.WbyU3ejj2PaG9EEPJRxsTqhyB_SuAWgzqJyi6l5l_Fpw3dDpv9obpcPme-7ViGdOTJ97Qn1GKe8wXBU-Y5tZcrLVbwm4w_hGtvCZFC7FNrALTFg1JH7OIFs4ChpvlqegkvWEzjlOp27bU0VuV3gGAiFEhAXffO9W9hgy8px37nUXZtZUbS0zU2b8KcGjmALhUoti8laIkTet4yXLi4fLBcLA0P0BiBuNdS3owdszehsdDwMOQGdtQYTT9C2ZNOMktvKAYdO8xINS__5Rpqz6WB69T8uvdT2ASjx_--0m-XoCKC05dHH_27g0RQ_rpEYnE-vKIeQW70_LHIsL2tLBCg"
}
Response Handling
If the 3DS flow ended in a challenge (URL is received in the next described response), you will get the following response:

{
    "status_code": 5,
    "status_message": "יוצר דף אימות, נא להמתין",
    "redirect_url": "REDIRECT CHALLANGE URL"
}
If the 3DS flow ended in a seamless flow (no challenge required), you will get the following response:

{
    "status_code": 0,
    "payme_status": "success",
    "status_error_code": null,
    "payme_sale_id": "SALE1655-2121212Y-BWFVU1YE-BQ2J6SUW",
    "payme_sale_code": 20511311,
    "sale_created": "2022-06-14 16:08:41",
    "payme_sale_status": "initial",
    "sale_status": "completed",
    "currency": "ILS",
    "transaction_id": "",
    "is_token_sale": false,
    "price": 1000,
    "payme_signature": null,
    "sale_deferred_months": null,
    "status_error_details": null,
    "redirect_url": null,
    "transaction_cc_auth_number": "1172408",
    "payme_transaction_auth_number": "1172408".
    "3ds_sale": true
}
If the 3DS flow ended in a failure, you will get the following response:

{
    "status_code": 1,
    "payme_status": "success",
    "status_error_code": null,
    "payme_sale_id": "SALE1655-2121212Y-BWFVU1YE-BQ2J6SUW",
    "payme_sale_code": 20511311,
    "sale_created": "2022-06-14 16:08:41",
    "payme_sale_status": "failure",
    "sale_status": "failure",
    "currency": "ILS",
    "transaction_id": "",
    "is_token_sale": false,
    "price": 1000,
    "payme_signature": null,
    "sale_deferred_months": null,
    "status_error_details": null,
    "redirect_url": null,
    "transaction_cc_auth_number": "1172408",
    "payme_transaction_auth_number": "1172408".
    "3ds_sale": false
}
Moving to Production
After completing your testing period you will get your production credentials, this means that you should also modify your library to work with our Production Environment.

In order to work with our production environment you should modify the following component:

const isTestMode = false;
Set isTestMode to false will modify the requests to pass through to our production environment. You can go back to testing in any moment by modifying the component to:

const isTestMode = true;





js/example1-he.js

/**
 * Created by thoryachev on 22.11.2018.
 */
(function (document, apiKey) {

  // Cache DOM Nodes ---------------------------------------------------------------------------------------------------

  const form = document.getElementById('checkout-form-he');
  const submitButton = document.getElementById('submit-button-he');
  const cardProvider = document.getElementById('card-provider-he');
  const errorsMessagesContainer = document.getElementById('errors-he');

  const successQuery = document.querySelector('.first-example-he .success');
  const backFormButton = document.querySelector('.back-on-form1-he');

  const firstNameInput = document.getElementById('first-name-input-he');
  const lastNameInput = document.getElementById('last-name-input-he');
  const emailInput = document.getElementById('email-input-he');
  const phoneInput = document.getElementById('phone-input-he');
  const socialIdInput = document.getElementById('social-id-input-he');

  // Helpers -----------------------------------------------------------------------------------------------------------

  const errorsFromField = {};

  function tokenizationStarted() {
    form.classList.add('fadeOut');
    form.style.display = 'none';
    successQuery.style.display = 'block';
    successQuery.querySelector('.wrap-loading').style.display = 'block';
    successQuery.classList.add('fadeIn');
    submitButton.disabled = true;
    console.log('Tokenization started!');
  }

  function tokenizationFinished(error) {
    successQuery.querySelector('.wrap-loading').style.display = 'none';
    submitButton.disabled = false;
    console.log('Tokenization finished!');

    if(error) {
      console.error(error);

      const failedValidation = {
        field: PayMe.fields.NONE, isValid: false, message: ''
      };

      // Checking is tokenization processing error
      if(error.type && error.type === 'tokenize-error') {
        // Handle tokenization processing error
        const [ firstErrorMessage ] = Object.values(error.errors);
        failedValidation.message = firstErrorMessage;
      } else {
        // Handle other errors from PayMe
        failedValidation.message = error.message;
      }

      toggleValidationMessages(failedValidation);
    } else {
      firstNameInput.value = lastNameInput.value = emailInput.value = phoneInput.value = socialIdInput.value = '';
    }
  }

  function showErrors(errorsFromField, validationResult) {
    let lastElement = errorsFromField[Object.keys(errorsFromField).pop()];
    errorsMessagesContainer.classList.remove('fadeOutDown');
    if (!validationResult.message) {
      errorsMessagesContainer.innerText = lastElement;
    } else {
      errorsMessagesContainer.innerText = validationResult.message;
    }
  }

  function toggleValidationMessages(validationResult) {

    delete errorsFromField[PayMe.fields.NONE];

    if (validationResult.isValid) {
      errorsMessagesContainer.classList.remove('fadeInUp');
      errorsMessagesContainer.classList.add('fadeOutDown');
      delete errorsFromField[validationResult.field]; // delete error from the object that passed validation

      if (Object.keys(errorsFromField).length > 0) { // if the object still has errors - output them
        showErrors(errorsFromField, validationResult);
        errorsMessagesContainer.classList.remove('fadeOutDown');
        errorsMessagesContainer.classList.add('fadeInUp');
      }
    } else {
      errorsFromField[validationResult.field] = validationResult.message; // write errors to the object
      errorsMessagesContainer.classList.remove('fadeOutDown');
      errorsMessagesContainer.classList.add('fadeInUp');
      if (Object.keys(errorsFromField).length > 0) { // check if there is an error in the object
        showErrors(errorsFromField, validationResult); // and show its
      }
    }
  }

  function changeCardProviderIcon(cardVendor) {

    const vendorsToClasses = {
      'unknown': ['fas', 'fa-credit-card'],

      'amex': ['fab', 'fa-cc-amex'],
      'diners': ['fab', 'fa-cc-diners-club'],
      'jcb': ['fab', 'fa-cc-jcb'],
      'visa': ['fab', 'fa-cc-visa'],
      'mastercard': ['fab', 'fa-cc-mastercard'],
      'discover': ['fab', 'fa-cc-discover'],
    };

    for(let i = cardProvider.classList.length-1; i >= 0; i-- ){
        cardProvider.classList.remove(cardProvider.classList[i]);
    }
    let item = vendorsToClasses[cardVendor] || vendorsToClasses['unknown'];
    item.forEach( el => {
      cardProvider.classList.add(el);
    })
  }

  function addClass(fieldId, className) {
    document.getElementById(fieldId).classList.add(className);
  }

  function removeClass(fieldId, className) {
    document.getElementById(fieldId).classList.remove(className);
  }

  function showSuccessQuery(data) {
    successQuery.querySelector('.name').innerHTML = "<span>שם פרטי:</span> " + data.payerName;
    successQuery.querySelector('.email').innerHTML = "<span>דואר אלקטרוני:</span> " + data.payerEmail;
    successQuery.querySelector('.phone').innerHTML = "<span>טלפון נייד:</span> " + data.payerPhone;
    successQuery.querySelector('.socialId').innerHTML = "<span>תעודת זהות:</span> " + data.payerSocialId;
    successQuery.querySelector('.token').innerHTML = "<span>טוקן:</span> " + data.token;
  }

  function runNativeFieldValidator(value, field, messages){
    const validator = PayMe.validators[field];
    const errors = validator.test(value);
    let message;
    if(errors && errors.required) {
      message = messages.required
    }
    if(errors && errors.invalid) {
      message = messages.invalid
    }

    return { isValid: !errors, field: field, message: message };
  }

  function createNativeFieldValidatorHandler(fieldName, messagesObject) {
    return function(ev) {
      const inputNode = this;
      const validation = runNativeFieldValidator(ev.target.value, fieldName, messagesObject);

      if (validation.isValid) {
        inputNode.classList.remove('invalid');
        inputNode.classList.add('valid');
      } else {
        inputNode.classList.remove('valid');
        inputNode.classList.add('invalid');
      }

      toggleValidationMessages(validation);
    }
  }

  // Misc --------------------------------------------------------------------------------------------------------------

  const allFieldsReady = [];

  const DEFAULT_SETTINGS = {
    styles: {
      base: {
        'font-size': '16px',
        '::placeholder': {'color': '#ACD7E4'},
        'text-align': 'right'
      },
      invalid: {
        'color': '#FF0000',
      },
      valid: {
        'color': '#fff',
      },
    }
  };

  // Main --------------------------------------------------------------------------------------------------------------
  function init() {

    // Disable submit button until protected fields initialization
    submitButton.disabled = true;

    // Getting hosted fields integration manager
    PayMe.create(apiKey, { testMode: true, language: 'he' }).then((instance) => {

      const fields = instance.hostedFields();

      // Protected fields ------------------------------------------------------

      // Card Number
      const cardNumberSettings =  Object.assign({}, DEFAULT_SETTINGS, {
        placeholder: 'מספר כרטיס אשראי',
        messages: {
          invalid: 'מספר כרטיס אשראי לא תקין',
          required: 'שדה מספר כרטיס אשראי הינו חובה'
        },
      });
      const cardNumber = fields.create(PayMe.fields.NUMBER, cardNumberSettings);
      allFieldsReady.push(
        cardNumber.mount('#card-number-container-he')
      );
      cardNumber.on('card-type-changed', ev => changeCardProviderIcon(ev.cardType));
      cardNumber.on('keyup', toggleValidationMessages);
      cardNumber.on('keyup', (e) => {
        if (e.isValid) {
          expiration.focus();
        }
        e.isEmpty ? removeClass('card-expiration-group-he', 'animate-card-option') : addClass('card-expiration-group-he', 'animate-card-option');
        e.isEmpty ? removeClass('card-cvv-group-he', 'animate-card-option') : addClass('card-cvv-group-he', 'animate-card-option');
      });

      // Expiry Date
      const expirationField = Object.assign({}, DEFAULT_SETTINGS, {
        messages: {
          invalid: 'כרטיס פג תוקף',
          required: 'שדה תוקף הינו חובה'
        },
      });
      const expiration = fields.create(PayMe.fields.EXPIRATION, expirationField);
      allFieldsReady.push(
        expiration.mount('#card-expiration-container-he')
      );
      expiration.on('keyup', toggleValidationMessages);
      expiration.on('validity-changed', toggleValidationMessages);
      expiration.on('keyup', (e) => {
        if (e.isValid) {
          cvc.focus();
        }
      });

      // CVC/CVV
      const cvcField = Object.assign({}, DEFAULT_SETTINGS, {
        placeholder: 'CVV',
        messages: {
          invalid: 'CVV שגוי',
          required: 'שדה CVV הינו חובה'
        },
      });
      const cvc = fields.create(PayMe.fields.CVC, cvcField);
      allFieldsReady.push(
        cvc.mount('#card-cvv-container-he')
      );
      cvc.on('keyup', toggleValidationMessages);
      cvc.on('validity-changed', toggleValidationMessages);

      // AUX fields ------------------------------------------------------------

      // First Name
      const firstNameMessages = {
        invalid: 'שדה שם פרטי חייב להכיל אותיות בלבד', required: 'שדה שם פרטי הינו חובה'
      };
      firstNameInput.addEventListener(
        'keyup', createNativeFieldValidatorHandler(PayMe.fields.NAME_FIRST, firstNameMessages)
      );
      firstNameInput.addEventListener(
        'focus', createNativeFieldValidatorHandler(PayMe.fields.NAME_FIRST, firstNameMessages)
      );

      // Last Name
      const lastNameMessages = {
        invalid: 'שדה שם משפחה חייב להכיל אותיות בלבד', required: 'שדה שם משפחה הינו חובה'
      };
      lastNameInput.addEventListener(
        'keyup', createNativeFieldValidatorHandler(PayMe.fields.NAME_LAST, lastNameMessages)
      );
      lastNameInput.addEventListener(
        'focus', createNativeFieldValidatorHandler(PayMe.fields.NAME_LAST, lastNameMessages)
      );

      // Email
      const emailMessages = {
        invalid: 'דואר אלקטרוני לא תקין', required: 'שדה דואר אלקטרוני הינו חובה'
      };
      emailInput.addEventListener(
        'keyup', createNativeFieldValidatorHandler(PayMe.fields.EMAIL, emailMessages)
      );
      emailInput.addEventListener(
        'focus', createNativeFieldValidatorHandler(PayMe.fields.EMAIL, emailMessages)
      );

      // Phone Number
      const phoneMessages = {
          invalid: 'טלפון לא תקין', required: 'שדה טלפון הינו חובה'
      };
      phoneInput.addEventListener(
        'keyup', createNativeFieldValidatorHandler(PayMe.fields.PHONE, phoneMessages)
      );
      phoneInput.addEventListener(
        'focus', createNativeFieldValidatorHandler(PayMe.fields.PHONE, phoneMessages)
      );

      // Social Id
      const socialIdMessages = {
        invalid: 'תעודת זהות שגויה', required: 'שדה תעודת זהות הינו חובה'
      };
      socialIdInput.addEventListener(
        'keyup',  createNativeFieldValidatorHandler(PayMe.fields.SOCIAL_ID, socialIdMessages)
      );
      socialIdInput.addEventListener(
        'focus',  createNativeFieldValidatorHandler(PayMe.fields.SOCIAL_ID, socialIdMessages)
      );

      // Wait for fields initialization ----------------------------------------

      Promise.all(allFieldsReady).then(() => submitButton.disabled = false);

      // Form submission handler -----------------------------------------------

      const formSubmit = ev => {
        ev.preventDefault();

        const sale = {

          payerFirstName: firstNameInput.value,
          payerLastName: lastNameInput.value,
          payerEmail: emailInput.value,
          payerPhone: phoneInput.value,
          payerSocialId: socialIdInput.value,

          total: {
            label: '🚀 Rubber duck',
            amount: {
              currency: 'ILS',
              value: '55.00',
            }
          }
        };

        tokenizationStarted();
        toggleValidationMessages({ field: PayMe.fields.NONE, isValid: true});

        instance.tokenize(sale)
          .then(data => {
            console.log('Tokenization result::: ', data);
            showSuccessQuery(data);
            tokenizationFinished();
          })
          .catch(err => {
            alert('Tokenization failed');

            successQuery.style.display = 'none';
            form.style.display = 'block';
            form.classList.remove('fadeOut');
            tokenizationFinished(err);
          });
      };

      // Return and recreate handler -------------------------------------------

      const clickToBackOnForm = () => {
        successQuery.style.display = 'none';

        instance.teardown();

        form.removeEventListener('submit', formSubmit);
        backFormButton.removeEventListener('click', clickToBackOnForm);

        form.classList.remove('fadeOut');
        form.classList.add('fadeIn');
        form.style.display = 'block';
        init();
      };

      // Events binding --------------------------------------------------------

      form.addEventListener('submit', formSubmit);
      backFormButton.addEventListener('click', clickToBackOnForm);

    });
  }

  init();

})(document, 'ac76cbc1-9a83-47a4-82bd-1c82c4979fdd');

-----


Generate Payment with Token
post
https://sandbox.payme.io/api/generate-sale
Overview
This endpoint can be used for the following actions:

Action	Description
Basic Sale (J4)	Allows you to create a sale.
Authorization (J5)	The requested amount gets reserved (blocked) on the credit card of the buyer for up to 168 hours.
You can find more information in our Capture Sale Guide.
Please note that you have to create a payment with token (Buyer Key). That enables to capture token once the buyer pays (enter the payment details).
You can find more information in our Create Payment With Buyer Key (Token) Guide.

You can find examples of the request body in the top-right corner under "Examples".

For all the sale types click here.
Callbacks
Once the sale is paid successfully, we will notify the marketplace with the sale details with a POST of type x-www-form-urlencoded request to the marketplace Callback URL.
You can find the sale callback attributes here.

Issuing an Invoice for a Business
In the case where you are connected to our invoices services, you can send the following parameters as a part of your generate-sale API request to us when paying using a Token (saved card) in our platform.

Please add the following parameters to your request:

Parameter Name	Parameter Type	Example & Limitations
buyer_business_name	string	The name of the business the invoice should be issued for.
buyer_business_code	integer	The business code (VAT identifier) of the company the invoice is issued for.
Request
Body
application/jsonapplication/xmlmultipart/form-data

application/json
seller_payme_id
string
required
MPL. Your private key in PayMe system.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
sale_price
number
required
Sale final price.
For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075.
Note that the minimum value is 500.

Example:
100
currency
string
required
Sale currency. 3-letter ISO 4217 name.

Example:
ILS
product_name
string
required
Short name and description of the product/service.
This text will be shown in the invoice as well, if the seller has enabled the invoices module in his account panel.
Limited to 500 characters

Example:
Phone
transaction_id
string
Merchant's unique sale ID for correlation with us

Example:
12345
installments
string
Amount of installments for the sale. We allow you to manually set the number of installments or to specify a top limit of installments for the buyer to choose from while paying.
Setting a fixed number of installments is simply entering a number between 1 and 12.
The sale will be initiated with this number of installments and the buyer will not be able to change it.
To set a range for the buyer to choose from, enter the following:
103 - allow up to 3 installments
106 - allow up to 6 installments
109 - allow up to 9 installments
112 - allow up to 12 installments

Example:
1
market_fee
number
A decimal representing the percent of the sale price that is collected for the marketplace (includes VAT).
This fee is added on top of our fees and transferred to the marketplace once a month.
Default value is the market fee of the Seller, as set upon Seller creation.

Example:
0.5
sale_send_notification
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
test@testmail.com
sale_return_url
string
We will redirect the IFRAME and the buyer to this URL upon payment success. Default value is taken from the Merchant's settings

Example:
https://www.example.com/payment/success
sale_mobile
string
In case sale send notification is true, provide the phone number to send SMS notification, if the seller has enabled the SMS module in his account panel

Example:
+972525888888
sale_name
string
The name that will be displayed when sending a notification

Example:
John Doe
capture_buyer
string
Flag for requesting the buyer's token for this payment (0 - do not capture token, 1 - capture token). For additional information see Tokens explanation below

Example:
0
buyer_perform_validation
boolean
Flag for performing an online validation of the card with the Issuer.

sale_type
string
You can find all the sale types here.

Example:
sale
sale_payment_method
string
the Payment method used to pay the sale.
For all the payment methods click here.

Example:
credit-card
layout
string
IFRAME payment page layout. Optional attribute which may be used with "bit" sale_payment_method. Avai lable layouts are:dynamic, qr-sms or dynamic-loose dynamic loose removes the validation for the social ID and CVV.

Example:
dynamic
language
string
Changes the language of the payment IFRAME to English, as well as the error messages. Default value is Hebrew (he)

Example:
he
order_number
string
Purchase Order Number

Example:
6545584
items
array[object]
This is an object that should include multiple arrays. An array for each product (item) that is a part of this sale.

name
string
Name of items Maximum length: 26 characters

Example:
shirt
quantity
number
Number of items Maximum length: 12 digits

Example:
1
unit_price
number
Price of single unit in pennies Maximum length: 12 digits

Example:
500
unit_measurement
string
Unit of measurment Maximum length: 12 characters

Example:
"pounds"
total
number
Total Price After Discount Maximum length: 12 digits

Example:
100
discount_total
number
In negative pennies amount Maximum length: 12 digits

Example:
50
description
string
Maximum length: 26 characters

Example:
"free text"
product_code
string
Maximum length: 12 characters

Example:
"ab123"
commodity_code
number
Maximum length: 12 digits

Example:
123456789101
fees
object
Amount of tax in pennies

tax
number
The tax collected as a part of the payment - In pennies Maximum Length: 12 Digits

Example:
5200
duty
number
The international fees collected as a part of the payment - In pennies Maximum Length: 12 Digits

Example:
6000
discount
number
The total discount given for the payment - In pennies Maximum Length: 12 Digits

Example:
8000
shipping
number
The shipping cost charged as a part of the payment - In pennies Maximum Length: 12 Digits

Example:
10000
shipping_details
object
name
string
Individual's full name/Company's name Maximum Length: 50 Characters

Example:
John Doe
email
string
Email address of the addressee Maximum Length: 100 Characters

Example:
test@payme.io
phone
string
Phone number of the addressee Maximum Length: 50 Characters

Example:
+111174448863
address
object
Address Object

billing_details
object
name
string
Individual's full name/Company's name No Limits.

Example:
PayMe
email
string
Email address of the payer No Limits.

Example:
payer@payme.io
phone
string
Phone number of the payer No Limits.

Example:
+111174448863
address
object
Responses
200
500
Sale Created Successfully

Body

application/json

application/json
status_code
integer
Status of the request (0 - success, 1 - error)

Allowed values:
0
1
sale_url
string
The URL of the IFRAME secured payment form to display to the buyer

Example:
https://preprod.paymeservice.com/sale/generate/XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
payme_sale_id
string
Our unique sale ID

Match pattern:
XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
payme_sale_code
number
Our unique sale code (for display purposes only)

Example:
12345678
price
number
Sale final price. For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075

Example:
10000
transaction_id
string
Merchant's unique sale ID for correlation with us

Example:
12345
currency
string
Sale currency. 3-letter ISO 4217 name

Example:
ILS





-----


Post Sale Actions
https://sandbox.payme.io/api
https://live.payme.io/api

Refund Sale
post
https://sandbox.payme.io/api/refund-sale
Overview
Refund request enable you to reimburse a charge that was previously generated but remains unreimbursed. The funds will be returned to the initial payment method used for the charge.

Callback
Once the sale is refunded successfully, we will update the marketplace with the sale details with a POST request of type x-www-form-urlencoded to the marketplace Callback URL.

Note:
You can refund multiple times per sale as long as you do not exceed the total amount of the sale. If you do not send the `sale_refund_amount' parameter, the sale will be fully refunded.

Request
Body

application/json

application/json
payme_client_key
string
required
PayMe Partner Key.

Example:
XXXXXXXX
seller_payme_id
string
required
MPL. Your private key in PayMe system.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
payme_sale_id
string
required
Our unique sale ID.

Example:
SALEDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
sale_refund_amount
integer
Used only for partial refunds, for a full refund exclude this attribute.
For example:
if the amount is 50.75 (max 2 decimal points) the value that recieved is 5075.
Note that the minimum value is 500.

Example:
500
language
string
Changes the error message language to English.

Example:
he
Responses
200
OK

Body
application/jsonapplication/xmlmultipart/form-data

application/json
responses
/
200
/
payme_transaction_acquirer
status_code
integer
Status of the request (0 - success, 1 - error).

Example:
0
status_error_code
integer
Our unique error code.

Example:
500
payme_status
string
Status of the request (success, error)

Example:
success
refunded_from_creditcard
boolean
Return true if seller has not enough money for refund and we complete the refund from the seller credit card.

sale_invoice_number
integer or null
Sale invoice Number.

Example:
123456
sale_invoice_url
string or null
Sale invoice URL, if the seller has enabled the invoices module in his account panel.

Example:
https://www.example.com/XXXXXX.pdf
sale_refund_buffer
integer
The refund buffer of this sale.

Example:
8000
sale_status
string
Refund status.

Example:
refunded
payme_transaction_total
integer
The refund amount that the buyer will get.

Example:
8000
payme_transaction_total_aft_deduction
integer
The amount that the seller will be charge on.

Example:
8000
payme_transaction_id
string
The transaction unique id.

Example:
TRANDEMO-XXXXXX-XXXXXX-XXXXXX
payme_transaction_card_brand
string
Card brand.

Example:
XXXXXXXX
payme_transaction_auth_number
string
Authorization number from credit company.

Example:
123456
payme_transaction_voucher
string
Transaction voucher

Example:
123456
payme_signature
string
MD5 Signature

Example:
75e99dbcb25cdfbe1c62f0b9376f4144
payme_transaction_acquirer
string
Transaction acquirer

Example:
Isracard


Void Sale
post
https://sandbox.payme.io/api/refund-sale - copy
Overview
In order to initiatea void for an authorization, you will be able to do so using the same API call for a refund.

In order to be eligible for a void, the request must be initiated for:

Sale type must be authorization
The amount required to be voided must be the equal to amount requested and authorized initially.
Sale Types
You can find all the sale statuses here.

Request
Body

application/json

application/json
seller_payme_id
string
required
MPL. Your private key in PayMe system.

Match pattern:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
payme_sale_id
string
required
Our unique sale ID.

Match pattern:
SALEDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
sale_currency
string
Sale currency.

Example:
USD
language
string
Changes the error message language to English.

Default:
he
Responses
200
OK

Body
application/jsonapplication/xmlmultipart/form-data

application/json
responses
/
200
/
payme_signature
status_code
integer
Status of the request (0 - success, 1 - error).

status_error_code
integer
Our unique error code.

payme_status
string
refunded_from_creditcard
boolean
Return true if seller has not enough money for refund and we complete the refund from the seller credit card.

sale_invoice_number
integer or null
Sale invoice Number.

Example:
123456
sale_invoice_url
string or null
Sale invoice URL, if the seller has enabled the invoices module in his account panel.

Example:
https://www.example.com/XXXXXX.pdf
sale_refund_buffer
integer
The refund buffer of this sale.

Example:
8000
sale_status
string
Refund status.

Example:
refunded
payme_transaction_total
integer
The refund amount that the buyer will get.

payme_transaction_total_aft_deduction
integer
The amount that the seller will be charge on.

payme_transaction_id
string
The transaction unique id.

Example:
TRANDEMO-XXXXXX-XXXXXX-XXXXXX
payme_transaction_card_brand
string
Card brand.

Example:
XXXXXXXX
payme_transaction_auth_number
string
Authorization number from credit company.

Example:
123456
payme_transaction_voucher
string
Transaction voucher

Example:
123456
payme_signature
string
MD5 Signature

Example:
75e99dbcb25cdfbe1c62f0b9376f4144


Capture Sale
post
https://sandbox.payme.io/api/capture-sale
Overview
This endpoint enable you to execute the sale after authorization (generate-sale with sale_type = "authorize").

For more information, go to the Capture Sale (Authorization) Guide.

Request
Body

application/json

application/json
payme_client_key
string
PayMe Partner Key.

Match pattern:
XXXXXXXX
seller_payme_id
string
MPL. Your private key in PayMe system.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
payme_sale_id
string
Our unique sale ID

Match pattern:
SALEDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
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
sale_paid_date
status_code
integer
Status of the request (0 - success, 1 - error)

Example:
0
payme_status
string
Status of the request (success, error)

Example:
success
payme_sale_id
string
Our unique sale ID.

Example:
SALEDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
payme_sale_code
integer
Sale code

Example:
123456
sale_created
string
The date the sale was created (timestamp)

Example:
2021-11-02 16:36:13
payme_sale_status
string
Sale status. You can find all the sale statuses here.

Example:
completed
sale_status
string
Sale status. You can find all the sale statuses here.

Example:
completed
currency
string
Sale currency. 3-letter ISO 4217 name.

Example:
ILS
transaction_id
string
The transaction ID.

Example:
12345
is_token_sale
boolean
Indicates if the sale paid with token.

price
integer
The sale price.

Example:
100
payme_signature
string
PayMe's signature for the payment

Example:
0efd912d7dc26c658f841e577afa2b79
sale_description
string
Sale description

Example:
Description
payme_transaction_id
string
PayMe transaction ID

Example:
TRAN1635-8638707F-FDCJJP3T-0IJMAP8K
payme_transaction_total
string
Transaction total amount

Example:
1000
payme_transaction_card_brand
string
The card brand

Example:
Visa
payme_transaction_auth_number
string
Transaction authorization number

Example:
5973894
buyer_name
string
Buyer's full name

Example:
John Doe
buyer_email
string
Buyer's email address

Example:
Test@example.com
buyer_phone
string
Buyer's phone number

Example:
+972520000000
buyer_card_mask
string
Card mask

Example:
458045******4580
buyer_card_exp
string
Buyer's card expiration date

Example:
10/26
buyer_card_is_foreign
boolean
Is the card foreign or domestic? (For IL Sellers only)

buyer_social_id
string
Buyer's social ID number

Example:
999999999
installments
integer
Number of installments used for the payment

Example:
12
sale_paid_date
string
Sale paid date

Example:
2021-11-02 16:36:13


Cancel Multi Payment Page
post
https://sandbox.payme.io/api/cancel-template
Overview
This endpoint enable you to cancle a Multi Payment Page.

Multi Payment Page enables payments on a single sale link, by multiple buyers.
You can find more information in our Multi Payment Page Guide.

Request
Body

application/json

application/json
seller_payme_id
string
required
MPL. Your private key in PayMe system.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
payme_sale_id
string
required
Our unique sale ID.

Example:
SALEDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
Responses
200
251
305
OK

Body
application/jsonapplication/xmlmultipart/form-data

application/json
status_code
integer
Status of the request (0 - success, 1 - error).

Example:
0


---



Activate Service
post
https://sandbox.payme.io/api/vas-enable
Overview
Apple Pay VAS-Enable
In order to be able to use Apple Pay in our platform, you will need to set up the service via API.

Website Enrollment Procedure
After you added the Apple's file into the proper folder and path of your website, you can use our VAS Enable request to sign your website for the Apple Pay service on our platform.

By using the Activate service API request, you will need to register your websites to PayMes system.

The request works as in the following form:

{
  "payme_client_key": "payme_partner_key",
  "seller_payme_id": "MPLDEMO-MPLDEMO-MPLDEMO-1234567",
  "vas_payme_id": "VASLDEMO-VASLDEMO-VASLDEMO-1234567",
  "vas_data": {
      "websites": [
      "payme.io", "marketplace.payme.io"
      ]
  },
  "language": "en"
}
A successful response will be 200 and includes a payload in the form of:

{
    "status_code": 0,
    "seller_payme_id": "MPLDEMO-MPLDEMO-MPLDEMO-1234567",
    "vas_payme_id": "VASLDEMO-VASLDEMO-VASLDEMO-1234567",
    "vas_description": "Payments Account",
    "vas_type": "AlternativePaymentMethod",
    "vas_api_key": "",
    "vas_is_active": true,
    "vas_payer_type": 2,
    "vas_price_currency": "ILS",
    "vas_price_setup_fixed": 0,
    "vas_price_periodic_fixed": 0,
    "vas_price_periodic_variable": "0.00",
    "vas_price_usage_fixed": 0,
    "vas_price_usage_variable": "0.00",
    "vas_market_fee": null,
    "vas_period": 1,
    "vas_data": {
        "websites": [
            "test5.paymeservice.com"
        ]
    }
}
A failed response will be 500 and includes a payload in the form of:

{
    "status_code": 1,
    "status_error_details": "The service was not activated",
    "status_additional_info": null,
    "status_error_code": 720
}
Request
Body

application/json

application/json
payme_client_key
string
required
Your PayMe API Partner Key.

Example:
payme_partnerkey
seller_payme_id
string
required
The unique seller ID the service is activated for.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
vas_payme_id
string
required
The service activation unique partner ID.

Example:
VASLDEMO-VASLDEMO-VASLDEMO-1234567
vas_data
object
required
websites
array[string]
required
The websites domains the service is activated for.
Example: https://payme.io

Match pattern:
https://payme.io
language
string
required
Allowed values:
he
en
Example:
he
Responses
200
500
OK

Body
application/jsonapplication/xml

application/json
responses
/
200
/
vas_data
.
websites[]
status_code
number
0 - Success 1 - Failure

Example:
0
seller_payme_id
string
Our unique seller ID.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
vas_payme_id
string
The partner unique service API key.

Example:
VASLDEMO-VASLDEMO-VASLDEMO-1234567
vas_description
string
The description of the service that was activated.

Example:
"Payments Account"
vas_type
string
The type of the service that was activated.
You can find all the VAS types here.

Example:
"AlternativePaymentMethod"
vas_api_key
string
Empty by default.

vas_is_active
boolean
Was the service activated successfully

vas_payer_type
number
Internal payer identity.
1 = Partner 2 = Seller 3 = Reseller

Example:
2
vas_price_currency
string
The currency that the service is charged in.

Example:
ILS
vas_price_setup_fixed
number
Partner account configuration of the setup costs.

Example:
0
vas_price_periodic_fixed
number
Partner account configuration of the periodical costs.

Example:
0
vas_price_periodic_variable
string
Partner account configuration of the periodical costs.

Example:
"0.00"
vas_price_usage_fixed
number
Partner account configuration of the fixed costs.

Example:
0
vas_price_usage_variable
string
Partner account configuration of the usage costs.

Example:
"0.00"
vas_period
number
Example:
1
vas_data
object
The peiod of the VAS charge.
Instant = 1, Daily = 2, Monthly = 3, Yearly = 4

websites
array[object]
The websites domains the service is activated for.




Generate Sale with Apple Pay
post
https://sandbox.payme.io/api/generate-sale
Overview
In order to initiate the process of paying using Apple Pay APM, you will first need to initiate a generate-sale request to our API.

The request shall include "apple-pay" as the sale_payment_method.

Request
Body

application/json

application/json
seller_payme_id
string
required
Our unique seller ID (MPL).

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
sale_price
string
required
The sale price.

Example:
1000
currency
string
required
The sale currency (ISO 4217 Code).

Example:
ILS
product_name
string
required
What is the payment for.

Example:
T-Shirt
language
string
The language of the user interface.

Example:
he
sale_payment_method
any
required
The payment method used for the transaction.

Allowed value:
apple-pay
sale_type
string
required
The required sale type.

Example:
sale
Responses
200
500
Body

application/json

application/json
string


Generate New Authorization
post
https://sandbox.payme.io/api/generate-sale
Overview
The Israeli Direct Debit alternative payment method works in a two-phase setup:

Setting up the bank authorization <- You are here
Completing the payment using the bank authorization
Bank Authorization Setup
In order to setup the bank Authorization, you will need to use our generate-sale endpoint, using a few specific parameters.

sale_type = token
sale_payment_method = il-direct-debit
The authorization page is based on our hosted-payment-page and will collect information regarding the buyer's identity and bank account.

After the buyer completes the setup, the authorization will be sent to the bank and will be inactive until we receive an update (takes up to 96 hours).

Callbacks
You will get two callbacks:

Callback that indicates that the sale complete - Not relevant, as the sale_type is from type "token" and not sale.
* You can find all the sale types here
* You can find all the sale callbacks here
Callback that inditates the authorization status - You can find all the bank authorization statuses here.
{
"status": 1,
"error_code": "11",
"internal_reference_id": 10000,
"customer_name": "Test test",
"charge_limit": 200
}
Testing
Information for testing can be found here - Israeli Direct Debit Testing Information.

Please note that in our sandbox environment you will receive only bank authorization statuses from type 1 or 2 (Success/failure). You can find all the bank authorization statuses here.

Request
Body

application/json

application/json
seller_payme_id
string
required
The MPL the authorization will be given for

Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
sale_price
string
required
Must be included, won't be charged as a part of the authorization setup

Example:
1000
currency
string
required
Sale currency. 3-letter ISO 4217 name.

Example:
ILS
product_name
string
required
Use a generic value here (will not affect the authorization setup process)

Example:
test
language
string
The language the page will be presented in

Example:
he
sale_type
any
required
The sale type. For authorization setup, use token by default

Allowed value:
token
sale_payment_method
any
required
The sale payment method. Must be il-direct-debit for the authorization setup process

Allowed value:
il-direct-debit
sale_return_url
string
The URL the user will be redirected to after completing the authorization setup process

Example:
https://payme.io
Responses
200
OK

Body

application/json

application/json
status_code
string
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
XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
payme_sale_code
integer
Our unique sale code (for display purposes only)

Example:
12345
price
integer
Sale final price. For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075

Example:
10000
transaction_id
string
Transaction ID

Example:
123456
currency
string
Example:
ILS
sale_payment_method
string
The sale payment method. Must be il-direct-debit for the authorization setup process

Example:
il-direct-debit


Generate New Payment
post
https://sandbox.payme.io/api/generate-sale - copy
Overview
The Israeli Direct Debit alternative payment method works in a two-phase setup:

Setting up the bank authorization
Completing the payment using the bank authorization <- You are here
Generate a new payment using Israeli Direct Debit
In order to setup a new payment using the Israeli Direct Debit alternative payment method, you will need to use our generate-sale endpoint, using a few specific parameters.

sale_type = sale
sale_payment_method = il-direct-debit
include a buyer-key parameter as a part of your generate-sale request in order to initiate the payment flow
Callbacks
Status	Description
Success	In case the payment was successful, you won't get any callback. Please note that the payment process can take up to 8 days.
Failure	In case that payment failed, you will get a callback indicates on failure.
Testing
Information for testing can be found here - Israeli Direct Debit Testing Information.

Request
Body

application/json

application/json
seller_payme_id
string
required
The MPL the authorization will be given for

Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
sale_price
string
required
Must be included, won't be charged as a part of the authorization setup

Example:
1000
currency
string
required
Sale currency. 3-letter ISO 4217 name.

Example:
ILS
product_name
string
required
Use a generic value here (will not affect the authorization setup process)

Example:
test
language
string
The language the page will be presented in

Example:
he
sale_type
any
required
The sale type. For authorization setup, use token by default

Allowed value:
sale
sale_payment_method
any
required
The sale payment method. Must be il-direct-debit for the authorization setup process

Allowed value:
il-direct-debit
sale_return_url
string
The URL the user will be redirected to after completing the authorization setup process

Example:
https://payme.io
Responses
200
OK

Body

application/json

application/json
status_code
string
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
XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
payme_sale_code
integer
Our unique sale code (for display purposes only)

Example:
12345
price
integer
Sale final price. For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075

Example:
10000
transaction_id
string
Transaction ID

Example:
123456
currency
string
Example:
ILS
sale_payment_method
string
The sale payment method. Must be il-direct-debit for the authorization setup process

Example:
il-direct-debit




-




Subscriptions
Export
v1.0
Based on our payments infrastructure, you can initiate recurring payments in a few different flows.

Subscriptions
Template Subscription
Also known as “Multilink-Subscription”. Enables payments on a single subscription link, by multiple buyers. For example, you will be able to generate a single subscription and share its payment link on any social network site to allow multiple customers to pay on their own.Note: Every payment will create a new subscription with a different ID.Creation of a template subscription should be done by adding the sub_type="template" attribute to the request:

Attribute	Description
sub_type	template Creates a new subscription as a template. The template subscription link does not expire.
Callbacks
We provide the option to notify of any status or action updates regarding the subscription. To use the feature it is required to provide a sub_callback_url parameter to the generate-subscription call. This URL will receive all callbacks using a POST request of type x-www-form-urlencoded.

Subscription Iteration Types
ID	Description
1	Daily
2	Weekly
3	Monthly
4	Yearly
Subscription Statuses
ID	Description
1	Initial (not yet paid)
2	Active (paid successfully)
4	Failed
5	Canceled
6	Completed
7	Failed, pending automatic retry
Subscription Callback Notification Types
Notification	Description
sub-create	The subscription was created
sub-active	The subscription was paid
sub-iteration-success	Subscription iteretion passed successfully
sub-complete	The subscription's iteretations have reached its predetermined max and finished
sub-cancel	The subscription was canceled
sub-failure	An error happened and the subscription payment was failed
Generating tokens for recurring card payments
Please note that you can receive a token representing the buyer (including credit card information) as part of the generate-sale API call. This token can be used to generate future server-to-server sales without requiring the buyer to re-enter his credit card information. The token will be returned only as part of the callback.

Getting Tokens
There are two ways of getting a token:

In order to receive a token in addition to charging the credit card use the capture_buyer attribute. In order to receive a token without charging the credit card use the dedicated sale_type attribute and set the value to token.

Attribute	Description
capture_buyer	1 Flag for requesting the buyer's token in addition to charging the credit card (0 - do not capture token, 1 - capture token)
sale_type	token Flag for requesting the buyer's token without charging the credit card
Charging Tokens
After generating a token you may charge the buyer at any point by using the buyer_key attribute when generating a new sale.

Attribute	Description
buyer_key	XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX Buyer key for an instant-payment with the token



---
Capture Buyer Token
post
https://sandbox.payme.io/api/capture-buyer-token
Overview
This endpoint can be used only if you are PCI compliant and are able to handle raw credit card infromation.

This end-point is used to create a new token, by sending a request with the full credit card data and getting a response with the token. This token can be used later on to perform sales and other payment actions.

Request
Body

application/json

application/json
seller_payme_id
string
required
Our unique seller ID

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
buyer_name
string
Buyer's full name

Example:
John Doe
buyer_social_id
string
Buyer's social ID number

Example:
123456789
buyer_email
string
Buyer's email address

Example:
test@example.com
buyer_phone
string
Buyer's phone number

Example:
+9720520000000
buyer_zip_code
string
Buyer's address zip code

Example:
ab123
credit_card_number
integer
required
Card number

Example:
411111******1111
credit_card_exp
string
required
Buyer's card exp (MMYY)

Example:
0324
credit_card_cvv
integer
required
Example:
123
buyer_perform_validation
boolean
Flag for performing an online validation of the card with the Issuer.

Responses
200
356
500
OK

Body

application/json

application/json
status_code
integer
Action status code (0 - Success, 1 - Failure)

Example:
0
buyer_key
string
Buyer's unique token

Example:
BUYER154-6871560P-JTIYXZZ5-5AYG0LQX
buyer_name
string
Buyer's full name

Example:
John Doe
buyer_email
string
Buyer's email address

Example:
test@example.com
buyer_phone
string
Buyer's phone number

Example:
+9720520000000
buyer_card_mask
string
Buyer's card mask

Example:
411111******1111
buyer_card_exp
string
Buyer's card exp (MMYY)

Example:
0324
buyer_social_id
string
Buyer's social ID number

Example:
999999999
buyer_is_permanent
boolean
Is the token temporary or permanant

buyer_status
integer or null
The status's buyer

Example:
0 = Unused, 1 = Active, 10 = Inactive

Generate Sale with Token
post
https://sandbox.payme.io/api/generate-sale
Overview
Generating tokens
Please note that you can receive a token representing the buyer (including credit card information) as part of the generate-sale API call. This token can be used to generate future server-to-server sales without requiring the buyer to re-enter his credit card information. The token will be returned only as part of the callback.

Obtaining Tokens
There are two ways of obtaining a token:

In order to receive a token in addition to charging the credit card use the capture_buyer attribute. In order to receive a token without charging the credit card use the dedicated sale_type attribute and set the value to token.

Attribute	Description
capture_buyer	1 Flag for requesting the buyer's token in addition to charging the credit card (0 - do not capture token, 1 - capture token)
sale_type	token Flag for requesting the buyer's token without charging the credit card
Charging Tokens
After generating a token you may charge the buyer at any point by using the buyer_key attribute when generating a new sale.

Attribute	Description
buyer_key	XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX Buyer key for an instant-payment with the token
Request
Body

application/json

application/json
seller_payme_id
string
MPL. Your private key in PayMe system.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
sale_price
integer
For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075. Note that the minimum value is 500.

Example:
100
currency
string
Sale currency. 3-letter ISO 4217 name.

Example:
ILS
product_name
string
Short name and description of the product/service. This text will be shown in the invoice as well, if the seller has enabled the invoices module in his account panel. Limited to 500 characters

Example:
Phone
transaction_id
string
Merchant's unique sale ID for correlation with us

Example:
12345
installments
string
Amount of installments for the sale. We allow you to manually set the number of installments or to specify a top limit of installments for the buyer to choose from while paying. Setting a fixed number of installments is simply entering a number between 1 and 12. The sale will be initiated with this number of installments and the buyer will not be able to change it. To set a range for the buyer to choose from, enter the following:
103 - allow up to 3 installments
106 - allow up to 6 installments
109 - allow up to 9 installments
112 - allow up to 12 installments

Example:
1
market_fee
number
A decimal representing the percent of the sale price that is collected for the marketplace (includes VAT). This fee is added on top of our fees and transferred to the marketplace once a month. Default value is the market fee of the Seller, as set upon Seller creation.

Example:
0.5
sale_send_notification
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
test@testmail.com
sale_return_url
string
We will redirect the IFRAME and the buyer to this URL upon payment success. Default value is taken from the Merchant's settings

Example:
https://www.example.com/payment/success
sale_mobile
string
In case sale send notification is true, provide the phone number to send SMS notification, if the seller has enabled the SMS module in his account panel

Example:
+972525888888
sale_name
string
The name that will be displayed when sending a notification

Example:
John Doe
capture_buyer
boolean
Flag for requesting the buyer's token for this payment (0 - do not capture token, 1 - capture token). For additional information see Tokens explanation below

buyer_perform_validation
boolean
Flag for performing an online validation of the card with the Issuer.

sale_type
string
You can find all the sale types here.

sale_payment_method
string
the Payment method used to pay the sale. For all the payment methods click here.

layout
string
IFRAME payment page layout. Optional attribute which may be used with "bit" sale_payment_method. Avai lable layouts are:dynamic, qr-sms or dynamic-loose dynamic loose removes the validation for the social ID and CVV.

Example:
dynamic
language
string
Changes the language of the payment IFRAME to English, as well as the error messages. Default value is Hebrew (he)

Example:
he
Responses
200
OK

Body

application/json

application/json
status_code
integer
Status of the request (0 - success, 1 - error)

Example:
0
sale_url
string
The URL of the IFRAME secured payment form to display to the buyer

Example:
https://sandbox.paymeservice.com/sale/generate/XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
payme_sale_id
string
Our unique sale ID

Example:
SALEXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
payme_sale_code
integer
Our unique sale code (for display purposes only)

Example:
12345678
price
integer
Sale final price. For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075

Example:
10000
transaction_id
string
Merchant's unique sale ID for correlation with us

Example:
12345
currency
string
Sale currency. 3-letter ISO 4217 name.

Example:
Get Buyer Key
post
https://sandbox.payme.io/api/get-buyer-key
Overview
This API endpoint will allow you to get the buyer-key created and used to pay for a certain payment request in our system.

Use Case for Israeli Direct Debit
Once a new authorization request is created and the buyer is approved, a new buyer key is generated behind the scenes and can be obtained using this API endpoint.

Request
Body

application/json

application/json
payme_sale_id
string
required
Our unique sale ID.

Example:
SALEDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
seller_payme_id
string
required
Our unique seller ID.

Example:
MPL1DEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
Responses
200
600
OK

Body

application/json

application/json
payme_sale_id
string
Our unique sale ID.

Example:
SALEDEMO-XXXXXXXX-XXXXXXXX-XXXXXXXX
buyer_key
string
Buyer's unique token.

Example:
BUYER154-XXXXXXXX-XXXXXXXX-XXXXXXXX
buyer_card_mask
string
Buyer's card mask.

Example:
411111******1111
buyer_card_expiry
string
Buyer's card exp (MMYY).

Example:
0324
buyer_card_brand
string
Buyer's card brand.

Example:
AMEX
status_code
null




Generate
post
https://sandbox.payme.io/api/generate-subscription
Overview
This endpoint is used to generate new subscriptions. You can find more information in our guide - How to create a subscription .

Request
Body
application/jsonjsonapplication/xmlmultipart/form-data

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
sub_currency
string
required
Subscription currency. 3-letter ISO 4217 name.

Example:
USD
sub_price
string
required
A single iteration final price.
For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075. Note that the minimum value is 500

sub_description
string
required
The description of the service/product

Example:
Description
sub_iteration_type
integer
required
1 - Daily, 2 - Weekly, 3 - Monthly, 4 - Yearly

Allowed values:
1
2
3
4
language
string
Changes the language of the payment IFRAME to English, as well as the error messages. Default value is Hebrew (he)

sub_start_date
string
Subscription initiation date.
For iteration type = 3 (monthly) the day value should be between 1 to 28

Default:
current date
Example:
18/08/2021 15:15
sub_payment_method
string
Sale Payment Method (for the list see Payment Methods)

Example:
credit-card
sub_type
number
subscription type: 1-regular, 10-template

Example:
1
buyer_key
string
Buyer key for subscription payment with the token. Relevant only for sub_type = regular.
This key is received through the use of capture_buyer.
Note that with this attribute no need to activate pay-subscription.

Example:
BUYER168-XXXXXXXX-XXXXXXXX-WQIWVVLB
subscription_id
string
Merchant's unique subscription ID for correlation with us

Example:
12345
sub_iterations
number
The iterations count set for the subscription.
Default value is set to unlimited by -1 value.

Default:
-1
Example:
4
sub_callback_url
string
Callback response to your page regarding updates on subscription events.

Example:
https://www.example.com/payment/callback
sub_return_url
string
Once the subscription was paid successfully, the user will be redirected to this URL
Relevant to the first subscription iteration, if it is paid through our iframe.

Example:
https://www.example.com/payment/callback
sub_indicative_name
string
Indicative name for the subscribition

sub_email_address
string
Email address of the subscription payer

Example:
name@gmail.com
sub_indicative_mobile
string
Phone number to send receipt

sub_send_notification
boolean
Indication if to send notifications on subscription events.

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
sub_error_text
sub_url
string
Subscription Unique URL

Example:
https://sandbox.paymeservice.com/subscription/generate/XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
status_code
string
Status code (0 - sucess, 1 - failed)

Example:
0
payme_status
string
PayMe updated status`

Example:
success
seller_payme_id
string
Example:
MPLDEMO-MPLDEMO-MPLDEMO-MPLDEMO
seller_id
string
Our unique seller ID

Example:
12345
sub_payme_id
string
PayMe's unique subscription ID

Example:
XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
sub_payme_code
string
PayMe's subscription code

Example:
1
subscription_id
string
Subscription unique ID

Example:
12345
sub_created
string<string>
The date the subscription was created

Example:
18/08/2021 15:15
sub_start_date
string
Subscription initiation date

Example:
18/08/2021 15:15
sub_prev_date
string
Previous subscription payment date

Example:
2016-11-05 15:04:23
sub_next_date
string
Subscription next payment due date

Example:
2016-11-05 15:04:23
sub_status
string
Subscription status (0 - active, 1 - inactive)

Allowed values:
1
0
sub_iteration_type
string
1 - Daily, 2 - Weekly, 3 - Monthly, 4 - Yearly

Allowed values:
1
2
3
4
sub_currency
string
Subscription currency. 3-letter ISO 4217 name.

Example:
ILS
sub_price
string
A single iteration final price.
For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075. Note that the minimum value is 500

Example:
10000
sub_description
string
Subscription description - What is the subscription for?

Example:
3 Months - SaaS services
sub_iterations
string
The iterations count set for the subscription according to the request command

Example:
4
sub_iterations_completed
number
The number of iterations completed for the specific subscription

Example:
3
sub_iterations_left
string
Count of iteration left for the specific subscription

Example:
1
sub_paid
boolean
Was the subscription fully paid or not

status_error_code
number
Error code in case of an error

Example:
0
sub_error_text
string
Error description in case of an error


Pay
post
https://sandbox.payme.io/api/pay-subscription
Overview
Relevant only for Direct API Integration

This endpoint is used to pay subscriptions. You can find more information in our guide - How to create a subscription .

Request
Body
application/jsonjsonapplication/xmlmultipart/form-data

application/json
sub_payme_id
string
Our unique subscription ID

Example:
SUB16885-68336QPL-UQSSS1CC-SYKXI53N
credit_card_number
string
Buyer's credit card number

Example:
45804******04580
credit_card_cvv
string
Buyer's credit card CVV

Example:
123
credit_card_exp
string
Buyer's credit card expiary date

Example:
0429
buyer_email
string
Buyer's email address

Example:
test@gmail.com
buyer_name
string
Buyer's full name

Example:
John Doe
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
buyer_social_id
status_code
integer
Cancellation status code ( 0 - Success, 1 - Failure)

Example:
0
payme_status
string
PayMe status

Example:
success
seller_payme_id
string
Our unique seller ID (MPL)

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
sub_payme_id
string
Subscription ID

Example:
SUB16885-68336QPL-UQSSS1CC-SYKXI53N
sub_payme_code
integer
Subscription code

Example:
477004
sub_created
string
Subscription creation timestamp

Example:
2023-07-05 17:45:36
sub_start_date
string
Subscription start timestamp

Example:
2023-07-05 17:45:36
sub_prev_date
string
Subscription last payment date

Example:
2023-07-05 17:45:36
sub_next_date
string
Subscription next payment date

Example:
2023-07-12 17:45:36
sub_status
integer
You can find all the subscription statuses here

Example:
2
sub_iteration_type
integer
You can find all the subscription iteration types here

sub_currency
string
Subscription currency

Example:
ILS
sub_price
integer
Total subscription price

Example:
100
sub_description
string
Subscription description

Example:
Services
sub_iterations
integer
Number of iterations

Example:
3
sub_iterations_completed
integer
Number of iterations that was paid

Example:
1
sub_iterations_skipped
integer
The count of unpaid iterations and their corresponding dates have elapsed.

Example:
0
sub_iterations_left
integer
The count of iterations left

Example:
2
sub_paid
boolean
Indicates if the current iteration paid

Default:
true
sub_payment_date
string
The payment due date

Example:
2022-08-15 15:51:29
buyer_card_mask
string
Buyer's credit card number

Example:
458045******4580
buyer_card_exp
string
Buyer's credit card expiary date

Example:
0429
buyer_name
string
Buyer's full name

Example:
John Doe
buyer_email
string
Buyer's email address

Example:
test@gmail.com
buyer_phone
string or null
Buyer's phone number

Example:
+7920521234567
buyer_social_id
string or null
Buyer's social ID

Example:
123456789



Cancel
post
https://sandbox.payme.io/api/cancel-subscription
Overview
This endpoint is used to cancel existing subscriptions.

Request
Body

application/json

application/json
seller_payme_id
string
required
Our unique seller ID

Example:
MPLXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
sub_payme_id
string
required
Our unique subscription ID

Example:
SUBXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
language
string
Changes the error message language to English. Default value is Hebrew (he)

Example:
en
Responses
200
500
OK

Body

application/json

application/json
status_code
string
Cancellation status code ( 0 - Success, 1 - Failure)

Example:
0


Pause
post
https://sandbox.payme.io/api/pause-subscription
Overview
Relevant only for Direct API Integration

This endpoint is used to pause subscriptions. You can find more information in our guide - How to create a subscription .

Request
Body

application/json

application/json
seller_payme_id
string
MPL. Your private key in PayMe system.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
sub_payme_id
string
PayMe's unique subscription ID

Example:
SUBDEMO-SUBDEMO-SUBDEMO-SUBDEMO
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
buyer_phone
status_code
integer
payme_status
string
status_error_code
integer
seller_payme_id
string
seller_id
null
sub_payme_id
string
sub_payme_code
integer
subscription_id
null
sub_created
string
sub_start_date
string
sub_prev_date
null
sub_next_date
string
sub_status
integer
sub_iteration_type
integer
sub_currency
string
sub_price
integer
sub_description
string
sub_iterations
integer
sub_iterations_completed
integer
sub_iterations_skipped
integer
sub_iterations_left
integer
sub_paid
boolean
sub_error_text
string
sub_payment_date
string
buyer_card_mask
string
buyer_card_exp
string
buyer_name
string
buyer_email
string
buyer_phone
string
buyer_social_id
string


Resume
patch
https://sandbox.payme.io/api/subscriptions/{sub_payme_id}/resume
Overview
Relevant only for Direct API Integration

This endpoint is used to resume subscriptions is in status "paused". You can find more information in our guide - How to create a subscription .

Request
Path Parameters
sub_payme_id
string
required
Headers
PayMe-Merchant-Key
string
MPL. Your private key in PayMe system.

Responses
200
OK


Update Price
patch
https://sandbox.payme.io/api/subscriptions/{sub_id}/set-price
Overview
This endpoint is used to update a subscription price. This will apply subscriptions in status "active" or subscription template in status "initial".

You can find more information in our guide - Subscriptions .

Request
Path Parameters
sub_id
string
required
Body

application/json

application/json
seller_payme_id
string
required
MPL. Your private key in PayMe system.

Example:
MPLDEMO-MPLDEMO-MPLDEMO-1234567
sub_price
string
required
A single iteration final price. For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075. Note that the minimum value is 500

Example:
5075
Responses
200
400
OK

Body

application/json

application/json
status_code
integer
Status of the request (0 - success, 1 - error)>
Allowed values 0 1

Example:
0


Subscription
Export
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
sub_currency
string
required
Subscription currency. 3-letter ISO 4217 name.

Example:
USD
sub_price
string
required
A single iteration final price.
For example, if the price is 50.75 (max 2 decimal points) the value that needs to be sent is 5075. Note that the minimum value is 500

sub_description
string
required
The description of the service/product

Example:
Description
sub_iteration_type
integer
required
1 - Daily, 2 - Weekly, 3 - Monthly, 4 - Yearly

Allowed values:
1
2
3
4
language
string
Changes the language of the payment IFRAME to English, as well as the error messages. Default value is Hebrew (he)

sub_start_date
string
Subscription initiation date.
For iteration type = 3 (monthly) the day value should be between 1 to 28

Default:
current date
Example:
18/08/2021 15:15
sub_payment_method
string
Sale Payment Method (for the list see Payment Methods)

Example:
credit-card
sub_type
number
subscription type: 1-regular, 10-template

Example:
1
buyer_key
string
Buyer key for subscription payment with the token. Relevant only for sub_type = regular.
This key is received through the use of capture_buyer.
Note that with this attribute no need to activate pay-subscription.

Example:
BUYER168-XXXXXXXX-XXXXXXXX-WQIWVVLB
subscription_id
string
Merchant's unique subscription ID for correlation with us

Example:
12345
sub_iterations
number
The iterations count set for the subscription.
Default value is set to unlimited by -1 value.

Default:
-1
Example:
4
sub_callback_url
string
Callback response to your page regarding updates on subscription events.

Example:
https://www.example.com/payment/callback
sub_return_url
string
Once the subscription was paid successfully, the user will be redirected to this URL
Relevant to the first subscription iteration, if it is paid through our iframe.

Example:
https://www.example.com/payment/callback
sub_indicative_name
string
Indicative name for the subscribition

sub_email_address
string
Email address of the subscription payer

Example:
name@gmail.com
sub_indicative_mobile
string
Phone number to send receipt

sub_send_notification
boolean
Indication if to send notifications on subscription events.