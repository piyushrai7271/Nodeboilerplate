import mongoose from "mongoose";
import UserToken from "../../../models/Authentication/Token/tokeAuth.model.js";

const generateAccessAndRefreshToken = async (userId) =>{}
const register = async (req,res) =>{}
const verfyOtp = async (req,res) =>{}
const login = async  (req,res) =>{}
const changePassword = async(req,res) =>{}
const addProfileDetails = async (req,res) =>{}
const updateUserDetails = async (req,res) =>{}
const getUserDetail = async (req,res) =>{}
const getAllUserDetails = async (req,res) =>{}
const softDaleteUser = async (req,res) =>{}
const hardDeleteUser = async (req,res) =>{}
const logOut = async (req,res) => {}


export {
    register,
    verfyOtp,
    login,
    changePassword,
    addProfileDetails,
    updateUserDetails,
    getUserDetail,
    getAllUserDetails,
    softDaleteUser,
    hardDeleteUser,
    logOut
}