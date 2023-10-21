/* eslint-disable @typescript-eslint/no-unused-vars */
import { Host } from './schemas/host.schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Res } from '@nestjs/common';
import { CreateHostDto } from './dto/create-host.dto';
import { UpdateHostDto } from './dto/update-host.dto';
import { Response } from 'express';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '@nestjs-modules/mailer';
import * as otpgenerater from 'otp-generator';
import { LoginHostDto } from './dto/login-host.dto';
import { JwtService } from '@nestjs/jwt';
import { stringify } from 'circular-json';

@Injectable()
export class HostService {
  tempHost!: any;
  otpgenerated!: any;
  constructor(
    @InjectModel('Host')
    private hostModel: Model<Host>,
    private mailServive: MailerService,
    private jwtservice: JwtService,
  ) {}

  async create(createHostDto: CreateHostDto, @Res() res: Response) {
    try {
      const { name, email, password, phone, confirmPass } = createHostDto;
      console.log(name, email, password, phone, confirmPass);
      const existmail = await this.hostModel.findOne({ email: email });
      console.log(existmail);
      const existNumber = await this.hostModel.findOne({ phone: phone });
      console.log(existNumber);
      if (existmail) {
        return res.status(400).json({ message: 'Email exists' });
      }
      if (existNumber) {
        return res
          .status(400)
          .json({ message: 'Phone number already registered' });
      }

      if (name && email && password && phone && confirmPass) {
        this.otpgenerated = await otpgenerater.generate(4, {
          digits: true,
          upperCaseAlphabets: false,
          lowerCaseAlphabets: false,
          specialChars: false,
        });
        console.log(this.otpgenerated);
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
      res.status(500).json({ message: 'Internal Error' });
    }
  }

  async otpverify(otp: any, @Res() res: Response) {
    try {
      const otpg = otp.otp;
      if (this.otpgenerated == otpg) {
        const host = await this.hostModel.create(this.tempHost);
        if (host) {
          const payload = { id: host._id, role: 'host' };
          const token = this.jwtservice.sign(payload);
          res.cookie('jwtHost', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
          });
          res.status(200).json({ token, message: 'Success' });
        }
      }
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async sendMail(name: string, email: string, otp: any) {
    return this.mailServive.sendMail({
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
      const hostData = await this.hostModel.findOne({ email: email });
      console.log(stringify(hostData, null, 2));
      if (hostData) {
        if (!hostData.isBlocked) {
          if (hostData.isVerified) {
            console.log(hostData.isVerified);
            const passMatch = await bcrypt.compare(password, hostData.password);
            if (passMatch) {
              const payload = { id: hostData._id, role: 'host' };
              const token = this.jwtservice.sign(payload);
              res.cookie('jwtHost', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
              });
              return res.status(200).json({ message: 'Logged Successfully' });
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
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async getAll(@Res() res: Response) {
    try {
      const hosts = await this.hostModel.find({});
      return { hosts };
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  async uplaodDoc(file: any, @Res() res: Response, id: any) {
    try {
      const response = {
        originalname: file.originalname,
        filename: file.filename,
      };
      const userup = await this.hostModel.updateOne(
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

  findOne(id: number) {
    return `This action returns a #${id} host`;
  }

  update(id: number, updateHostDto: UpdateHostDto) {
    return `This action updates a #${id} host`;
  }

  remove(id: number) {
    return `This action removes a #${id} host`;
  }
}
