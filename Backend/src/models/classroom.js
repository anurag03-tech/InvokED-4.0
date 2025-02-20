const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent"],
    required: true,
  },
});

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  exam: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0,
  },
  highestMarks: {
    type: Number,
  },
  averageMarks: {
    type: Number,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const classroomSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: [true, "Please enter the grade"],
    trim: true,
  },
  section: {
    type: String,
    required: [true, "Please enter the section"],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, "Please enter the subject"],
    trim: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  classTeacher: {
    type: Boolean,
    required: true,
    default: false,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  attendance: [attendanceSchema],
  marks: [markSchema],
  assignments: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      dueDate: {
        type: Date,
        required: true,
      },
      assignedDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  announcements: [
    {
      title: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  timetable: {
    image: {
      type: String, // For storing base64 encoded image
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the updatedAt field on save
classroomSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Classroom", classroomSchema);
