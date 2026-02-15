import User from "../models/UserModel.js";

import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { createJWT } from "../utils/generateToken.js";
import { StatusCodes } from "http-status-codes";

const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/; // Minimum eight characters, at least one letter and one number

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Name, email and password are required" });
    }

    if (!emailRegex.test(email)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Please provide a valid email address" });
    }

    if (!passwordRegex.test(password)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Password must be at least 8 characters long and include letters and numbers",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: "A user with this email already exists" });
    }

    const isFirstAccount = (await User.countDocuments()) === 0;
    // Only allow creating the initial Admin automatically. Otherwise default to Student.
    const role = isFirstAccount ? "Admin" : "Student";

    const hashedPassword = await hashPassword(password);

    const user = await User.create({ ...req.body, password: hashedPassword, role });

    return res.status(StatusCodes.CREATED).json({ msg: "User Created Successfully", user });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid credentials" });
    }

    const token = createJWT({ userId: user._id, role: user.role });

    // Remove password before sending user
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(StatusCodes.OK).json({ user: userObj, token });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Server error", error: error.message });
  }
};