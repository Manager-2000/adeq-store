// config/database.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Replace this with your actual MongoDB Atlas connection string
    // It should look like: mongodb+srv://adeqadmin:your-password@adeq-water-cluster.xxxxx.mongodb.net/
    const conn = await mongoose.connect(
      "mongodb+srv://ayodeleayomide2006_db_user:Jry2pDBoX3LRc0Xq@adeq-water-cluster.5qxy8g7.mongodb.net/?retryWrites=true&w=majority&appName=adeq-water-cluster",
      {
        // Remove these deprecated options
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
      }
    );

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
