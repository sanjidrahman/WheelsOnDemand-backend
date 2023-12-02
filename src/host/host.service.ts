/* eslint-disable @typescript-eslint/no-unused-vars */
import { Host } from './schemas/host.schemas';
import { InjectModel } from '@nestjs/mongoose';
import { HttpStatus, Injectable, Req, Res } from '@nestjs/common';
import { CreateHostDto } from './dto/create-host.dto';
import { UpdateHostDto } from './dto/update-host.dto';
import { Request, Response } from 'express';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '@nestjs-modules/mailer';
import * as otpgenerater from 'otp-generator';
import { LoginHostDto } from './dto/login-host.dto';
import { JwtService } from '@nestjs/jwt';
import { stringify } from 'circular-json';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Vehicles } from 'src/admin/schemas/vehicles.schema';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import * as fs from 'fs';
import { Booking } from 'src/user/schemas/bookings.schema';

@Injectable()
export class HostService {
  tempHost!: any;
  otpgenerated!: any;
  constructor(
    @InjectModel('Host')
    private _hostModel: Model<Host>,
    @InjectModel('Vehicles')
    private _vehicleModel: Model<Vehicles>,
    @InjectModel('Booking')
    private _bookingModel: Model<Booking>,
    private _mailServive: MailerService,
    private _jwtservice: JwtService,
  ) {}

  async create(createHostDto: CreateHostDto, @Res() res: Response) {
    try {
      const { name, email, password, phone, confirmPass } = createHostDto;
      const existmail = await this._hostModel.findOne({ email: email });
      const existNumber = await this._hostModel.findOne({ phone: phone });
      if (existmail) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      if (existNumber) {
        return res
          .status(400)
          .json({ message: 'Phone number is already registered' });
      }

      if (name && email && password && phone && confirmPass) {
        this.otpgenerated = await otpgenerater.generate(4, {
          digits: true,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
        await this.sendMail(name, email, this.otpgenerated);
        const hashpass = await bcrypt.hash(password, 10);
        this.tempHost = {
          name: name,
          phone: phone,
          email: email,
          password: hashpass,
        };
      }

      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Error' });
    }
  }

  async otpverify(otp: any, @Res() res: Response) {
    try {
      const otpg = otp.otp;
      if (this.otpgenerated == otpg) {
        const host = await this._hostModel.create(this.tempHost);
        if (host) {
          const payload = { id: host._id, role: 'host' };
          const token = this._jwtservice.sign(payload);
          res.cookie('jwtHost', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
          });
          res.status(200).json({ token, message: 'Success' });
        }
      }
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  async sendMail(name: string, email: string, otp: any) {
    return this._mailServive.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand Email Verification',
      text: 'WheelsOnDemand',
      html: `<table style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr>
          <td style="text-align: center; background-color: #1976D2; padding: 10px; color: #fff;">
              <h1>Host OTP Verification for Access</h1>
          </td>
      </tr>
      <tr>
          <td style="padding: 20px;">
              <p>Hello, ${name}</p>
              <p>You are just one step away from accessing our platform. To ensure your security and access to our services, please verify your identity by entering the OTP (One-Time Password) provided below:</p>
              <p>OTP: <strong>${otp}</strong></p>
              <p>Please use this OTP to complete the verification process and start hosting with us.</p>
              <p>If you did not request this verification, please ignore this email, and contact our support team immediately.</p>
              <p>Thank you for choosing our platform. We look forward to having you as part of our community.</p>
              <p>If you have any questions or need assistance, please feel free to contact our support team.</p>
              <p>Best regards,<br>Your WheelsOnDemand Team</p>
          </td>
      </tr>
      <tr>
          <td style="text-align: center; background-color: #1976D2; padding: 10px; color: #fff;">
              <p>&copy; 2023 WheelsOnDemand. All rights reserved.</p>
          </td>
      </tr>
  </table>
  `,
    });
  }

  async login(hostlogindto: LoginHostDto, @Res() res: Response) {
    try {
      const { email, password } = hostlogindto;
      const hostData = await this._hostModel.findOne({ email: email });
      // console.log(stringify(hostData, null, 2));
      if (hostData) {
        if (!hostData.isBlocked) {
          if (hostData.isVerified) {
            const passMatch = await bcrypt.compare(password, hostData.password);
            if (passMatch) {
              const payload = { id: hostData._id, role: 'host' };
              const token = this._jwtservice.sign(payload);
              res.cookie('jwtHost', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
              });
              return res
                .status(200)
                .json({ token, message: 'Logged Successfully' });
            } else {
              return res.status(400).json({ message: 'Wrong Password' });
            }
          } else {
            return res
              .status(400)
              .json({ message: 'Your verification is under process!' });
          }
        } else {
          return res
            .status(400)
            .json({ message: 'You have no access anymore!' });
        }
      } else {
        return res.status(404).json({ message: 'Host not found' });
      }
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async forgotpassword(@Res() res: Response, email: string) {
    try {
      const existEmail = await this._hostModel.findOne({ email: email });
      if (!existEmail)
        res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Email not found. Please provide correct email' });

      await this.sendForgotPassMail(res, existEmail.email, existEmail._id);
      res.status(HttpStatus.OK).json({ message: 'Success' });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async sendForgotPassMail(@Res() res: Response, email: string, id: string) {
    try {
      return this._mailServive.sendMail({
        to: email,
        from: process.env.DEV_MAIL,
        subject: 'WheelsOnDemand Forgot Password',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333333;">Forgot Your Password?</h2>
              <p style="color: #666666;">No worries! It happens to the best of us. Click the link below to reset your password:</p>
              <p>
                  <a href="http://localhost:4200/host/reset-password/${id}" style="display: inline-block; padding: 10px 20px; font-size: 16px; text-decoration: none; background-color: #007BFF; color: #ffffff; border-radius: 5px;">Reset Password</a>
              </p>
              <p>If you didn't request a password reset, please ignore this email.</p>
              <p>Thanks,<br>Your WheelsOnDemand Team</p>
          </div>
      `,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async resetPass(
    @Res() res: Response,
    hostId: string,
    newpassword: string,
    confirmpassword: string,
  ) {
    try {
      if (newpassword !== confirmpassword) {
        return res
          .status(HttpStatus.NOT_ACCEPTABLE)
          .json({ message: 'Confirm password and new password are not same' });
      }
      const hashpass = await bcrypt.hash(newpassword, 10);
      await this._hostModel.findOneAndUpdate(
        { _id: hostId },
        { $set: { password: hashpass } },
      );
      res.status(HttpStatus.OK).json({ message: 'Success' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async dashboard(@Res() res: Response, @Req() req: Request) {
    try {
      const hostId = req.body.userId;
      const hostRevenue = await this._bookingModel.aggregate([
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'vehicleDetails',
          },
        },
        {
          $unwind: '$vehicleDetails',
        },
        {
          $match: {
            'vehicleDetails.createdBy': new mongoose.Types.ObjectId(hostId),
            // status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: {
              $floor: {
                $subtract: [
                  '$totalRevenue',
                  { $multiply: ['$totalRevenue', 0.2] },
                ],
              },
            },
          },
        },
      ]);
      const mostOrderedVehicle = await this._bookingModel.aggregate([
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'vehicleDetails',
          },
        },
        {
          $unwind: '$vehicleDetails',
        },
        {
          $match: {
            'vehicleDetails.createdBy': new mongoose.Types.ObjectId(hostId),
            // status: 'completed',
          },
        },
        {
          $group: {
            _id: '$vehicleDetails._id',
            vehicle: { $first: '$vehicleDetails' },
            orderCount: { $sum: 1 },
          },
        },
        {
          $sort: { orderCount: -1, 'vehicle.createdAt': -1 },
        },
        {
          $limit: 1,
        },
        {
          $project: {
            _id: 0,
            vehicle: 1,
          },
        },
      ]);

      const bookedCount = await this._bookingModel.aggregate([
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'vehicleDetails',
          },
        },
        {
          $unwind: '$vehicleDetails',
        },
        {
          $match: {
            'vehicleDetails.createdBy': new mongoose.Types.ObjectId(hostId),
            status: 'Booked',
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            count: 1,
          },
        },
      ]);

      const completedCount = await this._bookingModel
        .find({ status: 'completed' })
        .countDocuments();

      const cancelledBooking = await this._bookingModel
        .find({ status: 'cancelled' })
        .countDocuments();

      const latestOrders = await this._bookingModel.aggregate([
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'vehicleDetails',
          },
        },
        {
          $unwind: '$vehicleDetails',
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        {
          $unwind: '$userDetails',
        },
        {
          $match: {
            'vehicleDetails.createdBy': new mongoose.Types.ObjectId(hostId),
            // status: 'completed',
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 5,
        },
      ]);
      let hostTotalRevenue: number;
      let mostOrdered: number;
      let bookedTotalCount: number;
      if (hostRevenue[0] && mostOrderedVehicle[0] && bookedCount[0]) {
        hostTotalRevenue = hostRevenue[0].totalRevenue;
        mostOrdered = mostOrderedVehicle[0].vehicle;
        bookedTotalCount = bookedCount[0].count;
      } else {
        hostTotalRevenue = 0;
        mostOrdered = 0;
        bookedTotalCount = 0;
      }

      res.status(HttpStatus.OK).json({
        hostRevenue: hostTotalRevenue,
        trending: mostOrdered,
        bookedCount: bookedTotalCount,
        completedCount,
        cancelledBooking,
        latestOrders,
      });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async getAllHost(@Res() res: Response) {
    try {
      const hosts = await this._hostModel.find({});
      return { hosts };
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async uplaodDoc(file: any, @Res() res: Response, id: any) {
    try {
      const response = {
        originalname: file.originalname,
        filename: file.filename,
      };
      const userup = await this._hostModel.updateOne(
        { _id: id },
        { $set: { document: response.filename } },
      );
      return res.status(200).json({ userup, message: 'Success' });
    } catch (err) {
      return res
        .status(400)
        .json({ message: 'Only jpeg, png, jpg, gif format files are allowed' });
    }
  }

  async uplaodProfile(file: any, @Res() res: Response, @Req() req: Request) {
    try {
      const response = {
        originalname: file.originalname,
        filename: file.filename,
      };
      const hostId = req.body.userId;
      const userup = await this._hostModel.updateOne(
        { _id: hostId },
        { $set: { profile: response.filename } },
      );
      return res.status(200).json({ userup, message: 'Success' });
    } catch (err) {
      return res
        .status(400)
        .json({ message: 'Only jpeg, png, jpg, gif format files are allowed' });
    }
  }

  async hostdetails(@Req() req: Request, @Res() res: Response) {
    try {
      const hostId = req.body.userId;
      const host = await this._hostModel.findById({ _id: hostId });
      res.send(host);
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async updatehost(
    updatehostdto: UpdateHostDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { name, phone } = updatehostdto;
      const hostId = req.body.userId;
      await this._hostModel.findOneAndUpdate(
        { _id: hostId },
        { $set: { name: name, phone: phone } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async changepass(data: any, @Res() res: Response, @Req() req: Request) {
    try {
      const { oldPass, password, confirmPass } = data;
      const hostId = req.body.userId;
      const hostData = await this._hostModel.findOne({ _id: hostId });
      const passMatch = await bcrypt.compare(oldPass, hostData.password);
      if (password !== confirmPass) {
        return res
          .status(403)
          .json({ message: 'New password and confirm password doent match' });
      }
      if (!passMatch) {
        return res.status(400).json({ message: 'Incorrect old password' });
      }
      const samePass = await bcrypt.compare(password, hostData.password);
      if (samePass) {
        return res
          .status(403)
          .json({ message: 'New password cannot be same as old password' });
      }
      const hashpass = await bcrypt.hash(password, 10);
      await this._hostModel.findOneAndUpdate(
        { _id: hostId },
        { $set: { password: hashpass } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async addVehicle(
    files: any,
    createvehicledto: CreateVehicleDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const {
        name,
        brand,
        fuel,
        transmission,
        make,
        price,
        isVerified,
        location,
      } = createvehicledto;
      const hostId = req.body.userId;
      const newCar = await this._vehicleModel.create({
        name,
        brand,
        fuel,
        transmission,
        make,
        price,
        location,
        createdBy: hostId,
        isVerified,
      });
      if (newCar) {
        await this.uploadVehicleImage(files.files, res, newCar._id);
        await this.uploadVehicleDoc(files.doc[0], res, newCar._id);
      }
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async uploadVehicleImage(files: any, @Res() res: Response, id?: string) {
    try {
      for (const f of files) {
        await this._vehicleModel.findOneAndUpdate(
          { _id: id },
          { $push: { images: f.filename } },
        );
      }
      return;
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async uploadVehicleDoc(doc: any, @Res() res: Response, id?: string) {
    try {
      await this._vehicleModel.findOneAndUpdate(
        { _id: id },
        { $set: { document: doc.filename } },
      );
      return;
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async hostvehicles(@Res() res: Response, @Req() req: Request, page: number) {
    try {
      const hostId = req.body.userId;
      const perPage = 3;
      const currPage = Number(page) || 1;
      const skip = perPage * (currPage - 1);
      const vehicle = await this._vehicleModel
        .find({
          createdBy: hostId,
        })
        .limit(perPage)
        .skip(skip);
      const count = await this._vehicleModel
        .find({
          createdBy: hostId,
        })
        .countDocuments();
      const totalPage = Math.ceil(count / perPage);
      res.json({ vehicle, totalPage });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async editVehicle(
    files: any,
    editVehicle: UpdateVehicleDto,
    @Res() res: Response,
    id: string,
  ) {
    try {
      const { name, brand, make, transmission, fuel, price, location } =
        editVehicle;
      await this._vehicleModel.findOneAndUpdate(
        { _id: id },
        { $set: { name, brand, make, transmission, fuel, price, location } },
      );
      if (files) {
        if (files.files) await this.uploadVehicleImage(files.files, res, id);
        if (files.doc) await this.uploadVehicleDoc(files.doc[0], res, id);
      }
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Error' });
    }
  }

  async deleteImage(@Res() res: Response, id: string, file: string) {
    try {
      const vehicleData = await this._vehicleModel.findOne({ _id: id });
      if (vehicleData.images.length > 1) {
        await this._vehicleModel.findByIdAndUpdate(
          { _id: id },
          { $pull: { images: file } },
        );
        fs.unlink(`./files/${file}`, (err) => {
          if (err) {
            // console.log('somethiing went wrong', err);
          } else {
            // console.log('unlinked');
          }
        });
      } else {
        return res
          .status(400)
          .json({ message: 'Vehicle should have one image' });
      }
      res.status(200).json({ message: 'Succuss' });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Error' });
    }
  }

  async getVehicleDetails(@Res() res: Response, v_id: string) {
    try {
      const vehicleDetails = await this._vehicleModel
        .findOne({ _id: v_id })
        .populate('createdBy')
        .populate({
          path: 'review',
          populate: {
            path: 'userId',
            model: 'User',
          },
        });
      res.status(200).send(vehicleDetails);
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Error' });
    }
  }

  async deleteVehicle(@Res() res: Response, id: string) {
    try {
      await this._vehicleModel.findOneAndDelete({ _id: id });
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Error' });
    }
  }

  async hostBooking(@Res() res: Response, @Req() req: Request) {
    try {
      const hostid = req.body.userId;
      const vehicles: any = await this._bookingModel.aggregate([
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'BookingsOfVehicles',
          },
        },
        {
          $unwind: {
            path: '$BookingsOfVehicles',
          },
        },
        {
          $sort: {
            'BookingsOfVehicles._id': -1,
          },
        },
      ]);
      const filtered = vehicles.filter(
        (e: any) => e.BookingsOfVehicles.createdBy == hostid,
      );
      res.status(200).send(filtered);
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Error' });
    }
  }

  async editBookingStatus(@Res() res: Response, b_id: string, status: string) {
    try {
      await this._bookingModel.findOneAndUpdate(
        { _id: b_id },
        { $set: { status: status } },
      );
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Error' });
    }
  }

  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      res.cookie('jwtHost', '', { maxAge: 0 });
      res.status(200).json({ message: 'Logged out succesfully' });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Error' });
    }
  }
}
