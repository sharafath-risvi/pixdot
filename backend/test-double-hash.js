const bcrypt = require('bcryptjs');

async function run() {
  const hash1 = await bcrypt.hash("123456", 12);
  const hash2 = await bcrypt.hash(hash1, 12);
  console.log("hash2:", hash2);
  
  const matchesDoubleHash = await bcrypt.compare(hash1, hash2);
  console.log("Does hash1 match hash2?", matchesDoubleHash);
  
  const userHash = "$2b$12$odXqfUvoCWcv2iIb/P7J7Ow8ZsLDGpQJsuRwfNDgdOGL1Mv3o9tPW";
  console.log("Does 123456 match userHash?", await bcrypt.compare("123456", userHash));
  
  process.exit(0);
}
run();
