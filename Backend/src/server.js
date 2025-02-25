require("dotenv").config();
const express = require("express");
const { connectDB } = require("./config/database");
const cors = require("cors");
const teacherRoutes = require("./routes/teacherRoutes");
const classroomRoutes = require("./routes/classroomRoutes");
const studentRoutes = require("./routes/studentRoutes");
const parentRoutes = require("./routes/parentRoutes");
require("./models/student");
const fileUpload = require("express-fileupload");
const path = require("path");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Credentials",
  ],
};

// Middlewares
app.use(cors(corsOptions));

// File upload middleware (for voice notes)
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Routes
app.use("/api/teacher", teacherRoutes);
app.use("/api/classroom", classroomRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/notifications", notificationRoutes);

// Cron job to keep server alive (every 14 minutes)
setInterval(async () => {
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL || `http://localhost:${port}`}`
    );
    const data = await res.json();
    console.log("Server kept alive at:", new Date().toISOString());
  } catch (error) {
    console.error("Keep-alive ping failed:", error.message);
  }
}, 1000 * 60 * 14);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log("SOMETHING WENT WRONG:", err.message);
  });
