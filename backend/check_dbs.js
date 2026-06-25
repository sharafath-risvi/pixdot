const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://sharafathrisvi02_db_user:NTMpAiTEO3Rxzxhs@pixdot.i26a1lt.mongodb.net/?appName=pixdot";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    for (let dbInfo of dbs.databases) {
      console.log(`\n--- DB: ${dbInfo.name} ---`);
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      for (let coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        if (count > 0) {
          console.log(`  ${coll.name}: ${count}`);
        }
      }
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
