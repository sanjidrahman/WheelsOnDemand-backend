import {
  HttpStatus,
  Injectable,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Admin } from './schemas/admin.schema';
import { AdminLoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Host } from 'src/host/schemas/host.schemas';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Vehicles } from './schemas/vehicles.schema';
import { UpdateVehicleDto } from './dto/edit-vehicle.dto';
import * as fs from 'fs';
import { Booking } from 'src/user/schemas/bookings.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User')
    private _userModel: Model<User>,
    @InjectModel('Admin')
    private _adminModel: Model<Admin>,
    @InjectModel('Host')
    private _hostModel: Model<Host>,
    @InjectModel('Vehicles')
    private _vehicleModel: Model<Vehicles>,
    @InjectModel('Booking')
    private _bookingModel: Model<Booking>,
    private _jwtservice: JwtService,
    private _mailService: MailerService,
  ) {}

  async adminLogin(logindto: AdminLoginDto, @Res() res: Response) {
    try {
      const { email, password } = logindto;
      const user = await this._adminModel.findOne({ email: email });

      if (!user) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      const passMatch = await bcrypt.compare(password, user.password);
      if (!passMatch) {
        return res.status(401).send({ message: 'Wrong Password' });
      }
      const payload = { id: user._id, role: 'admin' };
      const token = this._jwtservice.sign(payload);
      res.cookie('jwtAdmin', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).send({ token: token, message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  // async signup(
  //   logindto: AdminLoginDto,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   try {
  //     const { email, password } = logindto;

  //     const hashpass = await bcrypt.hash(password, 10);
  //     const user = await this.AdminModel.create({
  //       email,
  //       password: hashpass,
  //     });

  //     const payload = { id: user._id, role: 'admin' };
  //     const token = this._jwtservice.sign(payload);
  //     res.cookie('jwt', token, {
  //       httpOnly: true,
  //       maxAge: 24 * 60 * 60 * 1000,
  //     });
  //     return { token };
  //   } catch (error) {
  //     res.status(500).json({ message: 'Internal Error' });
  //   }
  // }

  async dashboard(@Res() res: Response) {
    try {
      const amountGeneratedEachMonth: number[] = [];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const monlyAmount = await this._bookingModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(currentYear, 0, 1),
              $lt: currentDate,
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: '$createdAt' } },
            totalSales: { $sum: '$total' },
          },
        },
        {
          $sort: { '_id.month': 1 },
        },
        {
          $group: {
            _id: null,
            monthlySales: {
              $push: {
                month: '$_id.month',
                totalSales: '$totalSales',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            monthlySales: 1,
          },
        },
      ]);
      monlyAmount.forEach((val) => {
        val.monthlySales.forEach((val) => {
          for (let i = 1; i <= 12; i++) {
            if (val.month == i) {
              amountGeneratedEachMonth.push(val.totalSales);
            } else {
              amountGeneratedEachMonth.push(0);
            }
          }
        });
      });
      const totalAmount = await this._bookingModel.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$grandTotal' },
          },
        },
        {
          $project: {
            _id: 0,
            totalAmount: 1,
          },
        },
      ]);
      const hostGenerated = await this._bookingModel.aggregate([
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'VehicleDetails',
          },
        },
        {
          $unwind: '$VehicleDetails',
        },
        {
          $lookup: {
            from: 'hosts',
            localField: 'VehicleDetails.createdBy',
            foreignField: '_id',
            as: 'HostDetails',
          },
        },
        {
          $match: {
            HostDetails: { $ne: [] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$grandTotal' },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
          },
        },
      ]);
      const completeBookingCount = await this._bookingModel
        .find({
          status: 'completed',
        })
        .countDocuments();
      const cancelledBookingCount = await this._bookingModel
        .find({
          status: 'cancelled',
        })
        .countDocuments();
      const bookingBookingCount = await this._bookingModel
        .find({ status: 'Booked' })
        .countDocuments();
      const totalVehicles = await this._bookingModel.find({}).countDocuments();
      const mostBookedVehicle = await this._bookingModel.aggregate([
        {
          $group: {
            _id: '$vehicleId',
            totalBookings: { $sum: 1 },
            latestBookingDate: { $max: '$createdAt' },
          },
        },
        {
          $sort: { totalBookings: -1, latestBookingDate: -1 },
        },
        {
          $limit: 1,
        },
        {
          $lookup: {
            from: 'vehicles',
            localField: '_id',
            foreignField: '_id',
            as: 'vehicleDetails',
          },
        },
        {
          $unwind: '$vehicleDetails',
        },
      ]);
      res.status(HttpStatus.OK).json({
        totalAmount: totalAmount[0].totalAmount,
        hostGenerated: hostGenerated[0].totalRevenue,
        completeBookingCount,
        cancelledBookingCount,
        bookingBookingCount,
        totalVehicles,
        amountGeneratedEachMonth,
        mostBookedVehicle: mostBookedVehicle[0].vehicleDetails,
      });
    } catch (err) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal Server Error' });
    }
  }

  async blockuser(id: string, @Res() res: Response) {
    try {
      const user = await this._userModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this._userModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isBlocked: true } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async unblockuser(id: string, @Res() res: Response) {
    try {
      const user = await this._userModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this._userModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isBlocked: false } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async getAllUsers(@Res() res: Response) {
    try {
      const user = await this._userModel.find({});
      return user;
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async blockhost(id: string, @Res() res: Response) {
    try {
      const user = await this._hostModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this._hostModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isBlocked: true } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async unblockhost(id: string, @Res() res: Response) {
    try {
      const user = await this._hostModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this._hostModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isBlocked: false } },
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async getAllHosts(@Res() res: Response) {
    try {
      const host = await this._hostModel.find({});
      return host;
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async verifyHost(id: any, @Res() res: Response) {
    try {
      const hostData = await this._hostModel.findOne({ _id: id });
      await this._hostModel.findByIdAndUpdate(
        { _id: id },
        { $set: { isVerified: true } },
      );
      await this.sendVerificationMail(hostData.name, hostData.email);
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async sendVerificationMail(name: string, email: string) {
    return this._mailService.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand Email Verification',
      text: 'WheelsOnDemand',
      html: ` <table style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr>
          <td style="text-align: center; background-color: #1976D2; padding: 10px; color: #fff;">
              <h1>Host Verification Successful</h1>
          </td>
      </tr>
      <tr>
          <td style="padding: 20px;">
              <p>Hello, ${name} </p>
              <p>Your host verification has been successful. You can now access our services and start hosting with us.</p>
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
  </table>`,
    });
  }

  async hostNotVerified(id: any, issue: any, @Res() res: Response) {
    try {
      console.log(id, issue.issue, 'from service');
      const hostData = await this._hostModel.findOne({ _id: id });
      console.log(hostData);
      // await this._hostModel.findOneAndDelete({ _id: id });
      await this.sendNotVerificationMail(
        hostData.name,
        hostData.email,
        issue.issue,
      );
      return res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async sendNotVerificationMail(name: string, email: string, issue: string) {
    return this._mailService.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand Email Verification',
      text: 'WheelsOnDemand',
      html: `<table style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <tr>
          <td style="text-align: center; background-color: #FF5722; padding: 10px; color: #fff;">
              <h1>Host Verification Failed</h1>
          </td>
      </tr>
      <tr>
          <td style="padding: 20px;">
              <p>Hello, ${name}</p>
              <p>We regret to inform you that your host verification has failed due to the following reason:</p>
              <p>${issue}</p>
              <p>Please review the feedback provided and make the necessary changes to meet our requirements for hosting.</p>
              <p>Once you've addressed the issues, you can reapply for host verification.</p>
              <p>If you have any questions or need further assistance, please contact our support team.</p>
              <p>Best regards,<br>Your WheelsOnDemand Team</p>
          </td>
      </tr>
      <tr>
          <td style="text-align: center; background-color: #FF5722; padding: 10px; color: #fff;">
              <p>&copy; 2023 WheelsOnDemand. All rights reserved.</p>
          </td>
      </tr>
  </table>`,
    });
  }

  async addVehicle(
    files: any,
    createVehicle: CreateVehicleDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { name, brand, model, transmission, fuel, price, location } =
        createVehicle;
      const cookie = req.cookies['jwtAdmin'];
      const claims = this._jwtservice.verify(cookie);
      const newVehicle = await this._vehicleModel.create({
        name,
        transmission,
        model,
        fuel,
        brand,
        price,
        location,
        createdBy: claims.id,
      });
      await this.uploadVehicleImage(files.files, res, newVehicle._id);
      await this.uploadVehicleDoc(files.doc[0], res, newVehicle._id);
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
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
      console.log(err.messsage, 'UPLOAD DOC');
      res.status(500).json({ message: 'Internal Server Error' });
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
      console.log(err.messsage, 'UPLOAD VEHICLE');
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async getAllVehicles(@Res() res: Response, page: number) {
    try {
      const perPage = 3;
      const currPage = Number(page) || 1;
      const skip = perPage * (currPage - 1);
      const vehicles = await this._vehicleModel
        .find({})
        .populate('createdBy')
        .limit(perPage)
        .skip(skip);
      res.status(200).send(vehicles);
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async pagination(@Res() res: Response) {
    try {
      const perPage = 3;
      const count = await this._vehicleModel.countDocuments();
      const totalPage = Math.ceil(count / perPage);
      res.status(200).json({ totalPage });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async verifyHostVehicle(@Res() res: Response, vid: string, hid: string) {
    try {
      await this._vehicleModel.findByIdAndUpdate(
        { _id: vid },
        { $set: { isVerified: true } },
      );
      const hostData = await this._hostModel.findOne({ _id: hid });
      await this.vehicleVerifiedMail(hostData.email, hostData.name);
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async vehicleVerifiedMail(email: string, name: string) {
    return this._mailService.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand New Vehicle Request Verification',
      text: 'WheelsOnDemand',
      html: `
        <table style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <tr>
              <td style="text-align: center; background-color: #1976D2; padding: 10px; color: #fff;">
                  <h1>New Vehicle Request Verified</h1>
              </td>
          </tr>
          <tr>
              <td style="padding: 20px;">
                  <p>Hello, ${name} </p>
                  <p>Your new vehicle request has been reviewed and verified by our team.</p>
                  <p>You can now access our services with your new vehicle and start hosting with us.</p>
                  <p>Thank you for choosing our platform. We look forward to having you as part of our community.</p>
                  <p>If you have any questions or need further assistance, please feel free to contact our support team.</p>
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

  async rejectHostVehicle(@Res() res: Response, id: string, issue: string) {
    try {
      const hostData = await this._hostModel.findOne({ _id: id });
      await this.vehicleRejectedMail(hostData.email, hostData.name, issue);
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async vehicleRejectedMail(email: string, name: string, issue: string) {
    return this._mailService.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand New Vehicle Request Review',
      text: 'WheelsOnDemand',
      html: `
        <table style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <tr>
              <td style="text-align: center; background-color: #FF5722; padding: 10px; color: #fff;">
                  <h1>New Vehicle Request Review</h1>
              </td>
          </tr>
          <tr>
              <td style="padding: 20px;">
                  <p>Hello, ${name} </p>
                  <p>Your new vehicle request has been reviewed by our team, but we encountered an issue that requires your attention.</p>
                  <p>Issue: <b>${issue}</b> </p>
                  <p>You can resubmit your vehicle request by addressing the issue. Please click the button below to resubmit your request:</p>
                  <p><a href="http://localhost:4200" style="text-decoration: none; padding: 10px 20px; background-color: #1976D2; color: #fff;">Resubmit Request</a></p>
                  <p style='margin-top:3px'>If you have any questions or need further assistance, please feel free to contact our support team.</p>
                  <p>Best regards,<br>Your WheelsOnDemand Team</p>
              </td>
          </tr>
          <tr>
              <td style="text-align: center; background-color: #FF5722; padding: 10px; color: #fff;">
                  <p>&copy; 2023 WheelsOnDemand. All rights reserved.</p>
              </td>
          </tr>
        </table>
      `,
    });
  }

  async editVehicle(
    files: any,
    editVehicle: UpdateVehicleDto,
    @Res() res: Response,
    id: string,
  ) {
    try {
      // console.log(files, editVehicle);
      const { name, brand, model, transmission, fuel, price, location } =
        editVehicle;
      await this._vehicleModel.findOneAndUpdate(
        { _id: id },
        { $set: { name, brand, model, transmission, fuel, price, location } },
      );
      if (files) {
        if (files.files) await this.uploadVehicleImage(files.files, res, id);
        if (files.doc[0]) await this.uploadVehicleDoc(files.doc[0], res, id);
      }
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      console.log(err.message, 'EDIT VEHCICLE');
      res.status(500).json({ message: 'Internal Error' });
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
            console.log('somethiing went wrong', err);
          } else {
            console.log('unlinked');
          }
        });
      } else {
        return res
          .status(400)
          .json({ message: 'Vehicle should have one image' });
      }
      res.status(200).json({ message: 'Succuss' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async deleteVehicle(@Res() res: Response, id: string) {
    try {
      await this._vehicleModel.findOneAndDelete({ _id: id });
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async getAllBookings(@Res() res: Response) {
    try {
      const bookings = await this._bookingModel
        .find({})
        .populate({
          path: 'vehicleId',
          populate: {
            path: 'createdBy',
            model: 'Host',
          },
        })
        .sort({ _id: -1 });
      res.status(200).json({ bookings });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      res.cookie('jwtAdmin', '', { maxAge: 0 });
      res.status(200).json({ message: 'Logged out succesfully' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }
}
