const DEFAULT_USER_PASSWORD = "Pass@123";

const defaultUsers = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@skillswap.dev",
    password: DEFAULT_USER_PASSWORD,
    bio: "Frontend mentor focused on React, accessibility, and clean UI architecture.",
    skillsOffered: ["React", "JavaScript", "UI Design"],
    skillsWanted: ["Node.js", "Public Speaking"],
    averageRating: 4.7,
    ratingCount: 9,
  },
  {
    name: "Neha Verma",
    email: "neha.verma@skillswap.dev",
    password: DEFAULT_USER_PASSWORD,
    bio: "Backend engineer who enjoys APIs, MongoDB schema design, and deployment basics.",
    skillsOffered: ["Node.js", "MongoDB", "REST APIs"],
    skillsWanted: ["React", "Graphic Design"],
    averageRating: 4.5,
    ratingCount: 7,
  },
  {
    name: "Rohan Iyer",
    email: "rohan.iyer@skillswap.dev",
    password: DEFAULT_USER_PASSWORD,
    bio: "Data enthusiast helping with Python, SQL, and beginner analytics projects.",
    skillsOffered: ["Python", "SQL", "Data Analysis"],
    skillsWanted: ["Machine Learning", "System Design"],
    averageRating: 4.4,
    ratingCount: 6,
  },
  {
    name: "Sana Khan",
    email: "sana.khan@skillswap.dev",
    password: DEFAULT_USER_PASSWORD,
    bio: "Creative product thinker with strengths in design systems and communication.",
    skillsOffered: ["Figma", "Product Thinking", "Presentation Skills"],
    skillsWanted: ["JavaScript", "TypeScript"],
    averageRating: 4.8,
    ratingCount: 12,
  },
  {
    name: "Vikram Nair",
    email: "vikram.nair@skillswap.dev",
    password: DEFAULT_USER_PASSWORD,
    bio: "Cloud and DevOps learner who loves debugging workflows and CI/CD pipelines.",
    skillsOffered: ["Git", "Docker", "CI/CD Basics"],
    skillsWanted: ["Kubernetes", "Backend Performance"],
    averageRating: 4.3,
    ratingCount: 5,
  },
];

module.exports = { defaultUsers, DEFAULT_USER_PASSWORD };
