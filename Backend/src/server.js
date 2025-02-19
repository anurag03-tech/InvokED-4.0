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

// File upload middleware
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  })
);

app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Routes
app.use("/api/teacher", teacherRoutes);
app.use("/api/classroom", classroomRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/parent", parentRoutes);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log("SOMETHING WENT WRONG:", err.message);
  });
