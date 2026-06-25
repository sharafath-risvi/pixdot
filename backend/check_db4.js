const mongoose = require("mongoose");

const run = async () => {
  const uri = "mongodb+srv://sharafathrisvi02_db_user:NTMpAiTEO3Rxzxhs@pixdot.i26a1lt.mongodb.net/pixdot?appName=pixdot";
  await mongoose.connect(uri);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`Collection ${c.name} count: ${count}`);
  }
  
  process.exit(0);
};
run();
