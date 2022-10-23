# Medusa Twilio Message Plugin

The Twilio Message Plugin offers a way to interact with the Message API from Medusa events.

## Cover Image
![cover image with stars and colored shading in the background as well as foreground text MEDUSA HACKATHON SUBMISSION Twilio Message Plugin](https://user-images.githubusercontent.com/116348315/197195527-6768341b-f51f-4f17-bdce-aa36bee253ed.png)

## Demo Link
N/A

# About

## Participants
 - [@stletoss](https://github.com/stletoss)
 - [@binallll](https://github.com/binallll)

## Description
Integrate Twilio with Medusa, to notify per SMS when the discount applied is over the threshold.

## Preview
![Screenshot with SMS from +1999999999 with text "From Medusa: order #170945 with discount OVER threshold placed!"](https://user-images.githubusercontent.com/116314863/197367877-3f4fc21e-3e69-4aa4-ad99-2fdb53592326.jpg)

## Prerequisites/Setup/Installation
 - install & setup medusajs/medusa
 - clone this repo
 - link with your package manager, [see the docs](https://docs.medusajs.com/advanced/backend/plugins/create/#test-your-plugin)
 - register/login at Twilio, get your Account SID & Auth Token
 - verify your phone number with Twilio, to send message to yourself (as sender and receiver)
 - edit config (see below)
 - run & have fun

## Config
Follwowing changes must be made your medusa-config.js:
```js
{
	resolve: `medusa-plugin-twilio-message`,
	options: {
		ORDER_DISCOUNT_THRESHOLD: `<double>`, //threshold from 0.0 to 1.0
		TWILIO_ACCOUNT_SID: `ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`, // Find your Account SID at twilio.com/console
		TWILIO_AUTH_TOKEN: `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` // Find your Auth Token at twilio.com/console
		SENDER_N_RECIPIENT: `+1999999999` //destination phone number in E.164 format
	}
}
```

## Resources
 - [Twilio Message Docs](https://www.twilio.com/docs/sms/api/message-resource#create-a-message-resource)
 - [Medusa Plugin Test](https://docs.medusajs.com/advanced/backend/plugins/create/#test-your-plugin)
