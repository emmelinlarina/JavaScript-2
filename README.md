# JavaScript-2-Assignment

## Social Media App — Frontend Development

This project simulates a minimal, functional social media environment where users can register, log in, create posts, follow others, react, and interact through comments. It is designed to demonstrate my ability to structure, plan, and develop a complete front-end application powered by the Noroff Social API.

The goal of the project is to create a responsive and interactive web application where users can:

- Create an account and log in securely
- Browse a global feed displaying all posts
- Create, edit, and delete their own posts
- React to posts using the ⭐ reaction
- Comment on posts
- View other users’ profiles and follow/unfollow them
- See their own profile details and their posts
- Search for posts through a search modal

This project focuses on JavaScript logic, API communication, modular code structure, and implementing CRUD operations.

### Links

- GitHub repo: https://github.com/emmelinlarina/JavaScript-2
- Live demo (GitHub Pages): https://emmelinlarina.github.io/JavaScript-2/
- GitHub Projects board: https://github.com/users/emmelinlarina/projects/12

## Admin / Test user:

    Use this dummy to login:

    Name: Bobbins
    Email: bobbyiscool321@stud.noroff.no
    Password: Test1234

    If you want to register a new user, you can absolutely do that as long as you:

    - use @stud.noroff.no
    - make a unique username and email with letters and numbers
    - make a unique password

    Features and User Stories

### Admin Notes for Testers

- Local likes are stored per user in `likedPosts:<username>`
- Media guards remove broken or slow-loading images
- Long text is handled with overflow-wrap to prevent layout breaking
- All authenticated endpoints require both token + API key

### Required features

| Feature                | Description                                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| Register new user      | As a user, I can register a new user on the register user page.          |
| Login user             | As a user, I can login as a registered user on the login user page.      |
| Get all posts          | As a user I can view all the posts on the feed page.                     |
| Get post               | As a user, I can view a single post when clicking on a post in the feed. |
| Create post            | As a user, I can create a single post.                                   |
| Edit post              | As a user, I can edit my own post(s).                                    |
| Delete post            | As a user, I can delete my own post(s).                                  |
| Get posts of a user    | As a user, I can view all the posts of a different user.                 |
| Follow / Unfollow user | As a user, I can follow/unfollow other users.                            |
| Search posts           | As a user, I can search through posts using a search bar.                |
| View my own profile    | As a user I can view my own profile.                                     |

## Features

### Authentication

- Register a new user
- Log in via Noroff Auth API
- API key generation
- Token and API key stored in localStorage

### Posts

- View all posts (feed)
- View a single post
- Create a post
- Edit own posts
- Delete own posts
- React to posts
- Comment on posts
- Sort and display user-specific posts

### Profiles

- View own profile
- View other users’ profiles
- Follow / Unfollow users
- See profile stats (followers, following, post count)
- Clickable posts on profile pages
- Search
- Search modal with results

### UI/UX

- Responsive layout
- Skeleton loaders
- Modal system (comments, edit)
- Media guards for broken images

## Tech Stack

- JavaScript (ES6 modules)
- HTML
- CSS
- Noroff API
- LocalStorage for persistent like data (could not make the likes work)
- GitHub Pages for deployment

## Acknowledgement & references

- **SuperSimpleDev** (Youtube) https://www.youtube.com/@SuperSimpleDev & https://www.youtube.com/watch?v=EerdGm-ehJQ&list=LL&index=38
- **Programming with Mosh** (Youtube) https://www.youtube.com/@programmingwithmosh & https://www.youtube.com/watch?v=eIrMbAQSU34

## Author

> Emmelin Larina Tvedt Nilsen, Frontend Development Student

GitHub: https://github.com/emmelinlarina
