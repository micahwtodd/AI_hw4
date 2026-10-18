# Usability improvements

Four changes for Problem 9. The reason each one helps a Campus Customs shopper or the business is left blank on purpose.

### FRONT-END

## 1. Recently viewed

A window shows the last four products a shopper opened. The list is kept in that browser, so a guest sees it too. It does not follow them to another computer.

Why this helps a Campus Customs shopper or the business: When testing out the website, i noticed it was annoying to scroll up and down the chat window to find items. A recent history window saves the last four items the user or guest viewed, so you can cycle back and forth.

## 2. Clear chat history

A Clear chat history control asks for confirmation, then wipes the conversation on the screen. For a logged-in shopper it also deletes that person's saved rows in the database. It does not delete anyone else's history.

Why this helps a Campus Customs shopper or the business: the chat window history could get long, and i also added the ability to clear chat history as a privacy feature for the user. When deleting chat history, the user is askied to confirm whether they really want to delete it, as it is removed from the database too. 

### BACK-END

## 1. Reply appears as it arrives

The assistant's words show in the chat while the answer is still coming in, instead of waiting until the whole reply is finished. The assistant still chooses its catalogue tools and still answers from the database.

Why this helps a Campus Customs shopper or the business: The chat window is unfortunately slow (~10s response time), but reducing model calls seemed to break the code and other website features. To improve customer experience, I added the ability to stream responses so the customer doesn't get impatient and leave the page. the previous code used "...Sending...." notification but it seemed like the chat was hung up, even though it was working. Streaming the responses keeps the customer engaged rather than leaving the page.

## 2. Chat limit

Each shopper can send 50 messages per hour. Past that, the shop shows a warning and does not send the question to the model.

Why this helps a Campus Customs shopper or the business: When asking Cursor to identify vulnerabilities, it correctly noted the chat window has no message cap, and each message calls the API Key, so a bad actor (or chatty person in general) could spam the chat and run up the token usage costs. I implemented a 50-message limit per hour (resets), plus a warning notice, to limit chat spamming. This keeps busienss costs at a manageable level without sacrificing too much customer experience, can't imagine someone would need more than 50 messages to make a purchase. 
