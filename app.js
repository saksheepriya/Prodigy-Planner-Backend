// app.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");
require("./TaskDetailsSchema");
const TaskDetails = mongoose.model("taskinfo");

const app = express();
app.use(express.json());
app.use(cors());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

const JWT_SECRET =
  "hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe";

const mongoUrl =
  "mongodb+srv://sakship717:12345@cluster0.lrvas.mongodb.net/";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));

require("./UserDetailsScehma");

const User = mongoose.model("userinfo");

app.post("/register", async (req, res) => {
  const { fname, lname, email, password, userType } = req.body;

  const encryptedPassword = await bcrypt.hash(password, 10);
  try {
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.json({ error: "User Exists" });
    }

    const userId = new mongoose.Types.ObjectId().toString(); // Convert ObjectId to string
    await User.create({
      fname,
      lname,
      email,
      password: encryptedPassword,
      userId,
      userType,
    });

    res.send({ status: "ok", userId });
  } catch (error) {
    console.error(error);
    res.send({ status: "error", error: "Something went wrong" });
  }
});

app.post("/login-user", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ error: "User Not found" });
  }
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ email: user.email }, JWT_SECRET, {
      expiresIn: "15m",
    });

    if (res.status(201)) {
      return res.json({ status: "ok", data: token });
    } else {
      return res.json({ error: "error" });
    }
  }
  res.json({ status: "error", error: "InvAlid Password" });
});

app.post("/userData", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    console.log(user);
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const useremail = user.email;
    User.findOne({ email: useremail })
      .then((data) => {
        res.send({ status: "ok", data: data });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {}
});

app.listen(5000, () => {
  console.log("Server Started");
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    });
    const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "adarsh438tcsckandivali@gmail.com",
        pass: "rmdklolcsmswvyfw",
      },
    });

    var mailOptions = {
      from: "youremail@gmail.com",
      to: "thedebugarena@gmail.com",
      subject: "Password Reset",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    console.log(link);
  } catch (error) {}
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log(req.params);
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("index", { email: verify.email, status: "Not Verified" });
  } catch (error) {
    console.log(error);
    res.send("Not Verified");
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );

    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
});

app.get("/getAllUser", async (req, res) => {
  try {
    const allUser = await User.find({});
    res.send({ status: "ok", data: allUser });
  } catch (error) {
    console.log(error);
  }
});

app.post("/deleteUser", async (req, res) => {
  const { userid } = req.body;
  try {
    User.deleteOne({ _id: userid }, function (err, res) {
      console.log(err);
    });
    res.send({ status: "Ok", data: "Deleted" });
  } catch (error) {
    console.log(error);
  }
});

app.get("/paginatedUsers", async (req, res) => {
  const allUser = await User.find({});
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;
  const lastIndex = page * limit;

  const results = {};
  results.totalUser = allUser.length;
  results.pageCount = Math.ceil(allUser.length / limit);

  if (lastIndex < allUser.length) {
    results.next = {
      page: page + 1,
    };
  }
  if (startIndex > 0) {
    results.prev = {
      page: page - 1,
    };
  }
  results.result = allUser.slice(startIndex, lastIndex);
  res.json(results);
});

app.post("/userData", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });

    console.log(user);

    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const useremail = user.email;

    // Find the user and populate userObjectId
    User.findOne({ email: useremail })
      .populate("tasks") // Assuming tasks is the name of the field referencing the TaskDetails collection
      .exec(function (err, data) {
        if (err) {
          return res.send({ status: "error", data: err });
        }

        res.send({ status: "ok", data: data });
      });
  } catch (error) {
    console.error(error);
    res.send({ status: "error", data: error.message });
  }
});
app.post("/add-task", async (req, res) => {
  const { token, task, priority, dueDate } = req.body;

  try {
    const user = jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return "token expired";
      }
      return decoded;
    });

    if (user === "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const userEmail = user.email;

    // Find the user and retrieve the userId
    const userInfo = await User.findOne({ email: userEmail });
    const userId = userInfo._id;

    // Create a new task with the retrieved userId
    const newTask = await TaskDetails.create({
      userId,
      task,
      priority,
      dueDate,
    });

    // Update the user's tasks field to include the newly created task
    await User.updateOne({ _id: userId }, { $push: { tasks: newTask._id } });

    res.send({ status: "ok", data: newTask });
  } catch (error) {
    console.error(error);
    res.send({ status: "error", data: error.message });
  }
});

app.get("/getUserTasks/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const tasks = await TaskDetails.find({ userId });
    res.send({ status: "ok", data: tasks });
  } catch (error) {
    console.error(error);
    res.send({ status: "error", data: error.message });
  }
});
app.post("/getUserTasksWithPriority", async (req, res) => {
  const { token, priority } = req.body;

  try {
    const user = jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return "token expired";
      }
      return decoded;
    });

    if (user === "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const userEmail = user.email;

    // Find the user and retrieve the userId
    const userInfo = await User.findOne({ email: userEmail });
    const userId = userInfo._id;

    // Fetch tasks based on user ID and priority
    const tasks = await TaskDetails.find({ userId, priority });

    res.send({ status: "ok", data: tasks });
  } catch (error) {
    console.error(error);
    res.send({ status: "error", data: error.message });
  }
});
app.post("/getFilteredTasks", async (req, res) => {
  const { userId, priority } = req.body;

  try {
    const tasks = await TaskDetails.find({ userId, priority });
    res.send({ status: "ok", data: tasks });
  } catch (error) {
    console.error(error);
    res.send({ status: "error", data: error.message });
  }
});
app.delete("/deleteTask/:taskId", async (req, res) => {
  const { taskId } = req.params;

  try {
    // Validate that taskId is defined and not "undefined"
    if (!taskId) {
      return res.status(400).json({ status: "error", data: "Invalid taskId" });
    }
    // Delete the task from the TaskDetails collection
    await TaskDetails.deleteOne({ _id: taskId });

    // Update the user's tasks field to remove the deleted task
    await User.updateOne({ tasks: taskId }, { $pull: { tasks: taskId } });

    res.send({ status: "ok", data: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", data: error.message });
  }
});
