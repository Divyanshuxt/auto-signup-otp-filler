# Auto Signup & OTP Filler

A Chrome Extension built with JavaScript and Chrome Extension Manifest V3 that automates supported form-filling workflows and retrieves OTPs through the Mail.tm REST API.

🚀 Features

- Automatically generates user information for supported forms
- Creates temporary email accounts using the Mail.tm REST API
- Retrieves and extracts OTPs from incoming emails
- Uses Chrome Runtime Messaging to communicate between extension components
- Handles dynamically loaded forms using MutationObserver
- Includes a popup interface to control the extension

🛠️ Technologies Used

- JavaScript
- HTML
- CSS
- Chrome Extension APIs
- Manifest V3
- REST APIs
- Async/Await
- DOM Manipulation
- MutationObserver

⚙️ How It Works

Popup
  ↓
Content Script
  ↓
Background Service Worker
  ↓
Mail.tm REST API
  ↓
OTP Retrieval
  ↓
Content Script
  ↓
Form Filling

The extension uses Chrome Runtime Messaging to coordinate communication between the popup, content script, and background service worker.

Project structure
auto-signup-otp-filler/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png

Installation
Clone or download this repository.
Open Chrome and go to chrome://extensions/.
Enable Developer mode.
Click Load unpacked.
Select the project folder.

Future Improvements
Improve support for different form structures
Improve error handling and user feedback
Add more configuration options
Improve the popup interface

Author
Divyanshu
BCA Student at Presidency College, Bengaluru
Interested in Software Development
