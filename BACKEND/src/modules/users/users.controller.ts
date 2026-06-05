import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/authenticated-user.type';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { buildAuditRequestContext } from '../audit/audit.types';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Roles('superadmin')
  @Post('admins')
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return await this.usersService.createAdmin(
      createAdminDto,
      currentUser.sub,
      buildAuditRequestContext(request, {
        userId: currentUser.sub,
      }),
    );
  }

  @Roles('superadmin')
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return await this.usersService.updateRole(
      Number(id),
      updateUserRoleDto.role,
      currentUser.sub,
      buildAuditRequestContext(request, {
        userId: currentUser.sub,
      }),
    );
  }
}
