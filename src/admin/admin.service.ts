import { Injectable, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Admin } from './schemas/admin.schema';
import { AdminLoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Host } from 'src/host/schemas/host.schemas';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { Vehicles } from './schemas/vehicles.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User')
    private userModel: Model<User>,
    @InjectModel('Admin')
    private adminModel: Model<Admin>,
    @InjectModel('Host')
    private hostModel: Model<Host>,
    @InjectModel('Vehicles')
    private vehicleModel: Model<Vehicles>,
    private jwtservice: JwtService,
    private mailService: MailerService,
  ) {}

  async AdminLogin(logindto: AdminLoginDto, @Res() res: Response) {
    try {
      const { email, password } = logindto;
      const user = await this.adminModel.findOne({ email: email });

      if (!user) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      const passMatch = await bcrypt.compare(password, user.password);
      if (!passMatch) {
        return res.status(401).send({ message: 'Wrong Password' });
      }
      const payload = { id: user._id, role: 'admin' };
      const token = this.jwtservice.sign(payload);
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
  //     const token = this.jwtservice.sign(payload);
  //     res.cookie('jwt', token, {
  //       httpOnly: true,
  //       maxAge: 24 * 60 * 60 * 1000,
  //     });
  //     return { token };
  //   } catch (error) {
  //     res.status(500).json({ message: 'Internal Error' });
  //   }
  // }

  async blockuser(id: string, @Res() res: Response) {
    try {
      const user = await this.userModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this.userModel.findByIdAndUpdate(
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
      const user = await this.userModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this.userModel.findByIdAndUpdate(
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
      const user = await this.userModel.find({});
      return user;
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async blockhost(id: string, @Res() res: Response) {
    try {
      const user = await this.hostModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this.hostModel.findByIdAndUpdate(
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
      const user = await this.hostModel.findById({ _id: id });
      if (!user) {
        throw new UnauthorizedException('No user found');
      }
      await this.hostModel.findByIdAndUpdate(
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
      const host = await this.hostModel.find({});
      return host;
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async verifyHost(id: any, @Res() res: Response) {
    try {
      const hostData = await this.hostModel.findOne({ _id: id });
      await this.hostModel.findByIdAndUpdate(
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
    return this.mailService.sendMail({
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
      const hostData = await this.hostModel.findOne({ _id: id });
      console.log(hostData);
      // await this.hostModel.findOneAndDelete({ _id: id });
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
    return this.mailService.sendMail({
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
    createVehicle: CreateVehicleDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const { name, brand, model, transmission, fuel, price } = createVehicle;
      const cookie = req.cookies['jwtAdmin'];
      const claims = this.jwtservice.verify(cookie);
      await this.vehicleModel.create({
        name,
        transmission,
        model,
        fuel,
        brand,
        price,
        createdBy: claims.id,
      });
      res.status(200).json({ message: 'Success' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async uploadVehicleImage(files: any, id: string) {
    // const response = [];
    for (const f of files) {
      await this.vehicleModel.findOneAndUpdate(
        { _id: id },
        { $push: { images: f.filename } },
      );
    }
    return 'succes';
  }

  async getAllVehicles(@Res() res: Response) {
    try {
      const vehicles = await this.vehicleModel.find({});
      // res.status(200).json({ vehicles: vehicles, message: 'Success' });
      res.send(vehicles);
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
