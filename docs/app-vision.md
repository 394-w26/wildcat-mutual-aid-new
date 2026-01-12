# Name

- The app is called Wildcat Mutual Aid.

# Users

- Users are software development teams who do mob programming with drivers and navigators.

# Value proposition

A platform where Northwestern University students can request for help or offer help (example: giving rides or lending tools). The app connects students around campus and keeps track of request.

# Key features

Simple mobile-friendly one-screen design with the app name at the top, and below it:
- Northwestern University themed design
- Log in or sign up page using Northwestern University email and password
- Sign up page allows users to input name, year, and major  
- Initial dashboard screen similar to Reddit with a scrollable list of current requests
- Plus icon at the top of the page to create a new request which prompts a request form which includes title and description
- On the dashboard, users can click on a request and click an offer help button. It will send a notification to the creator of the request, informing them that someone offered help. - If the user clicks on a request after offering help, it should display that they already offered help to prevent them from re-offering.
- Bell icon also at the top of the page which directs users to the notification center. Users can see if someone has offered help on their request. It should show which request is being offered help and the offering user's name, year, and major. The requestor can click the accept button which will display the offering user's Northwestern email address and prompt them to contact them to coordinate meet-up. 
- The requestor can also decline the offer. The offer will then be removed from their notification center. 

# Example scenario

Here is an example session.

- Alice is a sophomore who just arrived back on campus after winter break and does not own a car.
- Alice needs a ride to HMart to get groceries, so she posts a request on the Wildcat Mutual Aid app to see if anyone has a car to take her.
- Beatrice is a junior who owns a car and is about to restock her groceries for her apartment. Looking at the dashboard on the Wildcat Mutual Aid app, she notices that Alice requested a ride to HMart. 
- Beatrice clicks the offer help button on Alice's request.
- Alice gets a notification from the Wildcat Mutual Aid app and clicks the bell icon to see what is it.
- Alice clicks on the notification and sees Beatrice's profile and that she offered help. Alice clicks accept and is shown Beatrice's email so she can contact Beatrice. 

# Coding notes

- Use secure password hashing
- Define user schema with name, year, major, email, and password hash
- Define request schema with requestID, title, description, creatorID, status(open, accepted, or closed)
- Define offer schema with requestID, helperID, status(pending or accepted)
- Store user and request information locally

# Testing notes
- Define unit tests for rejecting signups without a @u.northwestern.edu email
- Define unit tests for login fails with incorrect password
- Define unit test that offer creation triggers a notification
