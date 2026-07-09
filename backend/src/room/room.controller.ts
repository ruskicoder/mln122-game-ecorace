import { Controller, Post, Get, Body, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post('create')
  async createRoom(@Body() body: { adminUsername: string }) {
    if (!body.adminUsername || body.adminUsername.trim() === '') {
      throw new BadRequestException('Tên Admin không được để trống');
    }
    return this.roomService.createRoom(body.adminUsername.trim());
  }

  @Get('validate/:roomId')
  async validateRoom(@Param('roomId') roomId: string) {
    if (!roomId) {
      throw new BadRequestException('Mã phòng không được để trống');
    }
    const result = await this.roomService.validateRoom(roomId);
    if (!result.exists) {
      throw new NotFoundException('Mã phòng không tồn tại');
    }
    return result;
  }
}
