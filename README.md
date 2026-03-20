# Apptr

![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23407ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Tanstack Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)
<br/>
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/prettier-1A2C34?style=for-the-badge&logo=prettier&logoColor=F7BA3E)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Figma](https://img.shields.io/badge/figma-%23F24E1E.svg?style=for-the-badge&logo=figma&logoColor=white)

## About

Coordinating interviews between candidates and interviewers is a slow process, especially when a candidate must do several rounds of interviews. Apptr streamlines this process by collecting the availability of all interview interviewers and interviewees, storing it centrally, and generating schedule options that fit everyone’s availability. The target consumer base for our product is organizations that require several rounds of interviews in the candidate hiring process. These organizations can use Apptr to optimize the interview coordination process and enhance the interview experience for all parties involved. Creating this product was not a trivial task, as our team had to take into account the many intricacies of making an interview scheduling web app, such as the setup of role-based access, creation of interview processes, and availability matching. All members in our team worked together to take Apptr from an idea to a finished product, and there were no issues among members.

## Main File Structure

```bash
# The location of all images/svgs/logos used
public

# The View -- The very top-level folder that defines our page's routes and calls components
src/app

# Model -- The components that are styled and directly use the controllers
src/components

# Controller -- functions that help us follow a Model View Controller (MVC) architecture and interact directly with Supabase (inspired by knowledge from CS180)
src/controllers

# Library functions
src/lib 

# Types and Interfaces
src/types

#  Small, generic, and reusable helper/utility functions that do not belong to a specific feature, component, or module
src/utils
```


## Figma

[!! OUTDATED Apptr Figma Design File](https://www.figma.com/design/nHpbB9Yqsn5oYgpqj2JbzE/CS178A-Project-Design?node-id=0-1&t=xpDHVnkbEq7PaJzO-1)

## Node.js

Apptr runs on Node.js Version 20.10.0 and higher. Please ensure you have Node.js installed via the [official website](https://nodejs.org/en).

## Next.js

This project is built using [Next.js](https://nextjs.org), a React framework. Next.js is automatically installed when you install all dependencies for this project.

## Environment Variables

The following environment variables are required and must be stored in an `.env` file:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
```

## Commands

### Dependencies

```bash
# Install dependencies
npm i

# Add dependency
npm i <dependency>

# Remove dependency
npm un <dependency>
```

### Running the Website Locally

```bash
# Open a browser at localhost:3000
npm run dev
```

### Formatting Code via Prettier

```bash
# Rewrite code recursively with proper formatting
npm run format

# Show formatting differences recursively
npm run check
```

### Linting Code via Eslint

```bash
npm run eslint
```

### Build the Website

```bash
npm run build
```
