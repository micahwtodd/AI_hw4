# AI Prompts

Prompts are logged verbatim, in the order they are entered in this chat. Each problem starts with a header for the problem number and name. Individual prompts are tagged Prompt 1a, Prompt 1b, and so on. Prompt subsections are indented under their problem.

## Problem 1: Vibe coder prompts

  ### Prompt 1a

  Hey bud! back for AI homework #4. We're building a reak customer website with a helpful chatbot. I'm going to build a react+vite typescript front end and a python fastapi backend whose brain is a pydanticAI agent. Shoppers should be able to browse products and create accounts and chat about merch. Also, they should see matching items appear on the page, and get sincere answers about price and stock from a local database, which we'll get to later in the problem set.  I'll use my openAI key via portkey. Please use gpt-6-luna and keep my API secure. remember, my API key changed since the prior homeworks because i got aggressive on models (oops). please only use luna and do not use anything fancier. The end result of this project will be a public github repo - ill submit the repo URL and professor will grade it. you should not commit the database or product images. First, please confirm we are working in the 2026.10.24 HW4 directory, and do all work in this root folder. I also attached our course-to-date lecture slides for context. The last lecture was very new to me so this should help you explain some of the tricker context when i get stuck. First, create AI_prompts.md using the same format and structure as prior homeworks, and update it as i work. tag each prompt under each question and label them using the format from prior homeworks. My running site, database writes, and screenshots will be the evidence. please ensure this file includes the problem number and title, my verbatim prompts, and any follow ups should be tagged under the corresponding questions. This prompt should be tagged under Problem 1: Vibe coder prompts. Please review this setup and structure, then we'll start coding.

  ### Prompt 1b

  thanks. Couple more things about this project before we begin: the agent's calls should use my Open AI API key via portkey, hidden of course. the campus_customs.db file will have tables for the product catalogue, invesntory by size, and users with hashed passwords. product image file paths are in the catalogue table. i'll research Yale's Campus Customs webpage to learn the style of their page and information for my agent prompt, once we get there. Ready to move on?

  ### Prompt 1c

  thanks, please unzip the data.zip folder in this workspace

## Problem 2: Analyze the database

  ### Prompt 2a

  thanks. We are now moving onto Problem 2: Analyze teh databse. what is the best way to view the database here? I'd like to udnerstand waht's going on.

  ### Prompt 2b

  how do i install sqlite viewer extension?

  ### Prompt 2c

  Cursor says the publisher is untrusted. what are the risks of installing?

  ### Prompt 2d

  please double check the error in the terminal

  ### Prompt 2e

  also, please update Problem 2's label in AI_prompts to "Analyze the database"

  ### Prompt 2f

  where can i find the output?

  ### Prompt 2g

  thanks, i'd like to view the first 10 rows of each table. can you summarize that information for me?

  ### Prompt 2h

  please list the fields under each table

  ### Prompt 2i

  Thanks. Please create a file called output/harness.md. copy these lists into it (each table and its fields), plus the helpful type and key information you listed. I'll manually add one short line on why each field matters for the shop or chatbot

  ### Prompt 2j

  please pull the first 10 rows of each table, will all fields, so i can compare

  ### Prompt 2k

  please show the data as tables in this window, and delete the file you just created. i just want to view a summary here in Cursor

  ### Prompt 2l

  there is a disconnect between the fields you listed above, and whats shown in the table. for example, the catalogue lists a "description" field, but it doesnt show up in your table. Can you please reconcile?

  ### Prompt 2m

  i updated the harness with my one-sentence descriptions. Can you please review and adjust as necessary? They should concisely explain why each matters for the agent or chatbot.

  ### Prompt 2n

  hmm some of these aren't quite right and overrode some important edits, please review and double check your work

  ### Prompt 2o

  thanks. now please review the harness for accuracy and make sure these descriptions are solid

## Problem 3: Build the Campus Customs website

  ### Prompt 3a

  We are now moving onto Problem 3: Build the Campus Customs website. please scaffold a React + Vite + TypeScript front end for Campus Customs. put a nav bar at the top that links to the following main pages: Home, Products, About Us, Log in, Create Account. I will write the the Home and About Us sections in my own voice. On the Products page, please show product imagines from the catalogue (using the image paths in the databse) with basic product info like name, price, and short description. Add other fields you think are relevant but report them back to me here. clickling each product should open a single-item page with a large image on one side, full product text on the other, and teh description, price, and sizes/stock once i have them. Clicking a card on Products should take the shopper there. The site should use Yale themed colors, be clean and well-organized, and professional. i'll review your initial setup. Please also adda  chat interface in the bottom right of the site. a floating chat panel is fine. it doesn't need to talk to an agent yet, we'll set that up later. a stub that will call the backend later is enough for this problem. It is fine to start a simple FASTAPI app in backend/main.py just to serve products and images, then we'll grow it innto the agent backend later in Problem 5. You can save the Vite React TypeScript app in frontend/. please let me know if any of these instructions are unclear, and repeat next steps back so i can review before building anything.

  ### Prompt 3b

  for 1 - you can add inventory but it wont be dyanmic until we set up the back end. fine to add, but please remember to connect them live when setting up the back end.

  For 2 - correct. for 3 - also correct.

  I agree with the extra fields you would show.

  Please proceed. ill review and evaluate your work

  ### Prompt 3c

  thanks. couple changes: please remove the short descriptions from the products page, and add a search or filter bar to the side. Then, review publicly available, credible, and reputable sources for web design considerations and incorproate them into this page. Consider academic literature, consulting firms, and other expert input and incorporate it into your design. Then tell me then 10 most important things you changed. the goal is to make this webpage as crisp as possible from a shopper's perspective. we really want to impress our smart professor!   also please make the chat button a little large and have it shake a bit for emphasis

  ### Prompt 3d

  Thanks, this imrpoved the structure but what about the design? Can you add background pictures of Yale's campus? What do those sources suggest for making the website less bland?

  ### Prompt 3e

  not the best photo, do you have anything less bleak? And can we make it smaller?

  ### Prompt 3f

  Please put this prompt under Problem 3: for the About Us page, use the following information: Campus Customs is a screen printing and mbroidery company fofering bespoke solutions and a broad range of promotional apparal for companies, institutions, clubs, teams, and events. Most of our items are locally sourced in New Haven, CT, surrounded by delicious pizza restuarants. We serve clients of all sizes and can meet your needs at any scale. Please call us to learn more about efficient and affordable solutions to promote your brand. 

  ### Prompt 3g

  Please also log this under Problem 3: Update the home page with the following: 

  Campus Customs was founded in 1975 when the Cobden family Yale University memorabilia retail store near the campus. Founded on exceptional customer service and ethical business practices, we strive to build long-lasting relationships with our clients, because that's what matters most.

  Our capabilities now include large-scale screen printing and embroidery, web store design and online fulfillment, graphic design, and complete event merchandise services. Our local production facility allows for quick processing times so we can serve you faster, with a personal touch. We can't promise every delivery will come with a slice of New Haven Pizza, but it sure might feel like it.

  -The Cobden Brothers

  ### Prompt 3h

  the missing word is "founded"

  ### Prompt 3i

  whoops please change it to "started"

  ### Prompt 3j

  "started a"






## Problem 4: Create account and login

  ### Prompt 4a

  we'll come back to Home and About us once we're further along. Now, let's move onto Problem 4: Create account and login. Please build a normal create-account and login flow. Create account should include first name, last name, email, password, and confirm password. the log in should include email and password. new accounts go into the users table. please store passwords securely so hackers (like humans and AI) and other bad actors cannot access them. the database already has a test user we can use while building (1) email; test@campuscustoms.yale.edu, (2) password; password, (3) has function; PBKDF2-HMAC-SHA256, 120000 iterations (stored as pbkdf2_sha256$salt$hash).

  How the login should check a password: never un-hash the stored value. re-hash what the use typed and compare. read the salt out of the stored string, do not make a new one at login. hash the typed password with that same salt, then compare to the stored hash. use a constant-time compare. signup and login must use the same has settings (same function, same salt handling, same iteration count). my understanding is that even if they differ, the right password will not match. we will test this by logging in as the needed user and a new account we'll create once you set everything up. please scaffold this, then update harness.md with a sew section explaining how authorization works based on this prompt. Then please review for other security considerations we should include

  ### Prompt 4b

  thanks. please add a logout notification when the user logs out, and redurect them to the home page

  ### Prompt 4c

  thanks, when the user logs in, you display their name in the top right. can you please make it so cliucking their name shows basic account info like first name, last name, and email? make it friendly and welcoming, and ask how the user is doing

  ### Prompt 4d

  in the name callout, can you make it say "Account info" as the header. please also remove the borders around the name and log out buttons, they are distracting

  ### Prompt 4e

  can you please pull up the top rows of the user database, and all fields, and summarize them in this window?

## Problem 5: PydanticAI agent backend

  ### Prompt 5a

  looks great, thanks! we are now moving onto Problem 5: PydanticAI agent backend. please build the shop chatbot as a PydanticAI agent behind FastAPI, and plug it into my front-end chat widget we just made. Put the API app in backend/main.py, which will be the file we run with uvicorn. keep the agent as these frou files next to it (similar idea as homework 3).

  backend/prompts/prompt.md should include the system prompt, which we will grow later.
  backend/agent.py will include agent entry and wiring
  backend/tolls.py contains tools the agent can call
  backend/models.py has the Pydantic / PydanticAI structured types.

  in backend/main.py, plesae expose a chat route so a message from the website returns a reply from the agent, and anything else i need for products and authorization. the agent will require my API key, which you should keep protected and hidden. i have a new key that i'll need to enter. use gpt-6-lune, and do not use more expensive models. 

  Please put a campus customs voice and safety basics into prompts/prompt.md (we'll expand tools and safety later). Start or update types in models.py for chat replies and product cards where needed. in output?harness/md, please briefly describe how the front end talks to FastAPI and how the agent is loaded (prompt file + model). The back end should run from the backend/ folder using this command:
  uvicorn main:app --reload --port 8000

  Please let me know where anything is unclear. Once you set everything up, please draw a diagram in this box with a flowchart that shows how these things connect. Explain any decisions you're making behind the scenes so i can validate them.

  ### Prompt 5b

  thanks. where is the API key pointing? How did you find one without me telling you what to use?

  ### Prompt 5c

  yeah why are we using a windows variable rather than reading from the .env file? how did that happen?

  ### Prompt 5d

  thanks. i just updated the .env file. please try rerunning, ensuring only the .env file is used

  ### Prompt 5e

  please confirm the API key is safe and not read, committed, or shared

  ### Prompt 5f

  thanks. please provide the backend terminal command so i can check it

  ### Prompt 5g

  please review the errors in terminal and diagnose

  ### Prompt 5h

  thanks. is the shop running? Where is the front end? My chats dont receive responses

  ### Prompt 5i

  why is the response so slow?

  ### Prompt 5j

  should we turn reasoning off?

  ### Prompt 5k

  still takes about 10 seconds, what else causes the delay?

  ### Prompt 5l

  is there anything we can do to speed portkey answers up?

  ### Prompt 5m

  elaborate more on why we have two calls - why is the model called to decide to search?

  ### Prompt 5n

  ok lets leave it. here are some voice and safety basics for the Campus Customs chatbot that should go into prompts/prompt.md: Talk snazzy, like Jarvis from Ironman but with a cowboy twang. be friendly, polite, and responsive. do not use offensive language. If you get stuck or do not understand the customer's question, be patient and deferential and ask them to elaborate on their request

## Problem 6: Tools: product info and stock

  ### Prompt 6a

  We are now moving onto Problem 6: Tools: product info and stock. the goal is to create tools that look up real information from the campus_customs.db. Please create tools that lookup (1) product description, 2 Price, and 3 how many are in stock by size when the customer asks. The agent has to use the database and cannot invent prices or quantities. For example, if a size is out of stock, the agent should say so. do not assume items can be backordered. Make sure prompts/prompt.md is updated so the agent knows to call these tools for related questions about price and stock and product description questions. please add or update return types in models.py. Also, given my comments about chatbot speed, please ensure the code is stuctured efficiently, but ask me before making major changes that would conflict with the homework assignment instructions i've given so far. please confirm you understand

  ### Prompt 6b

  thanks, in output/harness.md, please list each tool and the model fields for lookup results. i'll add why we chose them

  ### Prompt 6c

  can you please restart the back-end so i can test this out?

  ### Prompt 6d

  when i ask for items, the chat doesnt seem to recognize items that exist (grey t-shirts), and when i ask for alternatives, the chatbot provide links to items that do not exist. Plesae validate these prompts work in the chatbot "do you have any grey t-shirts?" and "yes please recommend three alternatives" and paste the responses here, with links if applicable

  ### Prompt 6e

  thanks, please restart the backend

  ### Prompt 6f

  and provide link to the front end

  ### Prompt 6g

  Something is inherently wrong because this worked before, we must have changed something that broke it. now, the chatbot doesnt respond with links:

  bot: Ask about Yale gear. I can help with price and what is in stock.

  me: Hi, im looking for blue hoodies. have any?

  bot: You bet—I found these blue hoodies for you:

  me: how many / what are the sizes?

  bot: Happy to check, partner, but I need the specific hoodie name to give you accurate sizes and quantities. Could you share which blue hoodie you had in mind?

  me: i'm asking about products in general, why do you need the specific name?

  bot: You’re right—I shouldn’t have made you choose a specific hoodie. I checked blue hoodies generally, but the stock lookup didn’t return size quantities, so I can’t give you a reliable size-by-size count yet. If you meant one of the blue hoodies from the earlier results, tell me its name and I’ll check that style, partner.

  Is this because we reduced the portkey calls earlier to speed up the code?

  ### Prompt 6h

  this is better! however, to confirm - we want the chatbot to figure out what to find even if the customer mispells things or uses different terminology, we dont want the code to hard-code "shirts, t-shirts" etc. Can you please review the code, ensure it is dynamic, and recommend changes? please preview them with me before proceeding

  ### Prompt 6i

  I agree with these changes, please implement

  ### Prompt 6j

  Thanks. this looks better. please update the harness with why we chose these fields based on this back and forth

## Problem 7: Chat search that updates the page

  ### Prompt 7a

  We are now moving onto Problem 7: Chat search that updates the page. when a customer asks about a type of item, for example "what kind of shirts do you have?" the agent should search the catalogue and the website should dynamically show those matching items as product cards, including the image, name, price, and short info. the homework says this is an "API contract:" the agent reutrns structured product matches and then the front end renders them on the website. the professor says it should look cool! After the dynamic product cards are loaded by this new feature we're building, make sure the same single-item page behavior we built in problem 3 still works. Each product card, including the ones the chat just put on the webpage, should still open that detailed view with the large image and full info when clicked. Please update prompts/prompt.md and add a new section to  output/harness.md that make it clear how search results reach the page.   Please repeat back what i am asking so i can validate your understanding, then i will confirm you can proceed

  ### Prompt 7b

  thanks, please proceed

## Problem 8: Customer memory

  ### Prompt 8a

  Thanks. We are now moving onto Problem 8: Customer memory. whena  shopper is logged in, the code should save their chat history in the database in an appropriate table and reload it when they return. the agent should know who is chatting, so include their name and email. Please put all this in "Deps", or an equivalent clear pattern, and/or tools the agent can call. You should pass enough page context that if someone is on a product page and asks a qestion, like "do you have this in blue?" the agent knows what they mean. Problem 8 hints that you can put code into the agent context. 

  Guests can still chat, but history should persist for logged-in users. in the harness file, please add a new section that documents how user chat hsitory is stored, what customer fields the agent sees, and how page context is passed.

  This terminology is all very new to me. Please explain what "deps" means and also explain the hint, i.e. what "putting code in the agent context" means in plain english. Then summarize next steps before proceeding

  ### Prompt 8b

  thanks. please pull the top 5 rows of each database, showing all fields, and summarize in this window so i can refamiliarize myself

  ### Prompt 8c

  thanks, i agree we should continue updating the chat_messages databse. please proceed with the code updates. If you are uncertian of anything, just ask

## Problem 9: Usability improvements

  ### Prompt 9a

  dang this is really cool! just tested it out with Lolisa's sample account and it stored the info, thank you. let's keep moving and ill come back and play around witt this later. now we are moving onto Problem 9: Usability improvements. I need to implement 2 front-end improvements and two agent or backend usability improvements. for front-end: Please add (1) a "recently viewed" window that shows the last four items a user viewed, even if they are a guest and (2) an option to clear chat history for both guests and logged-in users.

  For the back-end, please (1) suggest ways to make the agent and chatbot faster without sacrificing the things we've discussed. please also suggest (2) some safety features i may not have already added. Web design is new to me, so ill need some help with the back-end ideas. 

  Please anticipate any challenges or issues with my suggestions and discuss options. Please repeat these instructions back to me before updating any code

  ### Prompt 9b

  for recently viewed: its fine that guests recent history cannot be tracked and only stays local in the browser. Please update clear chat to "clear chat history" and make it clear it deletes the history in the database too, maybe add a warning pop up.

  For speed, please implement the change that shows the reply as it arrives. do not implement the other changes. Please add a safety check that throttles the chat cap so customers can't burn through my portkey limit. limit it to 50 messages per user per hour, and add a warning notice if that gets exceeded. go ahead and make the updates, test them, and ill review. let me know if you encounter any issues. Before you start code though, please create a file output/usability.md that lists each of the four imrpovements i'm adding, then i'll go in and manually type why it helps a campus customs shopper or the business.

  ### Prompt 9c

  Thanks. Couple points of feedback: (1) the recently viewed section is too big. Can you please make it smaller in terms of height, and use icon / link sizing similar to the short link references that the chatbot recommends? (2) i just cleared lolisa's chat history, can you please confirm it was removed from the database? (3) can you please run a test of the 50 message cap but without running porkey calls so we don't burn tokens? Test is fine, i just want to prove that 50 consectuive chat messages trigger the warning and cap. (4) i just asked the chat for sweatpants and got this response, with no link. can you please diagnose? Do we need to restart the back end?

  ### Prompt 9d

  yes, please tigthen instructions so the bot says whether a product is missing. new recently viewed window looks great!

  ### Prompt 9e

  thanks. please shut down and restart the backend, and send me the link to the front end

  ### Prompt 9f

  here is another interesting issue: when i ask the chatbot to find Yale garb, it doesnt find anything in the catalogue. but basically the entire catalogue is yale apparel. explain why the chatbot got this wrong, and propose suggestions to fix it. We want the chatbot to handle ambiguity like this, without making up fake facts.

  ### Prompt 9g

  Let's go with the first. please create a catalogue overview tool that reads the garment types and how many products are in each, so broad searches call that tool. Please make sure it is coded efficiently and does not slow the chat down

  ### Prompt 9h

  thansk. please updates our documenation accordingly, like the harness

## Problem 10: Style the website

  ### Prompt 10a

  Thanks. we are now moving onto Problem 10: style the website. We've done some of this along the way, but I'll add more creative design to the website so it feels like a real Campus Customs storefront. I get more points for imaginative design, so please make sure you implement my suggestions with some flair, while following the best web design practices we looked up earlier. Please save a list of these changes in output/design.md, with my verbatim rationales below, with a succinct header for each change. The professor wants this file to be concrete and short. I will probably edit these descriptions manually.

  Here are the changes:
  1) Add the Yale Logo to the top left. The website feels flat without it and lacks the clear Yale emphasis we're going for here, should help customers engage with their sense of Yale identity and school spirit. 
  2) please change the background from this off-white / tan to white, and ensure the entire site uses Yale's standard color scheme and font format. This table stakes edit creates consistency with the university. Current colors are a little wonky.
  3) on the Products page, please add an option to sort the products by price, color, size, and quantity in stock. Please also add icons that give the option to view as a grid, like the page currently does, or as a list, using smaller pictures with the product names, prices, and short descriptions. The current setup is somewhat cumbersome and some people prefer list views with more products, less detail.
  4) Some of the pictures have black backgrounds, while others have white. Can you use white for all for consistency, or is this an issue with the underlying pictures? Do not edit the underlying pictures themselves, just the backgrounds. Please tell me how you plan to address this before changing anything. 
  5) The wiggling chat window is fun, but can you add a friendly Yale bulldog named Handsome Dan above it that says "Need help? Let's chat!" 
  6) Please make the stock yale photos at the top transition to new photos every 7 seconds, highlighting the university's cool architecture. This will add some pep to the website without distracting from core clothing themes. 
  7) when the mouse cursor hovers over an item, please add a small "Choose options" box that shows the products color and size options, and prices.
  8) add a shopping cart! can't believe we forgot about this. the shopping cart icon should be in the top right of the webpage and show anything the shopper added. it should not allow shoppers to buy more than the current inventory.

  ### Prompt 10b

  please move the "choose options" box to the bottom right of each picture. make it so the user has to click the box to open the options, hovering is too distracting. and please open the box in a new window in a new box on the page that darkens out everything else so it captures the users attention, and put an x button in the top right to close it. Please make the shopping cart logo an actual shopping cart and write "Shopping Cart" next to it. Also, the handsome dan bulldog is comically bad. As much as i'd love to keep it in, let's do better. here is a yale bulldog picture you can sample for your work. do not use it or save it in this project, other than to create a fun caricature of handsome dan based on it. Also, when i click on the cart icon, please add an option to take me to a dedicated shopping cart page. right now the cart box isnt big enough and the "remove" action is getting cut off, so please make it a little wider

  ### Prompt 10c

  better, but needs some tweaks. for shopping cart: see how the remove button is cut off? Can you move it more to the left of the shopping cart box?

  for choose options - please put the box at the bottom right of the item's grid box instead. Can you also make the quantities dynamic based on the color and sizes chosen? When a user slects a different color, can you change the picture to that color?

  ### Prompt 10d

  also, handsome dan looks like a sheep! let's just do his head, give him shorter floppy ears, and a deep undebite with floppy jowls, and a cute little tongue poking out

  ### Prompt 10e

  can you please remove the outline box surrounding remove? its still cut off, see here:

  ### Prompt 10f

  Thanks, please also add an "Empty cart" option to the shopping cart. can you clean up our handsome dan bulldog?> his face is all wonky

  ### Prompt 10g

  his eyebrows arent aligned, and his mouth is still droppying below his teeth and his tongue is too low too

  ### Prompt 10h

  remove the teeting and pink thing, just do the mouth and tongue, the mouth should come downa  little, and the top of the tongue should connect to the bottom of the blackmouth

  ### Prompt 10i

  Thanks. Please track this next prompt under Problem 10: please make the "Choose options" boxes only appear if the cursor hovers over the product box, otherwise it stays hidden. Please also make the bulldog's tongue 40% shorter


## Problem 11: Site testing (app check)

  ### Prompt 11a

  Thanks, we are now moving onto Problem 11: Site testing (app check). we'll test the live site and document it in output/app_check.html, which should be a webpage I can double-click open. I must include clear screenshots and short captions for (1) chat checking the inventory of an item (honest stock/price from the database), (2) the dynamic search-result cards appearing after a category questions (for examnple hoodies), and (3) one of the usability features i added in Problem 9. This html file should be easy to grade. It shoudl include a heading for each check, screenshot for each check, and one or two sentenace about what the screenshot proves. Put the screenshot image files in output/app_check/images/ and link them from app_check.html with relative paths, for example app_check_images/inventory.png. Please scaffold and create everything, and i'll give you the screenshots to add. please confirm if anything is unclear

  ### Prompt 11b

  the first check will require multiple screencaps. please merge and append them into one screencap. first one attached. now, please report to me, using the database directly, the number of Fencing Left Chest Hoodie in sotck for size medium

  ### Prompt 11c

  please show me the actual database rows - do not alter the data, but show that record and all corresponding fields

  ### Prompt 11d

  please append this screenshot:

  ### Prompt 11e

  then, please append this screenshot:

  ### Prompt 11f

  please pull the exact price for Medium Fencing Left Chest Hoodie from the database, including all fields, so i can validate that here as well

  ### Prompt 11g

  please append this screenshot as well. then we'll move onto the next check for product cards

  ### Prompt 11h

  here is the hoody screenshot

  ### Prompt 11i

  please append this screenshot as well

  ### Prompt 11j

  thanks, now we're moving to check three - here is the screenshot

  ### Prompt 11k

  thanks. Please add the following descriptions:

  Check #1 - verifies the chatbot correctly imports the size, quantity, and prices from the database. Screenshot shows  user asking for Fencing Left Chest Hoody in Medium, and returns 15 in stock and $68 price, which matches the database fields. 

  Check #2 - verifies that a chatbot request for blue shirts pulls up shirts that are in fact blue. Screenshot verifies that both the product boxes and chat window show blue shirts, like the School of Management Crest t-shirt. Please note the first shirt, 2025 Yale Vs harvard T Shirt, does in fact come in Nacy blue although that particular color isn't pictured in the short description box, and is therefore correctly included.

  Check #3 - I added a "recently viewed" panel so users could flip back and forth with four recent items. The screenshot proves the last four items i clicked show up at the top Recently Viewed items bar in corresponding order (see numbers in red text)

  ### Prompt 11l

  thanks. please put the descriptions above the screenshots, and add a soft thin horizontal grey bar above each transitional section for readability

## Problem 12: Audit trail, safety, finish harness

  ### Prompt 12a

  We are now moving onto Problem 12: Audit trail, safety, finish harness. Please create an append-only output/audit_trail.json log of agent-loop activity including time, tool name, short args/result, and stop readson. do not wipe it between runs. we added a lot of safety rules to the agent, but here are some more. please put them in prompts/prompt.md

  ## Class harness

    These rules apply to agents working on apps and course projects in this workspace.

    ## Tools

      ### AI model

      - Use `gpt-6-luna` as the default model for application work.
      - Keep the model configurable through `OPENAI_MODEL`; do not hard-code it in multiple files.
      - Use a smaller model only for simple, low-risk tasks when cost or latency matters.

      ### Dependencies

      - For PydanticAI with OpenAI or Portkey, put `pydantic-ai-slim[openai]` in `requirements.txt`.
      - Do not use the full `pydantic-ai` package unless the project specifically needs its additional providers and integrations. The full package pulls many unnecessary extras and can make installs very large or stall.
      - Keep dependencies focused and document any deliberate exception.

    ## Stopping rules

      ### Dash run and stop rules

      - Run Dash with `use_reloader=False`, or run with debug mode off, so one edit does not spawn multiple servers.
      - Before starting an app again, check whether an orphan server is using its port. For the default port 8050 in PowerShell:

        ```powershell
        netstat -ano | findstr :8050
        taskkill /PID <pid> /F
        ```

      - Change `8050` when the app uses another port.
      - When stopping a Dash app, kill the whole application process tree, not only whatever process currently owns port 8050. Confirm that child Python processes have stopped before restarting.

    ## Guardrails

      ### API keys and secrets

      - Never hard-code API keys, tokens, passwords, or other secrets in source code, notebooks, or documentation.
      - Load secrets from environment variables, normally through a local `.env` file during development.
      - Use `PORTKEY_API_KEY` from `.env` for all AI calls routed through Portkey.
      - Use `OPENAI_API_KEY` only when making direct OpenAI calls instead of routing through Portkey.
      - Add `.env` and other secret files to `.gitignore`; commit a `.env.example` containing variable names only.
      - Never print or expose secret values in logs, screenshots, error messages, or generated files.
      - If a secret is exposed, stop using it and rotate or revoke it immediately.

      ### App appearance

      - Keep the interface responsive and accessible: maintain sufficient contrast, use descriptive labels, and show clear loading and error states.

      ### Dropbox and OneDrive

      - Pause Dropbox or OneDrive syncing, or exclude `.venv`, while creating a virtual environment and running `pip install`.
      - Live sync during environment creation or installation can lock files and corrupt or stall the virtual environment.
      - Keep virtual environments local to the project and never commit them.

      ### Project hygiene

      - Keep each app's source, requirements, configuration examples, and documentation together in its project folder.
      - Make small, focused changes and verify the app starts cleanly after dependency or run configuration changes.


  Next, please update the @output/harness.md  file so it is clear how the system works. We've done a lot of this already, but identify any changes we've made that arent captured or could be refined. Please make sure we included the model fields in models.py and why i chose them, tools and abilities, safety rules, and specs (loop limits, result caps, models, and how to run the front and back end). Do not update the harness without my permission, please suggest changes and ill confirm them

  ### Prompt 12b

  please extenmd audit results to 250 character limit. thanks, please remove the Dash app language too and anything else this project does not follow or are not relevant.

  For harness: add 1, 2, 3, and 4. please add the gaps in 5, since we already discussed them earlier in the chat

  ### Prompt 12c

  Thanks. we are almost done, but before we move on - please perform and exhaustive check of our work so far. Make sure all the code runs, the safety features are in place, there are no errors, and that everything is self-contained so i can upload this to GitHub and the professor / TAs can run it locally. You should re-run any self checks we did earlier, if they are still relevant

## Problem 13: Push to GitHub and submit the url

  ### Prompt 13a

  Thanks. we are now moving onto Problem 13: Push to GitHub and submit the url. please put all this code in a folder called hw4. we will push this to a public github repo so the professor can clone it and grade it. do not include the .env, campus_customs.db, or product images in the Github repo. use .gitignore and .env.example placeholders only.

  here is the expected file layout, please ensure my work conforms. the agent itself should be four files under backend/ prompts.prompt.md, agent.py, tools.py, and models.py. Please create a file named README.md that explains how to run the front-end and back-end after placing the data pack

  ### Prompt 13b

  also, please ensure mian.py is a FastAPI app that runs with: uvicorn main:app --reload --port 8000

  ### Prompt 13c

  to be clear, you shouldnt commit anything to github until i tell you

  ### Prompt 13d

  were you interrupted, or did you finish the tasks i gave you?

  ### Prompt 13e

  there are many files in the backend folder like deps.py, memory.py, and audit.py that you didnt copy into the hw4 folder, why? what do they do?

  ### Prompt 13f

  the code won't run without them, correct?

  ### Prompt 13g

  ok, you should have made those same changes in the root directory. before copying anything into the hw4 folder, please update the root directory first, then copy the final files into hw4. hw4 should be the final version of everything. We want both to look similar in structure, other than what the homework tells us not to upload

  ### Prompt 13h

  thanks, please close anything using the hw4 folder

  ### Prompt 13i

  ok lets try this again. I removed the h4 folder. you moved a lot of code around. please restart the backend, and re-perform all your unit testing. Make sure our safety rules are all still in place. Try asking teh chatbot for blue hoodies, check size and inventory against the database, verify the website works, that users can create accounts (use test account), and log in to the test account and check the user's history. Then perform and end-to-end review of the code. make sure our folder structure aligns with the professor's desired output. When you are done, make any relevant updates to the harness, reqwuirements.txt, and README. Make sure it is clear how to run the tool. Do not make up results or invent facts. if you get stuck or have issues, please tell me. This prompt should be logged under Problem 13.

  ### Prompt 13j

  thanks. now, please copy everything into the hw4 folder. make sure you do not include the database or pictures or API key

  ### Prompt 13k

  thanks. please push this folder to this public git repository: https://github.com/micahwtodd/AI_hw4.git
