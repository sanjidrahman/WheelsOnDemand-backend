import { JwtService } from '@nestjs/jwt';
import { HttpStatus, Injectable, Req, Res } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Signupdto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { MailerService } from '@nestjs-modules/mailer';
import * as otpgenerater from 'otp-generator';
import { Vehicles } from 'src/admin/schemas/vehicles.schema';
import { ChoiseDto } from './dto/choice.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './schemas/bookings.schema';
import * as moment from 'moment';
import { UpdateUserDto } from './dto/edit-user.dto';
// import Razorpay from 'razorpay';

// const instance = new Razorpay({
//   key_id: process.env.RAZOR_KEY_ID,
//   key_secret: process.env.RAZOR_KEY_SECRET,
// });

@Injectable()
export class UserService {
  tempUser: any;
  tempChoice: any;
  otpgenetated: any;
  constructor(
    @InjectModel(User.name)
    private _userModel: Model<User>,
    @InjectModel('Vehicle')
    private _vehicleModel: Model<Vehicles>,
    @InjectModel('Booking')
    private _bookingModel: Model<Booking>,
    private _jwtservice: JwtService,
    private _mailer: MailerService,
  ) {}

  async signup(
    signupdto: Signupdto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { name, email, phone, password, confirmPass } = signupdto;

      const existmail = await this._userModel.findOne({ email: email });

      if (existmail) {
        return res.status(400).send({ message: 'Email already exists' });
      }

      if (name && email && phone && password && confirmPass) {
        this.otpgenetated = await otpgenerater.generate(4, {
          digits: true,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
        await this.sendVerificationEmail(email, this.otpgenetated);

        const hashpass = await bcrypt.hash(password, 10);

        this.tempUser = {
          name: name,
          email: email,
          phone: phone,
          password: hashpass,
        };
      }

      res.status(200).json({ message: 'Success' });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Email is registered!' });
      }
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async verifyOtp(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    otp: any,
  ) {
    try {
      const otpb = otp.otp;
      if (this.otpgenetated == otpb) {
        const user = await this._userModel.create(this.tempUser);
        if (user) {
          const payload = { id: user._id, role: 'user' };
          const token = this._jwtservice.sign(payload);
          res.cookie('jwt', token, {
            httpOnly: false,
            maxAge: 24 * 60 * 60 * 1000,
            secure: true,
          });
          res.status(200).json({ token, message: 'Success' });
        } else {
          res.status(200).json({ message: 'Something went wrong' });
        }
      } else {
        res.status(400).json({ message: 'Wrong otp' });
      }
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async sendVerificationEmail(email: string, otp: string) {
    return this._mailer.sendMail({
      to: email,
      from: process.env.DEV_MAIL,
      subject: 'WheelsOnDemand Email Verification',
      text: 'WheelsOnDemand',
      html: `<h1>Welcome to WheelsOnDemand</h1>
        <h4>Please enter the ${otp} for your OTP verification</h4>`,
    });
  }

  async login(logindto: LoginDto, @Res({ passthrough: true }) res: Response) {
    try {
      const { email, password } = logindto;
      const user = await this._userModel.findOne({ email: email });

      if (!user) {
        // throw new UnauthorizedException('User not found');
        res.status(401).json({ message: 'User not found , Please register!' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        // throw new UnauthorizedException('Email or Password Incorrect');
        res.status(401).json({ message: 'Email or password incorrect' });
      }

      const payload = { id: user._id, role: 'user' };
      const token = this._jwtservice.sign(payload);
      res.cookie('jwt', token, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000,
        secure: true,
      });

      return { token };
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async googleReg(user: any, @Res() res: Response) {
    try {
      const email = user.email;
      const userData = await this._userModel.findOne({ email });

      if (!userData) {
        res
          .status(404)
          .json({ message: 'Account not found , Please Register' });
      } else {
        const token = this._jwtservice.sign({ id: userData._id, role: 'user' });
        res.cookie('jwt', token, {
          httpOnly: false,
          maxAge: 24 * 60 * 60 * 1000,
          secure: true,
        });
        return { token };
      }
    } catch (error) {
      throw new Error('Failed to verify Google Sign-In');
    }
  }

  async getUser(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = req.body.userId;

      const user = this._userModel.findById({ _id: userId });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...data } = (await user).toJSON();

      res.status(200).send(data);
    } catch (err) {
      throw new Error('Failed to get user');
    }
  }

  async storeChoices(
    @Res() res: Response,
    req: Request,
    choisedto: ChoiseDto,
    nearBy: string[],
  ) {
    try {
      if (req.body.userId) {
        const userId = req.body.userId;
        const { startDate, endDate, pickup, dropoff } = choisedto;
        const updatedStartDate = moment(startDate).format('YYYY-MM-DD');
        const updatedEndDate = moment(endDate).format('YYYY-MM-DD');
        const updateChoice = {
          startDate: updatedStartDate,
          endDate: updatedEndDate,
          pickup,
          dropoff,
        };
        // console.log(updateChoice);
        await this._userModel.findOneAndUpdate(
          { _id: userId },
          { $set: { choices: updateChoice, nearby: nearBy } },
        );
        return res.status(200).json({ message: 'Success' });
      } else {
        // this.tempChoice = choisedto;
      }
      // res.status(200).json({ message: 'Success' });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Servet Error' });
    }
  }

  async getVehicles(
    @Res() res: Response,
    @Req() req: Request,
    filter?: any,
    page?: number,
  ) {
    try {
      const perPage = 3;
      const currPage = Number(page) || 1;
      const skip = perPage * (currPage - 1);
      const userDetails = await this._userModel.findById({
        _id: req.body.userId,
      });
      // filter.location = new RegExp(userDetails.choices.pickup, 'i');
      const vehicles = await this._vehicleModel.aggregate([
        {
          $lookup: {
            from: 'bookings',
            localField: '_id',
            foreignField: 'vehicleId',
            as: 'bookings',
          },
        },
        {
          $match: {
            $expr: {
              $not: {
                $anyElementTrue: [
                  {
                    $map: {
                      input: '$bookings',
                      as: 'booking',
                      in: {
                        $and: [
                          {
                            $lte: [
                              '$$booking.startDate',
                              userDetails.choices.startDate,
                            ],
                          },
                          {
                            $gte: [
                              '$$booking.endDate',
                              userDetails.choices.endDate,
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
            isVerified: true,
          },
        },
        {
          $match: {
            location: {
              $in: userDetails.nearby,
            },
          },
        },
        {
          $match: filter,
        },
        {
          $skip: skip,
        },
        {
          $limit: perPage,
        },
      ]);
      const count = await this._vehicleModel
        .find({ isVerified: true })
        .countDocuments();
      const totalPage = Math.ceil(count / perPage);
      // console.log(vehicles, totalPage);
      res.status(200).send({ vehicles, totalPage });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Error' });
    }
  }

  async booking(createbookingdto: CreateBookingDto, @Res() res: Response) {
    try {
      let bookingDetails;
      const {
        userId,
        vehicleId,
        razorId,
        pickup,
        dropoff,
        startDate,
        endDate,
        total,
        grandTotal,
        paymentMethod,
      } = createbookingdto;
      if (paymentMethod == 'wallet') {
        await this._userModel.findOneAndUpdate(
          { _id: userId },
          { $inc: { wallet: -total } },
        );
      } else if (paymentMethod == 'razor n wallet') {
        const remain = total - grandTotal;
        await this._userModel.findOneAndUpdate(
          { _id: userId },
          { $inc: { wallet: -remain } },
        );
      }
      await this._userModel.findOneAndUpdate(
        { _id: userId },
        { $unset: { choices: 1 } },
      );
      if (razorId) {
        bookingDetails = await this._bookingModel.create({
          userId,
          vehicleId,
          razorId: razorId.razorpay_payment_id,
          pickup,
          dropoff,
          startDate,
          endDate,
          total,
          grandTotal,
          paymentMethod,
        });
      } else {
        bookingDetails = await this._bookingModel.create({
          userId,
          vehicleId,
          pickup,
          dropoff,
          startDate,
          endDate,
          total,
          grandTotal,
          paymentMethod,
        });
      }

      return res.status(200).json({ bookingId: bookingDetails._id });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async getBooking(@Res() res: Response, bookingid: string) {
    try {
      const bookingDetails = await this._bookingModel
        .find({ _id: bookingid })
        .populate('userId')
        .populate('vehicleId');
      return res.status(200).json(bookingDetails);
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async userbookings(@Res() res: Response, @Req() req: Request) {
    try {
      const userId = req.body.userId;
      const booking = await this._bookingModel
        .find({ userId: userId })
        .populate('vehicleId')
        .sort({ _id: -1 });
      res.status(200).send(booking);
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async updateUserProfile(
    @Res() res: Response,
    @Req() req: Request,
    file: any,
  ) {
    try {
      const userId = req.body.userId;
      await this._userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { profile: file.filename } },
      );
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async updateUser(
    @Res() res: Response,
    @Req() req: Request,
    updateuserdto: UpdateUserDto,
  ) {
    try {
      const userid = req.body.userId;
      const { name, phone } = updateuserdto;
      await this._userModel.findOneAndUpdate(
        { _id: userid },
        { $set: { name: name, phone: phone } },
      );
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async changePass(@Res() res: Response, @Req() req: Request, data: any) {
    try {
      const userid = req.body.userId;
      const { oldpass, newpass, confirmpass } = data;
      const userData = await this._userModel.findOne({ _id: userid });
      const passMatch = await bcrypt.compare(oldpass, userData.password);
      if (confirmpass !== newpass) {
        return res
          .status(403)
          .json({ message: 'New password and confirm password doent match' });
      }
      if (!passMatch) {
        return res.status(400).json({ message: 'Incorrect old password' });
      }
      const samePass = await bcrypt.compare(newpass, userData.password);
      if (samePass) {
        return res
          .status(403)
          .json({ message: 'New password cannot be same as old password' });
      }
      const hashPass = await bcrypt.hash(newpass, 10);
      await this._userModel.findOneAndUpdate(
        { _id: userid },
        { $set: { password: hashPass } },
      );
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async cancelBooking(
    @Res() res: Response,
    @Req() req: Request,
    reason: string,
    refund: number,
    refundvia: string,
    bookId: string,
  ) {
    try {
      if (refundvia == 'wallet') {
        const userid = req.body.userId;
        await this._bookingModel.findOneAndUpdate(
          { _id: bookId },
          { $set: { status: 'cancelled', reason: reason } },
        );
        await this._userModel.findOneAndUpdate(
          { _id: userid },
          { $inc: { wallet: refund } },
        );
        res.status(200).json({ message: 'Success' });
      } else {
        const booking = await this._bookingModel.findOne({ _id: bookId });
        console.log(booking);
        // instance.payments
        //   .refund(booking.razorId, {
        //     amount: refund.toString(),
        //     speed: 'optimum',
        //     receipt: 'Receipt No. 31',
        //   })
        //   .then((res) => {
        //     console.log(res);
        //   })
        //   .catch((err) => {
        //     console.log(err);
        //   });
        console.log('Nothing for now!!');
      }
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async postReview(
    @Res() res: Response,
    @Req() req: Request,
    vid: string,
    rating: number,
    review: string,
  ) {
    try {
      const userid = req.body.userId;
      const u = await this._vehicleModel
        .findOneAndUpdate(
          { _id: vid },
          { $push: { review: { userId: userid, review, rating } } },
          { new: true },
        )
        .exec();
      return res.status(201).json({ message: 'updated', u });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async deleteReview(@Res() res: Response, vid: string, rid: string) {
    try {
      await this._vehicleModel.findOneAndUpdate(
        { _id: vid },
        { $pull: { review: { _id: rid } } },
      );
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async forgotpassword(@Res() res: Response, email: string) {
    try {
      const existEmail = await this._userModel.findOne({ email: email });
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
      return this._mailer.sendMail({
        to: email,
        from: process.env.DEV_MAIL,
        subject: 'WheelsOnDemand Forgot Password',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333333;">Forgot Your Password?</h2>
              <p style="color: #666666;">No worries! It happens to the best of us. Click the link below to reset your password:</p>
              <p>
                  <a href="http://localhost:4200/reset-password/${id}" style="display: inline-block; padding: 10px 20px; font-size: 16px; text-decoration: none; background-color: #007BFF; color: #ffffff; border-radius: 5px;">Reset Password</a>
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
    userId: string,
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
      await this._userModel.findOneAndUpdate(
        { _id: userId },
        { $set: { password: hashpass } },
      );
      res.status(HttpStatus.OK).json({ message: 'Success' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async isBooked(@Res() res: Response, @Req() req: Request, vid: string) {
    try {
      const userid = req.body.userId;
      const booking = await this._bookingModel.findOne({
        vehicleId: vid,
        userId: userid,
        status: 'completed',
      });
      const hasCompletedBooking = !!booking;
      res.status(HttpStatus.OK).json({ hasCompletedBooking });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      res.cookie('jwt', '', { maxAge: 0 });
      res.status(200).json({ message: 'Logged out succesfully' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }
}
