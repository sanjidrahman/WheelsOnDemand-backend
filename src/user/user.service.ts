import { JwtService } from '@nestjs/jwt';
import { Injectable, Req, Res } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  tempUser: any;
  tempChoice: any;
  otpgenetated: any;
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel('Vehicle')
    private vehicleModel: Model<Vehicles>,
    @InjectModel('Booking')
    private bookingModel: Model<Booking>,
    private jwtservice: JwtService,
    private mailer: MailerService,
  ) {}

  async signup(
    signupdto: Signupdto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { name, email, phone, password, confirmPass } = signupdto;

      const existmail = await this.userModel.findOne({ email: email });

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

      console.log(this.otpgenetated);
      res.status(200).json({ message: 'Success' });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Email is registered!' });
      }
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async verifyOtp(@Res({ passthrough: true }) res: Response, otp: any) {
    try {
      const otpb = otp.otp;
      if (this.otpgenetated == otpb) {
        const user = await this.userModel.create(this.tempUser);
        if (user) {
          const payload = { id: user._id, role: 'user' };
          const token = this.jwtservice.sign(payload);
          res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
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
    return this.mailer.sendMail({
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
      const user = await this.userModel.findOne({ email: email });

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
      const token = this.jwtservice.sign(payload);
      res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      return { token };
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async googleReg(user: any, @Res() res: Response) {
    try {
      const email = user.email;
      const userData = await this.userModel.findOne({ email });

      if (!userData) {
        res
          .status(404)
          .json({ message: 'Account not found , Please Register' });
      } else {
        const token = this.jwtservice.sign({ id: userData._id, role: 'user' });
        res.cookie('jwt', token, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
        });
        return { token };
      }
    } catch (error) {
      throw new Error('Failed to verify Google Sign-In');
    }
  }

  async getUser(@Req() req: Request, @Res() res: Response) {
    try {
      const cookie = req.cookies['jwt'];
      console.log(cookie);

      const claims = this.jwtservice.verify(cookie);

      const user = this.userModel.findById({ _id: claims.id });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...data } = (await user).toJSON();

      res.send(data);
    } catch (err) {
      throw new Error('Failed to get user');
    }
  }

  async storeChoices(@Res() res: Response, choisedto: ChoiseDto) {
    try {
      if (choisedto.userId) {
        const { userId, startDate, endDate, pickup, dropoff } = choisedto;
        const updatedStartDate = moment(startDate).format('YYYY-MM-DD');
        const updatedEndDate = moment(endDate).format('YYYY-MM-DD');
        const updateChoice = {
          startDate: updatedStartDate,
          endDate: updatedEndDate,
          pickup,
          dropoff,
        };
        await this.userModel.findOneAndUpdate(
          { _id: userId },
          { $set: { choices: updateChoice } },
        );
        res.status(200).json({ message: 'Success' });
      } else {
        this.tempChoice = choisedto;
        console.log(this.tempChoice);
      }
    } catch (err) {
      return res.status(500).json({ message: 'Internal Servet Error' });
    }
  }

  async getVehicles(@Res() res: Response, @Req() req: Request, filter?: any) {
    console.log(filter);
    try {
      const userDetails = await this.userModel.findById({
        _id: req.body.userId,
      });
      const vehicles = await this.vehicleModel.aggregate([
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
            $match: {},
          },
        },
      ]);

      // const vehicles = await this.vehicleModel.aggregate([
      //   {
      //     $lookup: {
      //       from: 'bookings',
      //       localField: '_id',
      //       foreignField: 'vehicleId',
      //       as: 'Booked',
      //     },
      //   },
      //   {
      //     $match: {
      //       $not: {
      //         $elemMatch: {
      //           $and: [
      //             { $lte: ['$Booked.startDate', userDetails.choices.startDate] },
      //             { $gte: ['$Booked.endDate', userDetails.choices.endDate] },
      //           ],
      //         },
      //       },
      //     },
      //   },
      // ]);
      // console.log(vehicles);
      res.status(200).send({ vehicles });
    } catch (err) {
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async booking(createbookingdto: CreateBookingDto, @Res() res: Response) {
    try {
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
      } = createbookingdto;
      await this.userModel.findOneAndUpdate(
        { _id: userId },
        { $unset: { choices: 1 } },
      );
      const bookingDetails = await this.bookingModel.create({
        userId,
        vehicleId,
        razorId: razorId.razorpay_payment_id,
        pickup,
        dropoff,
        startDate,
        endDate,
        total,
        grandTotal,
      });
      res.status(200).json({ bookingId: bookingDetails._id });
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async getBooking(@Res() res: Response, bookingid: string) {
    try {
      const bookingDetails = await this.bookingModel
        .find({ _id: bookingid })
        .populate('userId')
        .populate('vehicleId');
      return res.status(200).send(bookingDetails);
    } catch (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async userbookings(@Res() res: Response, @Req() req: Request) {
    try {
      const userId = req.body.userId;
      const booking = await this.bookingModel
        .find({ userId: userId })
        .populate('vehicleId');
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
      const token = req.cookies['jwt'];
      const claims = this.jwtservice.verify(token);
      const update = await this.userModel.findOneAndUpdate(
        { _id: claims.id },
        { $set: { profile: file.filename } },
      );
      console.log(update);
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
      await this.userModel.findOneAndUpdate(
        { _id: userid },
        { $set: { name: name, phone: phone } },
      );
      res.status(200).json({ message: 'Success' });
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
