const User = require("../models/User");
const { defaultUsers } = require("./defaultUsers");

const seedDefaultUsers = async () => {
  let createdCount = 0;

  for (const profile of defaultUsers) {
    const existingUser = await User.findOne({ email: profile.email.toLowerCase() });
    if (existingUser) {
      continue;
    }

    await User.create({
      ...profile,
      email: profile.email.toLowerCase(),
    });
    createdCount += 1;
  }

  if (createdCount > 0) {
    console.log(`Seeded ${createdCount} default profile(s).`);
  }
};

module.exports = seedDefaultUsers;
