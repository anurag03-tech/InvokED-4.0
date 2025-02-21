const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter student's name"],
  },
  school: {
    type: String,
    required: [true, "Please select student's school"],
  },
  admissionNumber: {
    type: String,
    required: [true, "Please enter admission number"],
    unique: true,
    trim: true,
  },
  classrooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
    },
  ],
  parents: [
    {
      parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
        required: true,
      },
      relation: {
        type: String,
        enum: ["father", "mother"],
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Student", studentSchema);
